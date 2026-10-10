import type WebSocket from "ws"
import { rooms, sessions } from "./state.js"
import pool from "../config/db.config.js"
import requireRole from "./guard.js"
import Room from "./room.js"

export function leaveRoom(socket: WebSocket) {
    const session = sessions.get(socket)
    if (!session?.roomId) return

    const roomId = session.roomId
    delete session.roomId          // dobara leave/close pe double user_left na jaye

    const room = rooms.get(roomId)
    if (!room) return

    // same user's newer tab is in the room, don't remove it
    if (room.participants.get(session.userId)?.socket !== socket) return

    room.removeParticipant(session.userId)

    if (room.participants.size === 0) {
        rooms.delete(roomId)
    } else {
        room.broadcast("user_left", {
            userId: session.userId,
            username: session.username,
            participants: room.getParticipants()
        })
    }
}

async function eventHandler(data: WebSocket.RawData, socket: WebSocket) {
    try {
        const msg = JSON.parse(data.toString())

        switch (msg.event) {
            case "join_room": {
                const user = sessions.get(socket)
                if (!user) return

                const code = msg.data.code

                const result = await pool.query('SELECT * FROM rooms WHERE code = $1', [code])
                const row = result.rows[0]
                if (!row) {
                    socket.send(JSON.stringify({ event: "error", data: "room doesn't exist" }))
                    break
                }
                leaveRoom(socket)
                let room = rooms.get(row.id)
                if (!room) {
                    room = new Room(row.id, code)
                    rooms.set(row.id, room)
                }
                let role = room.roles.get(user.userId)
                if (!role) {
                    role = row.host_id === user.userId ? 'Host' : 'Participant'
                    room.roles.set(user.userId, role)
                }
                const participant = {
                    userId: user.userId,
                    username: user.username,
                    role,
                    socket
                }

                room.addParticipant(participant)
                user.roomId = row.id
                socket.send(JSON.stringify({
                    event: "sync_state",
                    data: {
                        participants: room.getParticipants(),
                        playState: room.playState,
                        videoId: room.videoId,
                        currentTime: room.getCurrentTime()
                    }
                }))

                room.broadcast('user_joined', { userId: user.userId, username: user.username, role, participants: room.getParticipants() })
                break
            }
            case 'play': {
                const ctx = requireRole(socket, ['Host', 'Moderator'])
                if (!ctx) break;
                const room = ctx.room
                if (!room) break;
                if (room.playState !== 'playing') {
                    room.playState = 'playing'
                    room.updatedAt = Date.now()
                }

                room.broadcast('play', { playState: room.playState, currentTime: room.getCurrentTime(), videoId: room.videoId })
                break;
            }
            case 'pause': {
                const ctx = requireRole(socket, ['Host', 'Moderator'])
                if (!ctx) break;
                const room = ctx.room
                if (!room) break;
                if (room.playState === 'playing') {
                    const now = Date.now()
                    room.currentTime += (now - room.updatedAt) / 1000
                    room.playState = 'paused'
                    room.updatedAt = now
                }

                room.broadcast('pause', { playState: room.playState, currentTime: room.getCurrentTime(), videoId: room.videoId })
                break;
            }
            case 'seek': {
                const ctx = requireRole(socket, ['Host', 'Moderator'])
                if (!ctx) break;
                const room = ctx.room
                if (!room) break;
                const time = msg.data?.time
                if ((!Number.isFinite(time)) || time < 0) {
                    socket.send(JSON.stringify({ event: "error", data: "Invalid time" }))
                    break;
                }
                room.currentTime = time
                room.updatedAt = Date.now()

                room.broadcast('seek', { playState: room.playState, currentTime: room.getCurrentTime(), videoId: room.videoId })
                break;
            }
            case 'change_video': {
                const ctx = requireRole(socket, ['Host', 'Moderator'])
                if (!ctx) break;
                const room = ctx.room
                if (!room) break;
                const videoId = msg.data?.videoId
                if (!(typeof videoId === 'string') || videoId.trim().length === 0) {
                    socket.send(JSON.stringify({ event: "error", data: "Invalid videoId" }))
                    break;
                }
                room.videoId = videoId
                room.currentTime = 0
                room.playState = 'paused'
                room.updatedAt = Date.now()

                room.broadcast('change_video', { playState: room.playState, currentTime: room.getCurrentTime(), videoId: room.videoId })
                break;
            }
            case 'assign_role': {
                const ctx = requireRole(socket, ['Host'])
                if (!ctx) break;
                const room = ctx.room

                const { userId, role } = msg.data ?? {}
                if (role !== 'Moderator' && role !== 'Participant') {
                    socket.send(JSON.stringify({ event: "error", data: "Invalid role" }))
                    break;
                }

                const target = room.participants.get(userId)
                if (!target) {
                    socket.send(JSON.stringify({ event: "error", data: "User not in room" }))
                    break;
                }
                if (target.role === 'Host') {
                    socket.send(JSON.stringify({ event: "error", data: "Can't change Host's role" }))
                    break;
                }

                room.roles.set(userId, role)
                target.role = role

                room.broadcast('role_assigned', {
                    userId,
                    username: target.username,
                    role,
                    participants: room.getParticipants()
                })
                break;
            }
            case 'remove_participant': {
                const ctx = requireRole(socket, ['Host'])
                if (!ctx) break;
                const room = ctx.room

                const userId = msg.data?.userId
                const target = room.participants.get(userId)
                if (!target) {
                    socket.send(JSON.stringify({ event: "error", data: "User not in room" }))
                    break;
                }
                if (userId === ctx.participant.userId) {
                    socket.send(JSON.stringify({ event: "error", data: "Can't remove yourself" }))
                    break;
                }

                // 1. removed user ko pehle batao (baad mein wo room mein nahi hoga)
                target.socket.send(JSON.stringify({
                    event: 'participant_removed',
                    data: { userId, participants: room.getParticipants() }
                }))

                // 2. room se hatao aur role bhi bhoolo
                room.removeParticipant(userId)
                room.roles.delete(userId)

                // 3. uska connection band karo
                target.socket.close(4001, 'removed by host')

                // 4. baaki sabko batao
                room.broadcast('participant_removed', {
                    userId,
                    participants: room.getParticipants()
                })
                break;
            }
            case 'leave_room': {
                leaveRoom(socket)
                break;
            }
            default:
                socket.send(JSON.stringify({ event: "error", data: "unknown event" }))
        }
    } catch (error) {
        socket.send(JSON.stringify({ event: "error", data: "invalid message" }))
    }
}


export default eventHandler;
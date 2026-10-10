import type WebSocket from "ws"
import { rooms, sessions } from "./state.js"
import type { Participant } from "./types.js"

function requireRole(socket: WebSocket, allowedRoles: Participant['role'][]) {
    const session = sessions.get(socket)
    const room = session?.roomId ? rooms.get(session.roomId) : undefined
    const participant = session && room ? room.participants.get(session.userId) : undefined

    if (!room || !participant) {
        socket.send(JSON.stringify({ event: "error", data: "join a room first" }))
        return null
    }

    if (!allowedRoles.includes(participant.role)) {
        socket.send(JSON.stringify({ event: "error", data: "not allowed" }))
        return null
    }

    return { room, participant }
}

export default requireRole;
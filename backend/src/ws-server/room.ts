import type { Participant, RoomEvents } from "./types.js"

class Room {
    roomId: string
    code: string
    participants: Map<string, Participant>
    roles: Map<string, Participant['role']>
    videoId: string | null
    playState: 'playing' | 'paused'
    currentTime: number
    updatedAt: number

    constructor(roomId: string, code: string) {
        this.roomId = roomId
        this.code = code
        this.participants = new Map<string, Participant>()
        this.roles = new Map<string, Participant['role']>()
        this.videoId = null
        this.playState = 'paused'
        this.currentTime = 0
        this.updatedAt = Date.now()
    }

    addParticipant(participant: Participant) {
        this.participants.set(participant.userId, participant)
    }


    removeParticipant(userId: string) {
        this.participants.delete(userId)
    }

    getParticipants(): {
        userId: string,
        username: string,
        role: 'Host' | 'Moderator' | 'Participant'
    }[] {
        return [...this.participants.values()].map(({
            userId, username, role
        }) => (
            { userId, username, role }
        ))
    }

    broadcast(event: RoomEvents, data: unknown) {
        const message = JSON.stringify({ event, data });

        for (const participant of this.participants.values()) {
            if (participant.socket.readyState === WebSocket.OPEN) {
                participant.socket.send(message);
            }
        }
    }

    getCurrentTime(): number {
        if (this.playState === 'playing') {
            return this.currentTime + (Date.now() - this.updatedAt) / 1000
        }
        return this.currentTime
    }

}

export default Room
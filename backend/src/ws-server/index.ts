import http from 'http'
import WebSocket, { WebSocketServer } from 'ws';
import { sessions } from './state.js';
import authenticate from './auth.js';
import eventHandler, { leaveRoom } from './eventHandler.js';







async function initWSServer(httpServer: http.Server) {
    const wss = new WebSocketServer({ noServer: true })

    httpServer.on('upgrade', async (req, socket, head) => {
        const user = await authenticate(req.headers.cookie)

        if (!user) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
            socket.destroy()
            return
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            sessions.set(ws, { userId: user.id, username: user.username })
            wss.emit("connection", ws, req)
        })
    })


    wss.on("connection", (socket) => {
        socket.on("message", (data: WebSocket.RawData) => {
            eventHandler(data, socket)
        })

        socket.on("close", () => {
            leaveRoom(socket)
            sessions.delete(socket)
        })

        socket.on("error", console.error)
    })
}

export default initWSServer
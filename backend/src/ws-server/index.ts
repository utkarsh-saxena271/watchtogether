import http from 'http'

import jwt, { type JwtPayload } from 'jsonwebtoken'
import { parseCookie } from "cookie";
import { WebSocketServer } from 'ws';
import pool from '../config/db.config.js';


async function authenticate(cookieHeader : string | undefined) {
    try {
        const {token} = parseCookie(cookieHeader?? '')
        if (!token) return null
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
        const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [decoded.userId])
        return (result.rows[0] as { id: string, username: string } | undefined) ?? null
    } catch (error) {
        return null
    }
}

async function initWSServer(httpServer : http.Server) {
    const wss = new WebSocketServer({noServer:true})
    
    httpServer.on('upgrade', async (req, socket, head) => {
        const user = await authenticate(req.headers.cookie)    

         if (!user) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
            socket.destroy()
            return
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection",ws,req)
        })
    })

    wss.on("connection", (socket) => {
        // socket.on()
    })
}

export default initWSServer

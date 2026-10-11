import jwt, { type JwtPayload } from 'jsonwebtoken'
import pool from "../config/db.config.js"

async function authenticate(ticket: string | null) {
    try {
        if (!ticket) return null
        const decoded = jwt.verify(ticket, process.env.JWT_SECRET!) as JwtPayload
        if (decoded.purpose !== "ws") return null
        const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [decoded.userId])
        return (result.rows[0] as { id: string, username: string } | undefined) ?? null
    } catch (error) {
        return null
    }
}

export default authenticate;
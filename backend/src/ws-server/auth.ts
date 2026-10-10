import { parseCookie } from "cookie"
import jwt, { type JwtPayload } from 'jsonwebtoken'
import pool from "../config/db.config.js"
async function authenticate(cookieHeader: string | undefined) {
    try {
        const { token } = parseCookie(cookieHeader ?? '')
        if (!token) return null
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
        const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [decoded.userId])
        return (result.rows[0] as { id: string, username: string } | undefined) ?? null
    } catch (error) {
        return null
    }
}

export default authenticate;
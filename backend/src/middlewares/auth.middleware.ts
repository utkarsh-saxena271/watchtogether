import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user: {
                userId:string
            }
        }
    }
}

const authMiddleware: RequestHandler = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) {
        return res.status(401).json({ message: "Not logged in" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
        req.user = {userId: decoded.userId}
        next()
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" })
    }
}

export default authMiddleware
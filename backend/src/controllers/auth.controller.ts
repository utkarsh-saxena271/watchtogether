import type { RequestHandler } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import pool from "../config/db.config.js";


export const signupController: RequestHandler = async (req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ message: "username, email and password are required" })
        }

        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (user.rows.length > 0) {
            return res.status(400).json({
                message: "User already exists, please log in"
            })
        }

        const hash_pass = await bcrypt.hash(password, 10)

        const create = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [username, email, hash_pass]);

        return res.status(201).json({
            message: "User signed up successfully",
            data: {
                id: create.rows[0].id,
                username,
                email
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}




export const loginController: RequestHandler = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" })
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        const user = result.rows[0]

        const valid = user && await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" })

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: "Logged in successfully",
            data: { id: user.id, username: user.username, email: user.email }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export const logoutController: RequestHandler = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
        })
        res.status(200).json({
            message: "Logged out successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


export const getMeController: RequestHandler = async (req, res) => {
    try {
        const { userId } = req.user
        const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId])
        const user = result.rows[0]

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json({
            message: "User fetched successfully",
            data: {
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}
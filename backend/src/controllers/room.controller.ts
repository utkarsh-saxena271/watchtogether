import type { RequestHandler } from "express";
import { randomInt } from "crypto"
import pool from "../config/db.config.js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // no 0, O, 1, I, L
const CODE_LENGTH = 6

export const generateRoomCode = (): string => {
    let code = ""
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += ALPHABET[randomInt(ALPHABET.length)]
    }
    return code
}

export const createRoomController: RequestHandler = async(req,res) => {
    try {
        const userId = req.user.userId
        const code = generateRoomCode()

        const result = await pool.query('INSERT INTO rooms (code, host_id) VALUES ($1, $2) RETURNING *',[code, userId])

        const room = result.rows[0];
        return res.status(201).json({
            message:"room created successfully",
            data:{
                roomId: room.id,
                roomCode: room.code
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
}


export const joinRoomController: RequestHandler = async(req,res) => {
    try {
        const {code} = req.body

        const result = await pool.query('SELECT * FROM rooms WHERE code = $1',[code])

        if(result.rows.length === 0) {
            return res.status(404).json({
                message:"Room doesn't exist"
            })
        }

        const room = result.rows[0];
        return res.status(200).json({
            message:"room joined successfully",
            data:{
                roomId: room.id,
                roomCode: room.code
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
}
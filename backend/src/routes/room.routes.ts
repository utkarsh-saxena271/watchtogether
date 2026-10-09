import { Router } from "express";
import { createRoomController, joinRoomController } from "../controllers/room.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const roomRouter = Router();


roomRouter.post('/create',authMiddleware, createRoomController)
roomRouter.post('/join',authMiddleware, joinRoomController)


export default roomRouter;
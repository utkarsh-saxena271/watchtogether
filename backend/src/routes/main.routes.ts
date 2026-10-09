import { Router } from "express";
import authRouter from "./auth.routes.js";
import roomRouter from "./room.routes.js";

const mainRouter = Router();


mainRouter.use('/auth', authRouter)
mainRouter.use('/rooms', roomRouter)


export default mainRouter;


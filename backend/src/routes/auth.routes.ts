import { Router } from "express";
import { getMeController, loginController, logoutController, signupController } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const authRouter = Router();


authRouter.post('/signup', signupController)
authRouter.post('/login', loginController)
authRouter.post('/logout',authMiddleware, logoutController)
authRouter.get('/me', authMiddleware, getMeController)


export default authRouter;
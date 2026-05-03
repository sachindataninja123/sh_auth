import express from "express";
import { getMe, registerController } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerController);
authRouter.get("/get-me", getMe);

export default authRouter;

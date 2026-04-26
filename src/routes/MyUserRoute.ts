import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// /api/my/user
router.get("/", jwtCheck as any, jwtParse, MyUserController.getCurrentUser);
router.post("/", jwtCheck as any, MyUserController.createCurrentUser);
router.put(
  "/",
  jwtCheck as any,
  jwtParse,
  validateMyUserRequest,
  MyUserController.updateCurrentUser
);

export default router;

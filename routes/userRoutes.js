import express from "express";
import { logIn, logOut, signup, updateUser } from "../controllers/userController.js";
import { protectRoute } from "../middlewares/ProtectRoute.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/login",logIn);
router.post("/logout",logOut);
router.put("/update/:id",protectRoute,updateUser)

export default router;
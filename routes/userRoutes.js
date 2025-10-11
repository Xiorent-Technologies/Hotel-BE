import express from "express";
import { getUser, getVendors, logIn, logOut, signup, updateUser } from "../controllers/userController.js";
import { protectRoute } from "../middlewares/ProtectRoute.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/login",logIn);
router.post("/logout",logOut);
router.put("/update/:id",protectRoute,updateUser);
router.get("/get-user",protectRoute,getUser);
router.get("/vendors",getVendors);

export default router;
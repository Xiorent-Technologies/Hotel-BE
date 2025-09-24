import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { createHotel, getAllHotels } from "../controllers/hotelController.js";

const router  = express.Router()

router.post("/create-hotel",protectRoute,createHotel);
router.get("/get-all-hotels",getAllHotels);


export default router;
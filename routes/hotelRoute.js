import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { createHotel, getAllHotels, getRandom, RateUs, vendorHotels } from "../controllers/hotelController.js";

const router  = express.Router()

router.post("/create-hotel",createHotel);
router.get("/get-hotels",getAllHotels);
router.get("/get-random",getRandom)
router.post("/review/:hotelId",RateUs);
router.get("/vendor-hotels/:vendorId",vendorHotels);


export default router;
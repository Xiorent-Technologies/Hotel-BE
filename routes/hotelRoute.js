import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { createHotel, getAllHotels, getRandom } from "../controllers/hotelController.js";

const router  = express.Router()

router.post("/create-hotel",protectRoute,createHotel);
router.get("/get-hotels",getAllHotels);
router.get("/get-random",getRandom)


export default router;
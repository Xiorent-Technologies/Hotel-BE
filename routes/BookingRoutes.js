import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { bookRoom, getAllBookings } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/book-now",protectRoute,bookRoom);
router.get("/get-bookings/:hotelId",protectRoute,getAllBookings)

export default router;

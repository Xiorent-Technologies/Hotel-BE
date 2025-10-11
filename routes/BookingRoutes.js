import express from "express";
import { bookRoom, confirmation, getAllBookings, getMonthlyBookings, totalBookings, vendorEarnings } from "../controllers/bookingController.js";
import { protectRoute } from "../middlewares/ProtectRoute.js";

const router = express.Router();

router.post("/book-now",bookRoom);
router.get("/get-bookings/:hotelId",getAllBookings)
router.get("/confirm-booking/:bookingId",confirmation);
router.get("/get-earnings",protectRoute,vendorEarnings);
router.get("/get-monthly-bookings/:hotelId",getMonthlyBookings);
router.get("/total-bookings",totalBookings);

export default router;

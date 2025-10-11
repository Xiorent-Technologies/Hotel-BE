import express from "express";
import { createRefund, fetchRefunds } from "../controllers/refundController.js";

const router = express.Router();

router.post("/request/:bookingId",createRefund);
router.get("/fetch-refunds",fetchRefunds);

export default router;
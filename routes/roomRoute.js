import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { createRoom, getAllRooms, getRoomDetails, getRoomsGroupedByType } from "../controllers/roomController.js";


const router  = express.Router()

router.post("/create-room",protectRoute,createRoom);
router.get("/get-all-rooms",getAllRooms);
router.get("/get-roomtypes/:hotelId",protectRoute,getRoomsGroupedByType);
router.get("/get-room-details/:id",getRoomDetails)


export default router;


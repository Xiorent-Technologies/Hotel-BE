import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { createRoom, getAllRooms, getHotelRooms, getRoomDetails, getRoomsGroupedByType, vendorRooms } from "../controllers/roomController.js";


const router  = express.Router()

router.post("/create-room",protectRoute,createRoom);
router.get("/get-all-rooms",getAllRooms);
router.get("/get-roomtypes/:hotelId",getRoomsGroupedByType);
router.get("/get-hotel-rooms/:hotelId",getHotelRooms) 
router.get("/get-room-details/:id",getRoomDetails)
router.get("/total-vendor-rooms",protectRoute,vendorRooms)


export default router;


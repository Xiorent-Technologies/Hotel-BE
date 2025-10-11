import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { dailyOccupancy, getDailyVisitorsController, getVacancy } from "../controllers/vacancyController.js";

const router = express.Router();

router.get("/get-vacancies/:roomId",protectRoute,getVacancy)
router.post("/daily-visitors/:hotelId",getDailyVisitorsController);
router.post("/get-daily-occupancy/:hotelId",dailyOccupancy)

export default router;
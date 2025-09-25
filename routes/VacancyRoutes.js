import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import { getVacancy } from "../controllers/vacancyController.js";

const router = express.Router();

router.get("/get-vacancies/:roomId",protectRoute,getVacancy)

export default router;
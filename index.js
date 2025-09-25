import express from "express";
import userRoutes from "./routes/userRoutes.js"
import hotelRoutes from "./routes/hotelRoute.js"
import roomRoutes from "./routes/roomRoute.js"
import bookingRoutes from "./routes/BookingRoutes.js"
import vacancyRoutes from "./routes/VacancyRoutes.js"
import cors from "cors"
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";


const app = express()


dotenv.config();
connectDB();


const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // frontend Vite URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);



app.use("/api/auth",userRoutes);
app.use("/api/hotel",hotelRoutes);
app.use("/api/room",roomRoutes);
app.use("/api/bookings",bookingRoutes)
app.use("/api/vacancy",vacancyRoutes);

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})
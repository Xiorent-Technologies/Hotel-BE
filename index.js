import express from "express";
import userRoutes from "./routes/userRoutes.js"
import hotelRoutes from "./routes/hotelRoute.js"
import roomRoutes from "./routes/roomRoute.js"
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";


const app = express()


dotenv.config();
connectDB();


const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth",userRoutes);
app.use("/api/hotel",hotelRoutes);
app.use("/api/room",roomRoutes);

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})
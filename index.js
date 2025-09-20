import express from "express";
import testRoutes from "./routes/testRoutes.js";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";


const app = express()

dotenv.config();
connectDB();


const PORT = process.env.PORT || 5000;


app.use("/api/test",testRoutes);

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})
import Rooms from "../models/RoomModel.js";
import RoomAvailability from "../models/RoomVacantModel.js";

export const getVacancy = async(req,res) => {
    try{

        const {roomId} = req.params;
        
        const room = await Rooms.findById(roomId);
        if(!room){
            return res.status(404).json({message : "room not found"});
    }
    
    const dates = await RoomAvailability.find({roomId})
    
    
    return res.status(200).json(
        dates.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        status: d.status,
        availableRooms: d.availableRooms,
        price: d.price,
    }))
);
} catch(error){
    console.error("Error fetching vacancy:", error);
    res.status(500).json({ message: "Server error" });
}
}
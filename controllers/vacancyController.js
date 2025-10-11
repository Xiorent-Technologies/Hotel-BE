import Rooms from "../models/RoomModel.js";
import RoomAvailability from "../models/RoomVacantModel.js";


export const getDailyVisitors = async (selectedDate, hotelId = null) => {
  try {
    // Convert selected date to start of day
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    // Calculate start date (7 days before)
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 6); // -6 because we include the selected date
    startDate.setHours(0, 0, 0, 0);

    // Build query - removed status filter
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add hotel filter if provided
    if (hotelId) {
      query.hotelId = hotelId;
    }

    // Fetch room availability data with populated room details
    const bookings = await RoomAvailability.find(query)
      .populate('roomId', 'capacity') // Populate capacity object from Room
      .sort({ date: 1 })
      .lean();

    // Initialize result object with all 7 days
    const dailyVisitorsMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyVisitorsMap[dateKey] = {
        date: dateKey,
        visitors: 0,
        roomsBooked: 0
      };
    }

    // Calculate visitors for each date using capacity.total
    bookings.forEach(booking => {
      const dateKey = new Date(booking.date).toISOString().split('T')[0];
      
      if (dailyVisitorsMap[dateKey] && booking.roomId && booking.roomId.capacity) {
        dailyVisitorsMap[dateKey].visitors += booking.roomId.capacity.total;
        dailyVisitorsMap[dateKey].roomsBooked += 1;
      }
    });

    // Convert map to array
    const dailyVisitors = Object.values(dailyVisitorsMap);

    return {
      success: true,
      data: dailyVisitors,
      summary: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalVisitors: dailyVisitors.reduce((sum, day) => sum + day.visitors, 0),
        totalRoomsBooked: dailyVisitors.reduce((sum, day) => sum + day.roomsBooked, 0)
      }
    };

  } catch (error) {
    console.error('Error calculating daily visitors:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getDailyVisitorsController = async (req, res) => {
  try {
    const {hotelId} = req.params;
    const { date } = req.body;

    // Validate date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get daily visitors
    const result = await getDailyVisitors(selectedDate, hotelId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in getDailyVisitorsController:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

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



export const dailyOccupancy = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: "Please select a date" });
    }

    const targetDate = new Date(date);

    // Create fresh date objects so we don’t mutate `targetDate`
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const roomsBooked = await RoomAvailability.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.status(200).json({
      success: true,
      date,
      occupiedRooms: roomsBooked.length,
    });
  } catch (error) {
    console.error("Error fetching occupancy:", error);
    res.status(500).json({ message: "Server error" });
  }
};


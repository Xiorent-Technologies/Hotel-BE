import mongoose from "mongoose";

const roomAvailabilitySchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rooms',
    required: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold_out'],
    default: 'available'
  },
  availableRooms: {
    type: Number,
    default: 0
  },
  price: Number,
}, {
  timestamps: true
});

const RoomAvailability = mongoose.model("RoomAvailability",roomAvailabilitySchema);
export default RoomAvailability
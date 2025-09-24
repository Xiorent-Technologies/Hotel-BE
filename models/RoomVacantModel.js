import mongoose from "mongoose";

const roomAvailabilitySchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
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
    enum: ['available', 'sold_out', 'blocked'],
    default: 'available'
  },
  availableRooms: {
    type: Number,
    default: 0
  },
  price: Number, // Dynamic pricing override
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String // maintenance, renovation, etc.
}, {
  timestamps: true
});

const RoomAvailability = mongoose.model("RoomAvailability",roomAvailabilitySchema);
export default RoomAvailability
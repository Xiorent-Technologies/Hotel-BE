import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'suite', 'family', 'deluxe'],
    required: true
  },
  description: String,
  capacity: {
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  basePrice: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 0
  },
  amenities: [String],
  images: [String],
  cancellationRules: {
    freeCancellationHours: { type: Number, default: 24 },
    cancellationFee: { type: Number, default: 0 },
    nonRefundable: { type: Boolean, default: false }
  },
  totalRooms: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Rooms = mongoose.model("Rooms",roomSchema);
export default Rooms;
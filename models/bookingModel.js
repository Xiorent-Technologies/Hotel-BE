import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  dates: {
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true }
  },
  guests: {
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },
    details: [{
      name: String,
      age: Number
    }]
  },
  guestDetails: {
    primaryGuest: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    idProof: {
      type: String,
      number: String,
      imageUrl: String
    },
    specialRequests: String
  },
  pricing: {
    basePrice: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    extraCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    totalAmount: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  cancellation: {
    requested: { type: Boolean, default: false },
    requestedAt: Date,
    reason: String,
    refundAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending'
    },
    processedAt: Date
  },
  commission: {
    rate: Number,
    adminAmount: Number,
    vendorAmount: Number
  },
},{
    timestamps : true
})

const Bookings = mongoose.model("Booking",BookingSchema);
export default Bookings;
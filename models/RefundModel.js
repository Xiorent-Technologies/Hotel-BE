import mongoose from "mongoose";

const RefundSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  // Reference details
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true
  },

  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rooms",
    required: true
  },

  guestDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },

  refundDetails: {
    amountRequested: { type: Number, required: true },
    amountActual: { type: Number, default: 0 },
    reason: { type: String, required: true },
  },

//   refundMethod: {
//     type: String,
//     enum: ["original_payment", "bank_transfer", "wallet_credit", "manual_adjustment"],
//     default: "original_payment"
//   },

  refundStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", "processed", "failed"],
    default: "pending"
  },

}, {
  timestamps: true
});

const Refunds = mongoose.model("Refund", RefundSchema);
export default Refunds;

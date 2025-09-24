import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'pay_at_hotel', 'wallet'],
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'cash'],
    required: true
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  gatewayResponse: Object,
  refunds: [{
    amount: Number,
    reason: String,
    processedAt: Date,
    transactionId: String
  }]
}, {
  timestamps: true
});

const Payments = mongoose.model("Payments",paymentSchema);
export default Payments
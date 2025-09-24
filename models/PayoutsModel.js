import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: { type: Date, required: true }, // Monthly period
  totalBookings: { type: Number, default: 0 },
  totalEarnings: { type: Number, required: true },
  commissionDeducted: { type: Number, required: true },
  payoutAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionId: String,
  statementUrl: String, // PDF statement URL
  paidAt: Date
}, {
  timestamps: true
});

const payout = mongoose.model("Payouts",payoutSchema);
export default payout;
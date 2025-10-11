import Bookings from "../models/bookingModel.js";
import Refunds from "../models/RefundModel.js";

export const createRefund = async (req, res) => {
  try {
    const {bookingId} = req.params;
    const { amountRequested, reason } = req.body;

    const booking = await Bookings.findById(bookingId).populate("hotelId roomId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const existingRefund = await Refunds.findOne({ bookingId });
    if (existingRefund) {
      return res.status(400).json({ success: false, message: "Refund already requested for this booking" });
    }

    const refundData = {
      bookingId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      guestDetails: {
        firstName: booking.guestDetails.firstName,
        lastName: booking.guestDetails.lastName,
        email: booking.guestDetails.email,
        phone: booking.guestDetails.phone,
      },
      refundDetails: {
        amountRequested,
        reason,
        amountActual : booking.pricing.totalAmount
      },
    //   refundMethod: refundMethod || "original_payment",
    };

    const refund = await Refunds.create(refundData);

    booking.cancellation = {
      ...booking.cancellation,
      requested: true,
      requestedAt: new Date(),
      reason,
      refundAmount: amountRequested,
      status: "pending",
    };

    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      data: refund
    });

  } catch (error) {
    console.error("Error creating refund:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const fetchRefunds = async(req,res) => {
    try {
        const refunds = await Refunds.find({});
        return res.status(200).json(refunds);
    } catch (error) {
        console.error("Error fetching refund:", error);
      return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
    }
}
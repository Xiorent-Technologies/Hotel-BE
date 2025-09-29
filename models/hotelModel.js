import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  amenities: {
    type: [String],
    enum: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Air Conditioning",
      "Ocean View Balcony",
      "Gym",
      "Hot Tub",
      "Spa",
      "Restaurant",
      "Bar",
      "All Inclusive meals",
      "Parking",
    ],
    default: []
  },
  policies: {
    checkInTime: String,
    checkOutTime: String,
    cancellationPolicy: {
      type: String,
      enum: ['free', 'moderate', 'strict'],
      default: 'moderate'
    },
    petPolicy: Boolean,
    childPolicy: String,
    specialNotes: String
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rating: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  paymentOptions: {
    payAtHotel: { type: Boolean, default: false },
    onlinePayment: { type: Boolean, default: true }
  }
},{
  timestamps: true
})

const Hotel = mongoose.model("Hotel",hotelSchema);
export default Hotel;
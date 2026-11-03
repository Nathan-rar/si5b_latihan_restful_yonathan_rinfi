const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

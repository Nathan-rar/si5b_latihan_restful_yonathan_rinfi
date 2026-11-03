const mongoose = require("mongoose");

const meetingReservationSchema = new mongoose.Schema(
  {
    ruang: { type: String, required: true, trim: true, maxlength: 120 },
    tanggal: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    jamMulai: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    durasiJam: { type: Number, required: true, min: 0.1 },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    pemesan: {
      nama: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
  },
  { timestamps: true },
);

meetingReservationSchema.index({ tanggal: 1, ruang: 1 });
meetingReservationSchema.index({ "pemesan.nama": 1 });

module.exports = mongoose.models.MeetingReservation || mongoose.model("MeetingReservation", meetingReservationSchema);

const dotenv = require("dotenv");
dotenv.config({ path: process.env.ENV_FILE || ".env.local" });
const express = require("express");
const mongoose = require("mongoose");
const Customer = require("./models/Customer");
const MeetingReservation = require("./models/MeetingReservation");

const app = express();
app.use(express.json());

mongoose.set("bufferCommands", false);
const mongoUri = process.env.MONGODB_URI;
const ready = mongoUri
  ? mongoose.connect(mongoUri).then(async () => {
      await Promise.all([Customer.init(), MeetingReservation.init()]);
    })
  : Promise.reject(new Error("MONGODB_URI belum dikonfigurasi"));
ready.catch((error) => console.error(`MongoDB belum siap: ${error.message}`));

app.use(async (req, res, next) => {
  try {
    await ready;
    next();
  } catch {
    res.status(503).json({ status: "error", message: "Database belum terhubung. Atur MONGODB_URI.", data: null });
  }
});

app.ready = ready;
app.closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateReservation(body) {
  for (const field of ["namaPemesan", "ruang"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) return `Field ${field} wajib diisi dengan teks`;
  }
  if (!isValidDate(body.tanggal)) return "Field tanggal wajib berformat YYYY-MM-DD dan berisi tanggal yang valid";
  if (typeof body.jamMulai !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.jamMulai)) return "Field jamMulai wajib berformat HH:mm yang valid";
  if (typeof body.durasiJam !== "number" || !Number.isFinite(body.durasiJam) || body.durasiJam <= 0) return "Field durasiJam wajib berupa angka lebih dari 0";
  if (body.emailPemesan !== undefined && (typeof body.emailPemesan !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailPemesan))) return "Field emailPemesan wajib berupa email yang valid";
  return null;
}

function getReservationFields(body) {
  return { ruang: body.ruang.trim(), tanggal: body.tanggal, jamMulai: body.jamMulai, durasiJam: body.durasiJam };
}

function buildReservationFilter(query) {
  const filter = {};
  for (const field of ["ruang", "tanggal", "jamMulai"]) if (query[field] !== undefined) filter[field] = query[field];
  if (query.namaPemesan) filter["pemesan.nama"] = { $regex: query.namaPemesan, $options: "i" };
  if (query.q) filter.$or = [{ ruang: { $regex: query.q, $options: "i" } }, { "pemesan.nama": { $regex: query.q, $options: "i" } }];
  return filter;
}

function parseListOptions(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const allowedSort = new Set(["ruang", "tanggal", "jamMulai", "durasiJam", "createdAt", "namaPemesan"]);
  const sort = {};
  for (const item of String(query.sort || "-createdAt").split(",")) {
    const key = item.startsWith("-") ? item.slice(1) : item;
    if (allowedSort.has(key)) sort[key === "namaPemesan" ? "pemesan.nama" : key] = item.startsWith("-") ? -1 : 1;
  }
  if (!Object.keys(sort).length) sort.createdAt = -1;
  const allowedProjection = new Set(["ruang", "tanggal", "jamMulai", "durasiJam", "pemesan", "pemesan.nama", "customerId", "createdAt", "updatedAt", "namaPemesan"]);
  const fields = String(query.fields || "").split(",").map((field) => field.trim()).filter((field) => allowedProjection.has(field));
  const projection = fields.length ? fields.reduce((obj, field) => { obj[field === "namaPemesan" ? "pemesan.nama" : field] = 1; return obj; }, { _id: 1, customerId: 1 }) : undefined;
  return { page, limit, sort, projection };
}

function serializeReservation(reservation) {
  const item = reservation.toObject ? reservation.toObject({ virtuals: false }) : reservation;
  const customerId = item.customerId && item.customerId._id ? item.customerId._id : item.customerId;
  return { ...item, id: String(item._id), customerId: customerId ? String(customerId) : null, namaPemesan: item.pemesan && item.pemesan.nama };
}

app.get("/", (req, res) => res.json({
  namaMahasiswa: "Yonathan Rinfi", nim: "2428240101", kelas: "SI5B", nomorTopik: 28,
  namaTopik: "Coworking Space - Reservasi Ruang Rapat",
  endpoints: ["GET /meeting-reservations", "GET /meeting-reservations/:id", "POST /meeting-reservations", "PUT /meeting-reservations/:id", "DELETE /meeting-reservations/:id"],
  queryOptions: { filter: "ruang,tanggal,jamMulai,namaPemesan,q", pagination: "page,limit", sort: "sort=tanggal,-createdAt", projection: "fields=ruang,tanggal,pemesan.nama" },
}));

app.get("/meeting-reservations", async (req, res, next) => {
  try {
    const { page, limit, sort, projection } = parseListOptions(req.query);
    const filter = buildReservationFilter(req.query);
    const [data, total] = await Promise.all([
      MeetingReservation.find(filter, projection).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      MeetingReservation.countDocuments(filter),
    ]);
    res.json({ status: "success", data: data.map(serializeReservation), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

app.get("/meeting-reservations/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    const reservation = await MeetingReservation.findById(req.params.id).populate("customerId", "nama email").lean();
    if (!reservation) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    res.json(serializeReservation(reservation));
  } catch (error) { next(error); }
});

app.post("/meeting-reservations", async (req, res, next) => {
  try {
    const body = req.body || {};
    const validationError = validateReservation(body);
    if (validationError) return res.status(400).json({ status: "error", message: validationError, data: null });
    const nama = body.namaPemesan.trim();
    const email = typeof body.emailPemesan === "string" && body.emailPemesan.trim() ? body.emailPemesan.trim().toLowerCase() : `${nama.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@reservasi.local`;
    const customer = await Customer.findOneAndUpdate({ email }, { $set: { nama } }, { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true });
    const reservation = await MeetingReservation.create({ ...getReservationFields(body), customerId: customer._id, pemesan: { nama: customer.nama, email: customer.email } });
    res.status(201).json({ status: "success", message: "Data reservasi berhasil ditambahkan", data: serializeReservation(reservation) });
  } catch (error) { next(error); }
});

app.put("/meeting-reservations/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const validationError = validateReservation(body);
    if (validationError) return res.status(400).json({ status: "error", message: validationError, data: null });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    const reservation = await MeetingReservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    const nama = body.namaPemesan.trim();
    const email = typeof body.emailPemesan === "string" && body.emailPemesan.trim() ? body.emailPemesan.trim().toLowerCase() : reservation.pemesan.email;
    const customer = await Customer.findOneAndUpdate({ email }, { $set: { nama } }, { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true });
    Object.assign(reservation, getReservationFields(body), { customerId: customer._id, pemesan: { nama: customer.nama, email: customer.email } });
    await reservation.save();
    res.json({ status: "success", message: "Data reservasi berhasil diperbarui", data: serializeReservation(reservation) });
  } catch (error) { next(error); }
});

app.delete("/meeting-reservations/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    const reservation = await MeetingReservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ status: "error", message: "Data reservasi tidak ditemukan", data: null });
    res.json({ status: "success", message: "Data reservasi berhasil dihapus", data: null });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan", data: null }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.name === "ValidationError" || err.name === "CastError" || err.code === 11000) return res.status(400).json({ status: "error", message: err.message, data: null });
  const isMalformedJson = err instanceof SyntaxError && err.status === 400 && "body" in err;
  res.status(isMalformedJson ? 400 : 500).json({ status: "error", message: isMalformedJson ? "Format JSON request tidak valid" : "Terjadi kesalahan pada server", data: null });
});

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;
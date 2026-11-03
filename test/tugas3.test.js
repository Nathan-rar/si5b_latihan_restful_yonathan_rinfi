const chaiHttp = require("chai-http");
const { MongoMemoryServer } = require("mongodb-memory-server");
const chai = require("chai");
chai.should();

let mongo;
let app;
let server;
let baseUrl;

before(async function () {
  this.timeout(120000);
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("paw3_test");
  process.env.NODE_ENV = "test";
  app = require("../app");
  await app.ready;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async function () {
  this.timeout(30000);
  if (server) await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  if (app) await app.closeDatabase();
  if (mongo) await mongo.stop();
});

describe("Tugas 3 MongoDB query features", () => {
  it("creates reservation with referenced customer and embedded customer snapshot", async () => {
    const response = await chaiHttp.request.execute(baseUrl).post("/meeting-reservations").send({
      namaPemesan: "PT Mongo Test",
      emailPemesan: "mongo@example.com",
      ruang: "Ruang Kenanga",
      tanggal: "2026-11-10",
      jamMulai: "09:00",
      durasiJam: 2,
    });

    chai.expect(response.status).to.equal(201);
    chai.expect(response.body.data).to.have.property("customerId");
    chai.expect(response.body.data.pemesan.nama).to.equal("PT Mongo Test");
  });

  it("supports filtering, pagination, sorting, and projection", async () => {
    await chaiHttp.request.execute(baseUrl).post("/meeting-reservations").send({
      namaPemesan: "PT Mongo Test 2", ruang: "Ruang Melati", tanggal: "2026-11-11", jamMulai: "10:00", durasiJam: 1,
    });
    const response = await chaiHttp.request.execute(baseUrl).get("/meeting-reservations?ruang=Ruang%20Kenanga&page=1&limit=1&sort=-tanggal&fields=ruang,tanggal,pemesan.nama");

    chai.expect(response.status).to.equal(200);
    chai.expect(response.body.data).to.be.an("array").with.length(1);
    chai.expect(response.body.pagination).to.deep.equal({ page: 1, limit: 1, total: 1, totalPages: 1 });
    chai.expect(response.body.data[0]).to.have.property("ruang");
    chai.expect(response.body.data[0]).not.to.have.property("jamMulai");
    chai.expect(response.body.data[0].namaPemesan).to.equal("PT Mongo Test");
  });
});

const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("RESERVATIONS endpoints", () => {
  describe("GET /api/reservations", () => {
    it("should return 200 and an array of reservations for logged user", async () => {
      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/reservations");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/reservations", () => {
    it("should create a reservation", async () => {
      const res = await request(app)
        .post("/api/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          itemId: 1
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/reservations/:id/cancel", () => {
    it("should cancel a reservation", async () => {
      const res = await request(app)
        .put("/api/reservations/1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).ToContain(res.statusCode);
    });
  });
});

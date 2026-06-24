const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("ORDERS endpoints", () => {
  describe("GET /api/orders", () => {
    it("should return 200 and an array of orders for logged user", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/orders", () => {
    it("should create an order", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          itemId: 1,
          final_price: 200
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          final_price: 200
        });

      expect([400, 422]).toContain(res.statusCode);
    });
  });
});

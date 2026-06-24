const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("REPORTS endpoints", () => {
  describe("GET /api/reports", () => {
    it("should return 200 and an array of reports for moderator/admin", async () => {
      const res = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/reports", () => {
    it("should create a report", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          reason: "Comportamiento inapropiado",
          fk_items_id: 1,
          fk_user_reported: 2
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("reason");
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          reason: "Comportamiento inapropiado"
        });

      expect([400, 422]).toContain(res.statusCode);
    });
  });
});

const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("CONVERSATIONS endpoints", () => {
  describe("GET /api/conversations", () => {
    it("should return 200 and an array of conversations", async () => {
      const res = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/conversations", () => {
    it("should create a conversation", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          itemId: 1,
          sellerId: 2
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("id_conversations");
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          itemId: 1
        });

      expect([400, 422]).toContain(res.statusCode);
    });
  });
});

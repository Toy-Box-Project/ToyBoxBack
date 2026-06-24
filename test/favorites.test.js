const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("FAVORITES endpoints", () => {
  describe("GET /api/favorites", () => {
    it("should return 200 and an array of favorites for logged user", async () => {
      const res = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/favorites");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/favorites", () => {
    it("should add a favorite", async () => {
      const res = await request(app)
        .post("/api/favorites")
        .set("Authorization", `Bearer ${token}`)
        .send({
          itemId: 1
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/favorites/:id", () => {
    it("should remove a favorite", async () => {
      const res = await request(app)
        .delete("/api/favorites/1")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

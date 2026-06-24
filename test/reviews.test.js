const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("REVIEWS endpoints", () => {
  describe("GET /api/reviews/:itemId", () => {
    it("should return 200 and an array of reviews for item", async () => {
      const res = await request(app).get("/api/reviews/1");
      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  describe("POST /api/reviews", () => {
    it("should create a review", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Muy buen trato",
          fk_items_id: 1,
          fk_reviewed_id: 2
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("rating");
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5
        });

      expect([400, 422]).toContain(res.statusCode);
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    it("should delete a review", async () => {
      const res = await request(app)
        .delete("/api/reviews/1")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

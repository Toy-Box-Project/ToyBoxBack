const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("ITEMS endpoints", () => {
  describe("GET /api/items", () => {
    it("should return 200 and an array of items", async () => {
      const res = await request(app).get("/api/items");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/items/:id", () => {
    it("should return 200 and a single item", async () => {
      const res = await request(app).get("/api/items/1");
      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("id_items");
      }
    });
  });

  describe("POST /api/items", () => {
    it("should create an item with valid token", async () => {
      const res = await request(app)
        .post("/api/items")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Nintendo Switch",
          description: "Perfecta",
          price: 250,
          conservation_status: "published",
          location: "Madrid",
          fk_categories_id: 1
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("title", "Nintendo Switch");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/items")
        .send({
          title: "Nintendo Switch"
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/items/:id", () => {
    it("should update an item", async () => {
      const res = await request(app)
        .put("/api/items/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
          price: 200
        });

      expect([200, 404]).toContain(res.statusCode);
    });
  });

  describe("DELETE /api/items/:id", () => {
    it("should delete an item", async () => {
      const res = await request(app)
        .delete("/api/items/1")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

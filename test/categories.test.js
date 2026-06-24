const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("CATEGORIES endpoints", () => {
  describe("GET /api/categories", () => {
    it("should return 200 and an array", async () => {
      const res = await request(app).get("/api/categories");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/categories", () => {
    it("should create a category with admin token", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Juguetes",
          description: "Categoría de juguetes"
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("name", "Juguetes");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({
          name: "Juguetes"
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should update a category", async () => {
      const res = await request(app)
        .put("/api/categories/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Juguetes actualizados",
          description: "Nueva descripción"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("name", "Juguetes actualizados");
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should delete a category", async () => {
      const res = await request(app)
        .delete("/api/categories/1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
});

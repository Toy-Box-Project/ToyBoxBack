const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("USERS endpoints", () => {
  describe("GET /api/users/me", () => {
    it("should return 200 and user data with valid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id_users");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/users", () => {
    it("should return 200 and an array for admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 403 for non-admin role", async () => {
      const jwt = require("jsonwebtoken");
      const userToken = jwt.sign(
        { id_users: 2, role: "user" },
        "mi_contraseña_pruebas",
        { expiresIn: "1y" }
      );

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("PUT /api/users/me", () => {
    it("should update profile and return 200", async () => {
      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          first_name: "Luna",
          last_name: "González",
          phone: 666777888
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("first_name", "Luna");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .put("/api/users/me")
        .send({
          first_name: "Luna"
        });

      expect(res.statusCode).toBe(401);
    });
  });
});

const request = require("supertest");
const app = require("../src/app");

describe("AUTH endpoints", () => {
  describe("POST /api/auth/login", () => {
    it("should return 200 and a token with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "luna@example.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should return 400 if body is incomplete", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "luna@example.com"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should return 401 if credentials are invalid", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "luna@example.com",
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/auth/register", () => {
    it("should return 201 when registering a valid user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          first_name: "Test",
          last_name: "User",
          email: "testuser@example.com",
          password: "123456",
          user_birthday: "1990-01-01",
          user_province: "Madrid",
          user_city: "Madrid",
          user_zipcode: "28001"
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("id_users");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "testuser@example.com"
        });

      expect(res.statusCode).toBe(400);
    });
  });
});

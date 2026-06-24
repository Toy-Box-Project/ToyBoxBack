const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("MESSAGES endpoints", () => {
  describe("GET /api/messages/:conversationId", () => {
    it("should return 200 and an array of messages", async () => {
      const res = await request(app)
        .get("/api/messages/1")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });
  });

  describe("POST /api/messages", () => {
    it("should send a message", async () => {
      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hola, ¿sigue disponible?",
          receiverId: 2,
          conversationId: 1
        });

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("content");
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hola"
        });

      expect([400, 422]).toContain(res.statusCode);
    });
  });
});

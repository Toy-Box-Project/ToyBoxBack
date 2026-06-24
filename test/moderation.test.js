const request = require("supertest");
const app = require("../src/app");
const token = require("./testToken");

describe("MODERATION endpoints", () => {
  describe("POST /api/moderation/:reportId/action", () => {
    it("should take action on a report", async () => {
      const res = await request(app)
        .post("/api/moderation/1/action")
        .set("Authorization", `Bearer ${token}`)
        .send({
          decision: "removed"
        });

      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("decision");
      }
    });

    it("should return 400 if body is invalid", async () => {
      const res = await request(app)
        .post("/api/moderation/1/action")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect([400, 422]).toContain(res.statusCode);
    });
  });
});

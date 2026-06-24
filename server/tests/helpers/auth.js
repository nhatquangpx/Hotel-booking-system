const request = require("supertest");
const { TEST_PASSWORD } = require("../fixtures/dbSeed");

async function loginAs(app, { email, password = TEST_PASSWORD }) {
  return request(app).post("/api/auth/login").send({ email, password });
}

async function authedRequest(app, credential, password = TEST_PASSWORD) {
  const email = typeof credential === "string" ? credential : credential.email;
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} — ${res.body?.message || ""}`);
  }
  return agent;
}

module.exports = { loginAs, authedRequest };

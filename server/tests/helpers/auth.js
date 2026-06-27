const request = require("supertest");
const { TEST_PASSWORD } = require("../fixtures/dbSeed");

function extractCsrfFromResponse(res) {
  const cookies = res.headers["set-cookie"];
  if (!cookies) return null;
  const list = Array.isArray(cookies) ? cookies : [cookies];
  for (const line of list) {
    const match = line.match(/^csrf_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

function attachCsrf(agent, token) {
  if (!token) return agent;
  for (const method of ["post", "put", "patch", "delete"]) {
    const original = agent[method].bind(agent);
    agent[method] = (url) => {
      const req = original(url);
      return req.set("X-CSRF-Token", token);
    };
  }
  return agent;
}

async function loginAs(app, { email, password = TEST_PASSWORD }) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  attachCsrf(agent, extractCsrfFromResponse(res));
  return res;
}

async function authedRequest(app, credential, password = TEST_PASSWORD) {
  const email = typeof credential === "string" ? credential : credential.email;
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} — ${res.body?.message || ""}`);
  }
  attachCsrf(agent, extractCsrfFromResponse(res));
  return agent;
}

module.exports = { loginAs, authedRequest, extractCsrfFromResponse, attachCsrf };

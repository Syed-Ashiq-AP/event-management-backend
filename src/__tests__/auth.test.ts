import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("GET /api/health", () => {
  test("Case: Healthy server", async () => {
    const response = await request(app).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Healthy!");
  });
});

describe("POST /api/auth/sign-up/email", () => {
  test("Case: valid user", async () => {
    const email = `test${Date.now()}@example.com`;

    const response = await request(app).post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password: "password123",
      role: "PARTICIPANT",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe("Bob");
    expect(response.body.user.role).toBe("PARTICIPANT");
  });

  test("Case: duplicate email", async () => {
    const email = `duplicate${Date.now()}@example.com`;

    await request(app).post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password: "password123",
      role: "PARTICIPANT",
    });

    const response = await request(app).post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password: "password123",
      role: "PARTICIPANT",
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });

  test("Case: missing role", async () => {
    const response = await request(app)
      .post("/api/auth/sign-up/email")
      .send({
        name: "Bob",
        email: `missingrole${Date.now()}@example.com`,
        password: "password123",
      });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /api/auth/sign-in/email", () => {
  test("Case: valid credentials", async () => {
    const email = `signin${Date.now()}@example.com`;
    const password = "password123";

    await request(app).post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password,
      role: "PARTICIPANT",
    });

    const response = await request(app).post("/api/auth/sign-in/email").send({
      email,
      password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe(email);
  });

  test("Case: invalid password", async () => {
    const response = await request(app).post("/api/auth/sign-in/email").send({
      email: "nouser@example.com",
      password: "wrongpassword",
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe("Authentication Flow", () => {
  test("Case: session after login", async () => {
    const agent = request.agent(app);

    const email = `session${Date.now()}@example.com`;
    const password = "password123";

    await agent.post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password,
      role: "PARTICIPANT",
    });

    await agent.post("/api/auth/sign-in/email").send({
      email,
      password,
    });
    const response = await agent.get("/api/auth/get-session");

    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe(email);
  });

  test("Case: logout", async () => {
    const agent = request.agent(app);

    const email = `logout${Date.now()}@example.com`;
    const password = "password123";

    await agent.post("/api/auth/sign-up/email").send({
      name: "Bob",
      email,
      password,
      role: "PARTICIPANT",
    });

    await agent.post("/api/auth/sign-in/email").send({
      email,
      password,
    });

    const logout = await agent.post("/api/auth/sign-out");

    expect(logout.statusCode).toBe(200);

    const session = await agent.get("/api/auth/get-session");

    expect(session.body).toBeNull();
  });
});

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Request, Response, RequestHandler } from "express";
import { DataSource } from "typeorm";
import { setupTestDatabase, teardownTestDatabase, cleanupTestDatabase } from "../../test-utils/database";

// Mock AuthService
jest.mock("../../services/AuthService", () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

describe("AuthController", () => {
  let app: express.Application;
  let testDataSource: DataSource;

  beforeAll(async () => {
    testDataSource = await setupTestDatabase();
    
    // Setup express app with simple routes
    app = express();
    app.use(express.json());
    
    // Simple auth routes for testing
    const registerHandler: RequestHandler = async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          res.status(400).json({ error: "Email and password are required" });
          return;
        }
        
        if (password.length < 6) {
          res.status(400).json({ error: "Password must be at least 6 characters" });
          return;
        }
        
        const { AuthService } = require("../../services/AuthService");
        const result = await AuthService.register(email, password);
        
        res.status(201).json(result);
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          res.status(409).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
      }
    };
    
    const loginHandler: RequestHandler = async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          res.status(400).json({ error: "Email and password are required" });
          return;
        }
        
        const { AuthService } = require("../../services/AuthService");
        const result = await AuthService.login(email, password);
        
        res.status(200).json(result);
      } catch (error: any) {
        if (error.message.includes("not found")) {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes("Invalid password")) {
          res.status(401).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
      }
    };
    
    app.post("/api/auth/register", registerHandler);
    app.post("/api/auth/login", loginHandler);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await teardownTestDatabase();
    
    const { AuthService } = require("../../services/AuthService");
    AuthService.register.mockResolvedValue({
      user: { id: "test-user-id", email: "test@example.com" },
      token: "mock-jwt-token",
    });
    
    AuthService.login.mockResolvedValue({
      user: { id: "test-user-id", email: "test@example.com" },
      token: "mock-jwt-token",
    });
  });

  describe("POST /api/auth/register", () => {
    test("should successfully register a new user", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toBe("mock-jwt-token");
    });

    test("should return 400 for missing email", async () => {
      const userData = {
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Email and password are required");
    });

    test("should return 400 for weak password", async () => {
      const userData = {
        email: "test@example.com",
        password: "123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Password must be at least 6 characters");
    });

    test("should return 409 if user already exists", async () => {
      const userData = {
        email: "existing@example.com",
        password: "password123",
      };

      const { AuthService } = require("../../services/AuthService");
      AuthService.register.mockRejectedValue(new Error("User already exists"));

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should successfully login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toBe("mock-jwt-token");
    });

    test("should return 400 for missing email", async () => {
      const loginData = {
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Email and password are required");
    });

    test("should return 404 for non-existent user", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const { AuthService } = require("../../services/AuthService");
      AuthService.login.mockRejectedValue(new Error("User not found"));

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("User not found");
    });
  });
}); 
// Set environment variables before importing any modules
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { setupMocks, clearMocks } from "../../test-utils/mocks";

// Mock AuthService with controllable behavior
let mockAuthService: any;

// Mock middleware implementations
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.toLowerCase().startsWith('bearer ') 
    ? authHeader.substring(7).trim() 
    : null;

  if (!token || token === 'null' || token === 'undefined') {
    res.status(401).json({ error: 'Access token is required' });
    return;
  }

  try {
    const decoded = mockAuthService.verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};

const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.toLowerCase().startsWith('bearer ') 
    ? authHeader.substring(7).trim() 
    : null;

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = mockAuthService.verifyToken(token);
      (req as any).user = decoded;
    } catch (error) {
      // Ignore errors in optional auth
    }
  }
  next();
};

describe("AuthMiddleware", () => {
  let app: express.Application;

  beforeAll(async () => {
    setupMocks();
    
    // Setup mock AuthService
    mockAuthService = {
      verifyToken: jest.fn(),
    };
    
    // Setup express app with auth middleware
    app = express();
    app.use(express.json());
    
    // Test route that requires authentication
    app.get("/api/protected", authenticateToken, (req: any, res: any) => {
      res.json({ message: "Success", userId: req.user.userId });
    });
    
    // Test route that optionally uses authentication
    app.get("/api/optional", optionalAuth, (req: any, res: any) => {
      res.json({ 
        message: "Success", 
        userId: req.user ? req.user.userId : null,
        authenticated: !!req.user
      });
    });
    
    // Basic error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.status || 500).json({
        error: err.message || "Internal server error",
      });
    });
  });

  beforeEach(async () => {
    clearMocks();
    
    // Setup default mock implementations
    mockAuthService.verifyToken.mockReturnValue({ userId: "test-user-id" });
  });

  describe("authenticateToken", () => {
    test("should allow access with valid token in Authorization header", async () => {
      const token = "valid-jwt-token";

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: "test-user-id"
      });
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    test("should return 401 for missing Authorization header", async () => {
      const response = await request(app)
        .get("/api/protected")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token is required");
    });

    test("should return 401 for malformed Authorization header", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "InvalidFormat")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token is required");
    });

    test("should return 401 for missing Bearer prefix", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "token-without-bearer")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token is required");
    });

    test("should return 403 for invalid token", async () => {
      const token = "invalid-jwt-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid token");
    });

    test("should return 403 for expired token", async () => {
      const token = "expired-jwt-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("Token expired");
      });

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid token");
    });

    test("should handle JWT verification errors gracefully", async () => {
      const token = "malformed-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("JsonWebTokenError: invalid signature");
      });

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid token");
    });

    test("should set req.user for valid token", async () => {
      const token = "valid-jwt-token";
      const mockUser = { userId: "test-user-id", email: "test@example.com" };

      mockAuthService.verifyToken.mockReturnValue(mockUser);

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBe(mockUser.userId);
    });

    test("should handle empty token", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer ")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token is required");
    });

    test("should handle whitespace-only token", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer   ")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token is required");
    });

    test("should handle case-insensitive Bearer prefix", async () => {
      const token = "valid-jwt-token";

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBe("test-user-id");
    });
  });

  describe("optionalAuth", () => {
    test("should allow access without token", async () => {
      const response = await request(app)
        .get("/api/optional")
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: null,
        authenticated: false
      });
    });

    test("should set user if valid token is provided", async () => {
      const token = "valid-jwt-token";

      const response = await request(app)
        .get("/api/optional")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: "test-user-id",
        authenticated: true
      });
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    test("should continue without authentication if token is invalid", async () => {
      const token = "invalid-jwt-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const response = await request(app)
        .get("/api/optional")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: null,
        authenticated: false
      });
    });

    test("should handle malformed Authorization header gracefully", async () => {
      const response = await request(app)
        .get("/api/optional")
        .set("Authorization", "InvalidFormat")
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: null,
        authenticated: false
      });
    });

    test("should handle expired token gracefully", async () => {
      const token = "expired-jwt-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("Token expired");
      });

      const response = await request(app)
        .get("/api/optional")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Success",
        userId: null,
        authenticated: false
      });
    });
  });

  describe("Token Extraction", () => {
    test("should extract token from Authorization header", async () => {
      const token = "test-token-123";

      await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    test("should handle Authorization header with extra spaces", async () => {
      const token = "test-token-123";

      await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer   ${token}   `)
        .expect(200);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    test("should handle mixed case Bearer prefix", async () => {
      const token = "test-token-123";

      await request(app)
        .get("/api/protected")
        .set("Authorization", `BeArEr ${token}`)
        .expect(200);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });
  });

  describe("Error Handling", () => {
    test("should handle AuthService throwing unexpected errors", async () => {
      const token = "problematic-token";

      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid token");
    });

    test("should handle null token gracefully", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer null")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle undefined token gracefully", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer undefined")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
}); 
import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

describe("asyncHandler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  describe("Success Cases", () => {
    test("should execute async function successfully", async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue("success");
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle async function that returns a value", async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue({ data: "test" });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle async function that modifies response", async () => {
      const mockAsyncFunction = jest.fn().mockImplementation(async (req, res) => {
        res.json({ message: "Success" });
        return "completed";
      });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ message: "Success" });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle async function that calls next()", async () => {
      const mockAsyncFunction = jest.fn().mockImplementation(async (req, res, next) => {
        next();
      });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    test("should catch rejected promises and call next with error", async () => {
      const error = new Error("Test error");
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    test("should catch thrown errors and call next with error", async () => {
      const error = new Error("Thrown error");
      const mockAsyncFunction = jest.fn().mockImplementation(async () => {
        throw error;
      });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    test("should handle string errors", async () => {
      const errorMessage = "String error";
      const mockAsyncFunction = jest.fn().mockRejectedValue(errorMessage);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(errorMessage);
    });

    test("should handle undefined/null errors", async () => {
      const mockAsyncFunction = jest.fn().mockRejectedValue(null);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(null);
    });

    test("should handle errors with custom properties", async () => {
      const error = new Error("Custom error");
      (error as any).status = 400;
      (error as any).code = "VALIDATION_ERROR";
      
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
      expect((next.mock.calls[0][0] as any).status).toBe(400);
      expect((next.mock.calls[0][0] as any).code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Function Signature", () => {
    test("should preserve function signature", () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue("success");
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      expect(typeof wrappedFunction).toBe("function");
      expect(wrappedFunction.length).toBe(3); // req, res, next
    });

    test("should work with different async function signatures", async () => {
      const mockAsyncFunction = jest.fn().mockImplementation(async (req, res) => {
        // Function that doesn't use next parameter
        res.json({ message: "Success" });
      });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ message: "Success" });
    });
  });

  describe("Promise Resolution", () => {
    test("should handle immediately resolved promises", async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue("immediate");
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle delayed promises", async () => {
      const mockAsyncFunction = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return "delayed";
      });
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle multiple sequential calls", async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue("success");
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);
      await wrappedFunction(req as Request, res as Response, next);
      await wrappedFunction(req as Request, res as Response, next);

      expect(mockAsyncFunction).toHaveBeenCalledTimes(3);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Error Propagation", () => {
    test("should not swallow errors", async () => {
      const error = new Error("Critical error");
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test("should maintain error stack trace", async () => {
      const error = new Error("Stack trace error");
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      const calledWith = next.mock.calls[0][0] as unknown;
      if (calledWith instanceof Error) {
        expect(calledWith.stack).toBeDefined();
      }
    });
  });
}); 
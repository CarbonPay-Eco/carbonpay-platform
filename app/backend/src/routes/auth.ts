import { Router } from "express";
import { AuthService } from "../services/AuthService";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, token } = await AuthService.register(email, password);
    res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    if (error.message === "User already exists") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, token } = await AuthService.login(email, password);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    if (
      error.message === "User not found" ||
      error.message === "Invalid password"
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

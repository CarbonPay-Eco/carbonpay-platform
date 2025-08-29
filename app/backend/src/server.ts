import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import client from "prom-client";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./database/data-source";
import routes from "./routes/index";
import { swaggerUi, swaggerSpec } from "./config/swagger";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Rate limiting (basic global limiter)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Prometheus metrics
client.collectDefaultMetrics();
const register = client.register;
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Main API routes (Web 2.5)
app.use("/api", routes);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
    console.log("🚀 Backend running in Web 2.5 mode");

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AppDataSource } from "./database/data-source";
import routes from "./routes/index";
import { swaggerUi, swaggerSpec } from "./config/swagger";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

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

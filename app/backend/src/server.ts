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

// Initialize database connection with retry logic
const connectDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await AppDataSource.initialize();
      
      // Run migrations if synchronize is disabled
      if (!AppDataSource.options.synchronize) {
        console.log("Running migrations...");
        const migrations = await AppDataSource.runMigrations();
        if (migrations.length > 0) {
          console.log(`Executed ${migrations.length} migration(s)`);
        }
      }
      
      console.log("Database connection established");
      return true;
    } catch (error) {
      console.error(`Error connecting to database (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Failed to connect to database after all retries");
        throw error;
      }
    }
  }
  return false;
};

connectDatabase()
  .then(() => {
    console.log("🚀 Backend running in Web 2.5 mode");

    // Start server
    const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });

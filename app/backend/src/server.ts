import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AppDataSource } from "./database/data-source";
import authRoutes from "./routes/auth";
// import transakRoutes from "./routes/transak";
import walletRoutes from "./routes/wallet";
import routes from "./routes/index";
import { swaggerUi, swaggerSpec } from "./config/swagger";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
// app.use("/transak", transakRoutes);
app.use("/wallet", walletRoutes);
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");

    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API docs available at http://localhost:${PORT}/api-docs`);
      console.log(
        `Carbon Credits Simple API at http://localhost:${PORT}/api/carbon-credits-simple/status`
      );
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

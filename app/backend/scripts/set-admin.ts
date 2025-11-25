import "reflect-metadata";
import { AppDataSource } from "../src/database/data-source";
import { User } from "../src/entities/User";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Script to set a user as admin by email
 * Usage: ts-node scripts/set-admin.ts <email>
 */
async function setAdmin(email: string) {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("Database connected");

    // Get user repository
    const userRepository = AppDataSource.getRepository(User);

    // Find user by email
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === "admin") {
      console.log(`User ${email} is already an admin`);
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Update role to admin
    user.role = "admin";
    await userRepository.save(user);

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`User ID: ${user.id}`);
    console.log(`Role: ${user.role}`);

    // Close database connection
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("Usage: ts-node scripts/set-admin.ts <email>");
  console.error("Example: ts-node scripts/set-admin.ts admin@example.com");
  process.exit(1);
}

setAdmin(email);


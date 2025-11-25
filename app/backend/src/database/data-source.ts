import "reflect-metadata";
import { DataSource } from "typeorm";
import { Wallet as OrganizationWallet } from "./entities/Wallet";
import { UserWallet } from "../entities/UserWallet";
import { Organization } from "./entities/Organization";
import { TokenizedProject } from "./entities/TokenizedProject";
import { Retirement } from "./entities/Retirement";
import { AuditLog } from "./entities/AuditLog";
import { User } from "../entities/User";
import { Purchase } from "./entities/Purchase";
import "dotenv/config";
import {
  DB_HOST,
  NODE_ENV,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} from "../config/constants";

// Define the AppDataSource
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "carbonpay",
  synchronize: process.env.NODE_ENV === "development",
  dropSchema: process.env.NODE_ENV === "development", // Force schema recreation
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    UserWallet,
    OrganizationWallet,
    Organization,
    TokenizedProject,
    Retirement,
    AuditLog,
    Purchase,
  ],
  migrations: [],
  subscribers: [],
});

export const getTestDataSource = () => {
  return new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    entities: [
      UserWallet,
      OrganizationWallet,
      Organization,
      TokenizedProject,
      Retirement,
      AuditLog,
    ],
    logging: false,
  });
};

import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { WalletService } from "./WalletService";
import { createError } from "../utils/errorHandler";

export class AuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key";
  private static readonly JWT_EXPIRES_IN = "24h";

  /**
   * Derive a server-side master password for a user
   * Uses JWT_SECRET + userId to create a consistent, server-accessible password
   */
  private static getServerMasterPassword(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const serverMasterKey = process.env.SERVER_WALLET_MASTER_KEY;
    
    // Use SERVER_WALLET_MASTER_KEY if set, otherwise derive from JWT_SECRET + userId
    if (serverMasterKey) {
      return `${serverMasterKey}-${userId}`;
    }
    return `${jwtSecret}-${userId}`;
  }

  public static async register(
    email: string,
    password: string,
    role: string = "user"
  ): Promise<{ user: User; token: string }> {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create user
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, 10);
    user.role = role;
    await userRepository.save(user);

    // Create wallet for user using server-side master key
    // This allows server to decrypt wallet for on-chain operations
    const serverMasterPassword = this.getServerMasterPassword(user.id);
    await WalletService.createWallet(user.id, serverMasterPassword);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    return { user, token };
  }

  public static async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    return { user, token };
  }

  public static async registerDraft(
    email: string,
    password: string,
    role: string = "user"
  ): Promise<{ user: User }> {
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, 10);
    user.role = role;
    user.draft = true;
    await userRepository.save(user);
    return { user };
  }

  public static async completeRegistration(
    email: string,
    fields: Partial<User>
  ): Promise<{ user: User; token: string }> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      throw createError("User not found", 404);
    }

    // Update user data
    Object.assign(user, fields);
    user.draft = false;
    await userRepository.save(user);

    // Create wallet for user if not exists (since it was created as draft)
    // Use server-side master key for consistency
    try {
      const serverMasterPassword = this.getServerMasterPassword(user.id);
      await WalletService.createWallet(user.id, serverMasterPassword);
    } catch (error) {
      // Wallet might already exist, that's ok
      console.log("Wallet already exists or error creating:", error);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    return { user, token };
  }

  public static verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { WalletService } from "./WalletService";

export class AuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key";
  private static readonly JWT_EXPIRES_IN = "24h";

  public static async register(
    email: string,
    password: string
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
    await userRepository.save(user);

    // Create wallet for user
    await WalletService.createWallet(user.id, password);

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

  public static verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

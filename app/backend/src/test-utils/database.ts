import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Wallet } from "../entities/Wallet";

export class TestDatabase {
  private static instance: DataSource | null = null;

  public static async getTestDataSource(): Promise<DataSource> {
    if (!this.instance) {
      this.instance = new DataSource({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        dropSchema: true,
        entities: [
          User,
          Wallet,
        ],
        logging: false,
      });
    }

    if (!this.instance.isInitialized) {
      await this.instance.initialize();
    }

    return this.instance;
  }

  public static async clearDatabase(): Promise<void> {
    if (this.instance && this.instance.isInitialized) {
      await this.instance.synchronize(true);
    }
  }

  public static async closeDatabase(): Promise<void> {
    if (this.instance && this.instance.isInitialized) {
      await this.instance.destroy();
      this.instance = null;
    }
  }
}

export const setupTestDatabase = async (): Promise<DataSource> => {
  const testDataSource = await TestDatabase.getTestDataSource();
  
  // Replace the actual AppDataSource with our test instance
  const originalModule = jest.requireActual("../database/data-source");
  jest.doMock("../database/data-source", () => ({
    ...originalModule,
    AppDataSource: testDataSource,
  }));

  return testDataSource;
};

export const teardownTestDatabase = async (): Promise<void> => {
  await TestDatabase.clearDatabase();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  await TestDatabase.closeDatabase();
}; 
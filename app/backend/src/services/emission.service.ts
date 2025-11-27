import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Emission } from "../database/entities/Emission";
import { User } from "../entities/User";
import { TokenizedProject } from "../database/entities/TokenizedProject";

export class EmissionService {
  private emissionRepository: Repository<Emission>;
  private userRepository: Repository<User>;
  private projectRepository: Repository<TokenizedProject>;

  constructor() {
    this.emissionRepository = AppDataSource.getRepository(Emission);
    this.userRepository = AppDataSource.getRepository(User);
    this.projectRepository = AppDataSource.getRepository(TokenizedProject);
  }

  /**
   * Create a new emission record for a user
   */
  async createEmission(
    userId: string,
    data: {
      source: string;
      amount: number;
      date: Date;
      description?: string;
      category?: string;
    }
  ): Promise<Emission> {
    // Verify user exists
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const emission = this.emissionRepository.create({
      userId,
      source: data.source,
      amount: data.amount,
      date: data.date,
      description: data.description || null,
      category: data.category || null,
      offset: 0,
      offsetProjectId: null,
      offsetRequestId: null,
    });

    return await this.emissionRepository.save(emission);
  }

  /**
   * Get all emissions for a user
   */
  async getUserEmissions(userId: string): Promise<Emission[]> {
    return await this.emissionRepository.find({
      where: { userId },
      relations: ["offsetProject"],
      order: { date: "DESC" },
    });
  }

  /**
   * Get a single emission by ID
   */
  async getEmissionById(
    emissionId: string,
    userId: string
  ): Promise<Emission | null> {
    return await this.emissionRepository.findOne({
      where: { id: emissionId, userId },
      relations: ["offsetProject"],
    });
  }

  /**
   * Update an emission record
   */
  async updateEmission(
    emissionId: string,
    userId: string,
    data: {
      source?: string;
      amount?: number;
      date?: Date;
      description?: string;
      category?: string;
    }
  ): Promise<Emission> {
    const emission = await this.getEmissionById(emissionId, userId);
    if (!emission) {
      throw new Error(`Emission with id ${emissionId} not found`);
    }

    Object.assign(emission, data);
    return await this.emissionRepository.save(emission);
  }

  /**
   * Delete an emission record
   */
  async deleteEmission(emissionId: string, userId: string): Promise<void> {
    const emission = await this.getEmissionById(emissionId, userId);
    if (!emission) {
      throw new Error(`Emission with id ${emissionId} not found`);
    }

    await this.emissionRepository.remove(emission);
  }

  /**
   * Update emission offset information after an offset request
   */
  async updateEmissionOffset(
    emissionId: string,
    userId: string,
    offsetAmount: number,
    offsetProjectId: string,
    offsetRequestId: string
  ): Promise<Emission> {
    const emission = await this.getEmissionById(emissionId, userId);
    if (!emission) {
      throw new Error(`Emission with id ${emissionId} not found`);
    }

    // Update offset amount (can be partial)
    emission.offset = Number(emission.offset) + offsetAmount;
    emission.offsetProjectId = offsetProjectId;
    emission.offsetRequestId = offsetRequestId;

    return await this.emissionRepository.save(emission);
  }

  /**
   * Get emission statistics for a user
   */
  async getEmissionStats(userId: string): Promise<{
    totalEmissions: number;
    totalOffset: number;
    remainingEmissions: number;
    offsetPercentage: number;
    emissionCount: number;
  }> {
    const emissions = await this.getUserEmissions(userId);

    const totalEmissions = emissions.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const totalOffset = emissions.reduce(
      (sum, e) => sum + Number(e.offset),
      0
    );
    const remainingEmissions = totalEmissions - totalOffset;
    const offsetPercentage =
      totalEmissions > 0 ? (totalOffset / totalEmissions) * 100 : 0;

    return {
      totalEmissions,
      totalOffset,
      remainingEmissions,
      offsetPercentage: Math.round(offsetPercentage * 100) / 100,
      emissionCount: emissions.length,
    };
  }
}


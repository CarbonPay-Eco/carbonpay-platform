import { Request, Response } from "express";
import { EmissionService } from "../services/emission.service";
import { asyncHandler } from "../utils/asyncHandler";

const emissionService = new EmissionService();

export class EmissionController {
  /**
   * Get all emissions for the authenticated user
   */
  getUserEmissions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const emissions = await emissionService.getUserEmissions(userId);
    return res.status(200).json({
      success: true,
      message: "Emissions retrieved successfully",
      data: emissions,
    });
  });

  /**
   * Get emission statistics for the authenticated user
   */
  getEmissionStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const stats = await emissionService.getEmissionStats(userId);
    return res.status(200).json({
      success: true,
      message: "Emission statistics retrieved successfully",
      data: stats,
    });
  });

  /**
   * Create a new emission record
   */
  createEmission = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { source, amount, date, description, category } = req.body;

    if (!source || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: "Source, amount, and date are required",
      });
    }

    const emission = await emissionService.createEmission(userId, {
      source,
      amount: Number(amount),
      date: new Date(date),
      description,
      category,
    });

    return res.status(201).json({
      success: true,
      message: "Emission created successfully",
      data: emission,
    });
  });

  /**
   * Update an emission record
   */
  updateEmission = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { id } = req.params;
    const { source, amount, date, description, category } = req.body;

    const updateData: any = {};
    if (source) updateData.source = source;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    const emission = await emissionService.updateEmission(id, userId, updateData);

    return res.status(200).json({
      success: true,
      message: "Emission updated successfully",
      data: emission,
    });
  });

  /**
   * Delete an emission record
   */
  deleteEmission = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { id } = req.params;
    await emissionService.deleteEmission(id, userId);

    return res.status(200).json({
      success: true,
      message: "Emission deleted successfully",
    });
  });

  /**
   * Get a single emission by ID
   */
  getEmissionById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { id } = req.params;
    const emission = await emissionService.getEmissionById(id, userId);

    if (!emission) {
      return res.status(404).json({
        success: false,
        message: "Emission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emission retrieved successfully",
      data: emission,
    });
  });
}


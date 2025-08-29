import { Request, Response } from "express";
import { RetirementService } from "../services/retirement.service";
import { OrganizationService } from "../services/organization.service";
import { AdminService } from "../services/admin.service";
import { asyncHandler } from "../utils/asyncHandler";
import { createError } from "../utils/errorHandler";

const retirementService = new RetirementService();
const organizationService = new OrganizationService();
const adminService = new AdminService();
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { Parser as Json2CsvParser } from "json2csv";

export class RetirementController {
  retireCredits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;
      const {
        projectId,
        quantity,
        beneficiary,
        retirementMessage,
        reportingPeriodStart,
        reportingPeriodEnd,
      } = req.body;

      if (!projectId || !quantity || quantity <= 0) {
        throw createError("Project ID and quantity (> 0) are required", 400);
      }

      // Get user's wallet address (backend manages this in Web 2.5)
      const walletAddress = await retirementService.getUserWalletAddress(
        userId
      );

      const retirement = await retirementService.retireCredits(
        walletAddress,
        projectId,
        quantity,
        {
          beneficiary,
          retirementMessage,
          reportingPeriodStart: reportingPeriodStart
            ? new Date(reportingPeriodStart)
            : undefined,
          reportingPeriodEnd: reportingPeriodEnd
            ? new Date(reportingPeriodEnd)
            : undefined,
        }
      );

      res.status(200).json({
        success: true,
        message: "Credits retired successfully",
        data: retirement,
      });
    }
  );

  // Public verification: check by hash or id
  verify = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, hash } = req.query as { id?: string; hash?: string };

    if (!id && !hash) {
      throw createError("Provide 'id' or 'hash'", 400);
    }

    const repo = (await import("../database/data-source")).AppDataSource.getRepository(
      (await import("../database/entities/Retirement")).Retirement
    );

    const where: any = {};
    if (id) where.id = id;
    if (hash) where.publicHash = hash;

    const item = await repo.findOne({ where, relations: ["tokenizedProject", "wallet"] });
    if (!item) {
      throw createError("Not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: item.id,
        quantity: item.quantity,
        txHash: item.txHash,
        publicHash: item.publicHash,
        project: {
          id: item.tokenizedProject.id,
          tokenId: item.tokenizedProject.tokenId,
          projectName: item.tokenizedProject.projectName,
        },
        retirementDate: item.retirementDate,
      },
    });
  });

  // Public certificate (HTML with embedded QR)
  certificateHtml = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const repo = (await import("../database/data-source")).AppDataSource.getRepository(
      (await import("../database/entities/Retirement")).Retirement
    );
    const item = await repo.findOne({ where: { id }, relations: ["tokenizedProject"] });
    if (!item) throw createError("Not found", 404);

    const verifyUrl = `${req.protocol}://${req.get("host")}/api/verify?hash=${item.publicHash}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html><html><head><meta charset='utf-8'><title>CarbonPay Certificate</title></head><body>
      <h1>Certificate of Retirement</h1>
      <p>Retirement ID: ${item.id}</p>
      <p>Project: ${item.tokenizedProject.projectName} (${item.tokenizedProject.tokenId})</p>
      <p>Quantity: ${item.quantity} tCO2e</p>
      <p>Date: ${item.retirementDate.toISOString()}</p>
      <p>Public Hash: ${item.publicHash}</p>
      <p>Verify: <a href='${verifyUrl}'>${verifyUrl}</a></p>
      <img src='${qrDataUrl}' alt='QR'>
    </body></html>`);
  });

  // Public certificate (PDF)
  certificatePdf = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const repo = (await import("../database/data-source")).AppDataSource.getRepository(
      (await import("../database/entities/Retirement")).Retirement
    );
    const item = await repo.findOne({ where: { id }, relations: ["tokenizedProject"] });
    if (!item) throw createError("Not found", 404);

    const verifyUrl = `${req.protocol}://${req.get("host")}/api/verify?hash=${item.publicHash}`;
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=certificate-${id}.pdf`);
    doc.pipe(res);
    doc.fontSize(22).text("Certificate of Retirement", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Retirement ID: ${item.id}`);
    doc.text(`Project: ${item.tokenizedProject.projectName} (${item.tokenizedProject.tokenId})`);
    doc.text(`Quantity: ${item.quantity} tCO2e`);
    doc.text(`Date: ${item.retirementDate.toISOString()}`);
    doc.text(`Public Hash: ${item.publicHash}`);
    doc.moveDown();
    doc.text(`Verify: ${verifyUrl}`);
    doc.end();
  });

  // CSV export for user's retirements
  exportMyRetirementsCsv = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const items = await retirementService.getUserRetirements(userId);
    const fields = ["id","quantity","txHash","publicHash","retirementDate","tokenizedProject.projectName","tokenizedProject.tokenId"];
    const parser = new Json2CsvParser({ fields, transforms: [ (row:any)=>({
      id: row.id,
      quantity: row.quantity,
      txHash: row.txHash,
      publicHash: row.publicHash,
      retirementDate: row.retirementDate,
      "tokenizedProject.projectName": row.tokenizedProject?.projectName,
      "tokenizedProject.tokenId": row.tokenizedProject?.tokenId,
    }) ]});
    const csv = parser.parse(items);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=retirements.csv");
    res.send(csv);
  });

  // Get user's retirements
  getUserRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;

      const retirements = await retirementService.getUserRetirements(userId);

      res.status(200).json({
        success: true,
        message: "Retirements retrieved successfully",
        data: retirements,
      });
    }
  );

  // Get retirement by ID
  getRetirementById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = req.userId!;

      const retirement = await retirementService.getRetirementById(id, userId);

      if (!retirement) {
        throw createError("Retirement not found", 404);
      }

      res.status(200).json({
        success: true,
        message: "Retirement retrieved successfully",
        data: retirement,
      });
    }
  );

  // Legacy method for compatibility
  getMyRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.userId!;

      const retirements = await retirementService.getUserRetirements(userId);

      res.status(200).json({
        success: true,
        message: "Retirements retrieved successfully",
        data: retirements,
      });
    }
  );

  // Legacy method for public retirements (can be removed if not needed)
  getPublicRetirements = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        throw createError("Wallet address is required", 400);
      }

      const retirements = await retirementService.getPublicRetirements(
        walletAddress
      );

      res.status(200).json({
        success: true,
        message: "Public retirements retrieved successfully",
        data: retirements,
      });
    }
  );
}

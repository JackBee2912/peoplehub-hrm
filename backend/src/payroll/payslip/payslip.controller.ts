import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  StreamableFile,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { PayslipService } from "./payslip.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("payroll/payslips")
@Controller("payroll/payslips")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipController {
  constructor(private service: PayslipService) {}

  @Get("my")
  @ApiOperation({ summary: "Get my payslips (employee self-service)" })
  async getMyPayslips(@CurrentUser() user: CurrentUserType) {
    const payslips = await this.service.getMyPayslips(user.tenantId, user.id);
    return successResponse(payslips);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payslip details" })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const payslip = await this.service.findById(id, user.tenantId);
    return successResponse(payslip);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download payslip PDF" })
  async download(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdfBuffer = await this.service.downloadPayslip(id, user.tenantId);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="payslip_${id}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Post(":id/generate")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Generate PDF for a payslip" })
  async generatePdf(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const { pdfPath } = await this.service.generatePdf(id, user.tenantId);
    return successResponse({ pdfPath, message: "PDF generated successfully" });
  }

  // Admin endpoint: issue all payslips for a payroll run
  @Post("issue-all/:runId")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Generate PDFs for all payslips in a payroll run" })
  async issueAll(
    @CurrentUser() user: CurrentUserType,
    @Param("runId") runId: string,
  ) {
    const results = await this.service.issueAll(runId, user.tenantId);
    return successResponse(results);
  }
}

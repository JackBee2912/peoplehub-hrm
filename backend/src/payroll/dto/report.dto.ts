import { IsOptional, IsDateString, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PayrollSummaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payPeriodId?: string;
}

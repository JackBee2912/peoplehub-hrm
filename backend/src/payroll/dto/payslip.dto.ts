import { IsString, IsOptional, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePayslipDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedDate?: string;
}

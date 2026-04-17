import { IsOptional, IsString, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class TeamAttendanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class TeamOverviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

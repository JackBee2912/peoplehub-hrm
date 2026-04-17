import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceStatus } from "@prisma/client";

export class CheckInDto {
  @ApiPropertyOptional({ description: "GPS location or office name" })
  @IsOptional()
  @IsString()
  location?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ description: "Notes for the checkout" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ description: "Filter by employee ID" })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: "Start date filter" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "End date filter" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Filter by status", enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: "Filter by department ID" })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class AttendanceStatsDto {
  @ApiPropertyOptional({ description: "Start date for stats" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "End date for stats" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

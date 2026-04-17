import { IsOptional, IsString, IsEnum, IsInt, IsNumber, IsBoolean, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ShiftType } from "@prisma/client";

export class CreateShiftDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ShiftType, default: "FIXED" })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiProperty({ description: "Start time (HH:MM)", example: "09:00" })
  @IsString()
  startTime: string;

  @ApiProperty({ description: "End time (HH:MM)", example: "18:00" })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: "Break start (HH:MM)" })
  @IsOptional()
  @IsString()
  breakStart?: string;

  @ApiPropertyOptional({ description: "Break end (HH:MM)" })
  @IsOptional()
  @IsString()
  breakEnd?: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  breakMinutes?: number;

  @ApiPropertyOptional({ default: 8.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  workHours?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lateThreshold?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  earlyLeaveThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breakStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breakEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  breakMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  workHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lateThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  earlyLeaveThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AssignShiftDto {
  @ApiProperty({ description: "Employee ID" })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: "Shift ID" })
  @IsString()
  shiftId: string;

  @ApiProperty({ description: "Start date" })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: "End date (null = ongoing)" })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Day of week (0=Sun...6=Sat) for rotating shifts", minimum: 0, maximum: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;
}

export class AssignMultipleShiftsDto {
  @ApiProperty({ description: "Employee IDs" })
  employeeIds: string[];

  @ApiProperty({ description: "Shift ID" })
  shiftId: string;

  @ApiProperty({ description: "Start date" })
  startDate: string;

  @ApiPropertyOptional({ description: "End date" })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ScheduleFilterDto {
  @ApiPropertyOptional({ description: "Start date" })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: "End date" })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

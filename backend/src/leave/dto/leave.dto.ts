import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, IsNumber, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LeaveTypeCategory } from "@prisma/client";

export class CreateLeaveTypeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: LeaveTypeCategory })
  @IsEnum(LeaveTypeCategory)
  category: LeaveTypeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  annualDays: number;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  accrualRate: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carryOverLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carryOverExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxConsecutiveDays?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresAttachment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresReason?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unpaid?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LeaveTypeCategory })
  @IsOptional()
  @IsEnum(LeaveTypeCategory)
  category?: LeaveTypeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annualDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accrualRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carryOverLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carryOverExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxConsecutiveDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresAttachment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresReason?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unpaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsString()
  leaveTypeId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  startHalfDay?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  endHalfDay?: boolean;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaveTypeId?: string;

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
  @IsBoolean()
  startHalfDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  endHalfDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ApproveLeaveDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectLeaveDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class LeaveFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaveTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdjustBalanceDto {
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsString()
  leaveTypeId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

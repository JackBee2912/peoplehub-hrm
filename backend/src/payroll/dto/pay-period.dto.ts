import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PayPeriodType, PayPeriodStatus } from "@prisma/client";

export class CreatePayPeriodDto {
  @ApiProperty({ enum: PayPeriodType })
  @IsEnum(PayPeriodType)
  type: PayPeriodType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  year: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  period: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsDateString()
  cutoffDate: string;

  @ApiPropertyOptional({ default: "OPEN" })
  @IsOptional()
  @IsEnum(PayPeriodStatus)
  status?: PayPeriodStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayPeriodDto {
  @ApiPropertyOptional({ enum: PayPeriodType })
  @IsOptional()
  @IsEnum(PayPeriodType)
  type?: PayPeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  period?: number;

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
  @IsDateString()
  cutoffDate?: string;

  @ApiPropertyOptional({ enum: PayPeriodStatus })
  @IsOptional()
  @IsEnum(PayPeriodStatus)
  status?: PayPeriodStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { EmployeeModule } from "./employee/employee.module";
import { DepartmentModule } from "./department/department.module";
import { PositionModule } from "./position/position.module";
import { RoleModule } from "./role/role.module";
import { HealthModule } from "./common/health.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { ShiftModule } from "./shift/shift.module";
import { LeaveModule } from "./leave/leave.module";
import { HolidayModule } from "./holiday/holiday.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60", 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
      },
    ]),
    AuthModule,
    UserModule,
    EmployeeModule,
    DepartmentModule,
    PositionModule,
    RoleModule,
    HealthModule,
    AttendanceModule,
    ShiftModule,
    LeaveModule,
    HolidayModule,
    DashboardModule,
    SchedulerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

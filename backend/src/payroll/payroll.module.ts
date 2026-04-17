import { Module } from "@nestjs/common";
import { SalaryComponentModule } from "./salary-component/salary-component.module";
import { TaxRuleModule } from "./tax-rule/tax-rule.module";
import { PayPeriodModule } from "./pay-period/pay-period.module";
import { PayrollRunModule } from "./payroll-run/payroll-run.module";
import { PayslipModule } from "./payslip/payslip.module";
import { PayrollReportModule } from "./report/payroll-report.module";

@Module({
  imports: [
    SalaryComponentModule,
    TaxRuleModule,
    PayPeriodModule,
    PayrollRunModule,
    PayslipModule,
    PayrollReportModule,
  ],
})
export class PayrollModule {}

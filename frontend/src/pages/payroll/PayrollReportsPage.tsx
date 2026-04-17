import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Select,
  Statistic,
  Table,
  Button,
  Space,
  Spin,
} from 'antd';
import { BarChartOutlined, DownloadOutlined } from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const { Title, Text } = Typography;

const COLORS = [
  '#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
];

const PayrollReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<string>(dayjs().format('YYYY-MM'));
  const [trendRange, setTrendRange] = useState<number>(6);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-report', period],
    queryFn: () => payrollService.getPayrollReport(period),
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['payroll-trend', trendRange],
    queryFn: () => {
      const to = dayjs();
      const from = to.subtract(trendRange, 'month');
      return payrollService.getPayrollTrend(
        from.format('YYYY-MM-DD'),
        to.format('YYYY-MM-DD')
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: (runId: string) => payrollService.exportBankFile(runId),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payroll-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  const periodOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = dayjs().subtract(i, 'month');
    periodOptions.push({
      label: d.format('MMMM YYYY'),
      value: d.format('YYYY-MM'),
    });
  }

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  }

  if (!data) {
    return <Text type="secondary">Select a period to view payroll reports</Text>;
  }

  const departmentChartData = data.departments.map((d) => ({
    name: d.name,
    payroll: d.totalPayroll,
    employees: d.employeeCount,
  }));

  const pieChartData = data.departments.map((d) => ({
    name: d.name,
    value: d.totalPayroll,
  }));

  const trendChartData = trendData?.map((t) => ({
    month: t.month,
    payroll: t.totalPayroll,
    employees: t.employeeCount,
  })) ?? [];

  const taxChartData = data.taxLiability.map((t) => ({
    name: t.taxType,
    amount: t.amount,
  }));

  const deptColumns = [
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount', width: 120 },
    {
      title: 'Total Payroll',
      dataIndex: 'totalPayroll',
      key: 'totalPayroll',
      width: 180,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Avg Salary',
      dataIndex: 'avgSalary',
      key: 'avgSalary',
      width: 180,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          Payroll Reports
        </Title>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            options={periodOptions}
            style={{ width: 200 }}
          />
          <Button
            icon={<DownloadOutlined />}
            loading={exportMutation.isPending}
            onClick={() => exportMutation.mutate('')}
          >
            Export
          </Button>
        </Space>
      </div>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Payroll"
              value={data.totalPayroll}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Employees Paid"
              value={data.totalEmployees}
              suffix="people"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Salary"
              value={data.avgSalary}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Period"
              value={data.period}
              prefix={null as unknown as string}
              suffix={null as unknown as string}
            />
          </Card>
        </Col>
      </Row>

      {/* Monthly Trend */}
      <Card
        title="Monthly Payroll Trend"
        style={{ marginBottom: 16 }}
        extra={
          <Select
            value={trendRange}
            onChange={setTrendRange}
            options={[
              { label: '3 months', value: 3 },
              { label: '6 months', value: 6 },
              { label: '12 months', value: 12 },
            ]}
            style={{ width: 140 }}
          />
        }
      >
        <Spin spinning={trendLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="payroll"
                  stroke="#1677ff"
                  strokeWidth={2}
                  name="Total Payroll"
                />
                <Line
                  type="monotone"
                  dataKey="employees"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name="Employee Count"
                />
              </LineChart>
            </ResponsiveContainer>
        </Spin>
      </Card>

      {/* Department Breakdown */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="Payroll by Department">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="payroll" fill="#1677ff" name="Total Payroll" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Payroll Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tax Liability */}
      <Card title="Tax Liability Summary" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {taxChartData.map((t, i) => (
            <Col span={6} key={i}>
              <Statistic
                title={t.name}
                value={t.amount}
                prefix="$"
                precision={2}
              />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Department Table */}
      <Card title="Department Breakdown">
        <Table
          columns={deptColumns}
          dataSource={data.departments}
          rowKey="name"
          size="small"
          pagination={false}
          summary={(pageData) => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Text strong>Total</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>
                  {pageData.reduce((sum, d) => sum + d.employeeCount, 0)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Text strong>
                  ${pageData.reduce((sum, d) => sum + d.totalPayroll, 0).toLocaleString()}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <Text strong>
                  $
                  {Math.round(
                    pageData.reduce((sum, d) => sum + d.totalPayroll, 0) /
                      pageData.reduce((sum, d) => sum + d.employeeCount, 0)
                  ).toLocaleString()}
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
};

export default PayrollReportsPage;

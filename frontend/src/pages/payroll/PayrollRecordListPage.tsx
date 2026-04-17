import React, { useState } from 'react';
import {
  Table,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import type { PayrollRecord, PayrollRecordStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const recordStatusColors: Record<PayrollRecordStatus, string> = {
  CALCULATED: 'blue',
  ADJUSTED: 'orange',
  APPROVED: 'green',
  PAID: 'cyan',
};

const PayrollRecordListPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-records', runId, { departmentFilter, statusFilter, search, page, pageSize }],
    queryFn: () =>
      payrollService.getPayrollRecords(runId!, {
        departmentId: departmentFilter,
        status: statusFilter,
        search,
        page,
        pageSize,
      }),
    enabled: !!runId,
  });

  const { data: run } = useQuery({
    queryKey: ['payroll-run', runId],
    queryFn: () => payrollService.getPayrollRun(runId!),
    enabled: !!runId,
  });

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, record: PayrollRecord) => (
        <div>
          <Text strong>{record.employee.firstName} {record.employee.lastName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.employee.employeeCode}
          </Text>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['employee', 'department', 'name'],
      key: 'department',
      width: 150,
      render: (val: string) => val || '-',
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 140,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Gross Pay',
      dataIndex: 'grossPay',
      key: 'grossPay',
      width: 140,
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      width: 140,
      render: (val: number) => (
        <Text type="danger">
          -${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      width: 140,
      render: (val: number) => (
        <Text strong style={{ color: '#1677ff', fontSize: 14 }}>
          ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: PayrollRecordStatus) => <Tag color={recordStatusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: PayrollRecord) => (
        <a onClick={() => navigate(`/payroll/records/${record.id}`)}>
          Details
        </a>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>
        Payroll Records — {run?.period || 'Loading...'}
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Records"
              value={data?.total ?? 0}
              suffix="employees"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Gross"
              value={run?.totalGross ?? 0}
              prefix="$"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Deductions"
              value={run?.totalDeductions ?? 0}
              prefix="$"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Net"
              value={run?.totalNet ?? 0}
              prefix="$"
              style={{ color: '#52c41a' }}
              precision={2}
            />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search employee..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Department"
            allowClear
            style={{ width: 200 }}
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[]}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="CALCULATED">Calculated</Select.Option>
            <Select.Option value="ADJUSTED">Adjusted</Select.Option>
            <Select.Option value="APPROVED">Approved</Select.Option>
            <Select.Option value="PAID">Paid</Select.Option>
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data?.data ?? []}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
};

export default PayrollRecordListPage;

import React from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Divider,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import type { PayrollRecordStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const recordStatusColors: Record<PayrollRecordStatus, string> = {
  CALCULATED: 'blue',
  ADJUSTED: 'orange',
  APPROVED: 'green',
  PAID: 'cyan',
};

const PayrollRecordDetailPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();

  const { data: record, isLoading } = useQuery({
    queryKey: ['payroll-record', recordId],
    queryFn: () => payrollService.getPayrollRecord(recordId!),
    enabled: !!recordId,
  });

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  }

  if (!record) {
    return <Text type="danger">Payroll record not found</Text>;
  }

  const earningsColumns = [
    { title: 'Component', dataIndex: 'name', key: 'name' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      align: 'right' as const,
    },
  ];

  const deductionsColumns = [
    { title: 'Component', dataIndex: 'name', key: 'name' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `-$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      align: 'right' as const,
    },
  ];

  const earningsData = [
    { key: 'base', name: 'Base Salary', amount: record.baseSalary },
    ...(record.allowances || []).map((a, i) => ({
      key: `allowance-${i}`,
      name: a.name,
      amount: a.amount,
    })),
    ...(record.bonuses || []).map((b, i) => ({
      key: `bonus-${i}`,
      name: b.name,
      amount: b.amount,
    })),
    { key: 'overtime', name: 'Overtime Pay', amount: record.overtimePay },
  ];

  const deductionsData = [
    { key: 'tax', name: 'Income Tax', amount: record.taxAmount },
    { key: 'si', name: 'Social Insurance', amount: record.socialInsurance },
    { key: 'hi', name: 'Health Insurance', amount: record.healthInsurance },
    ...(record.otherDeductions || []).map((d, i) => ({
      key: `other-${i}`,
      name: d.name,
      amount: d.amount,
    })),
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Payroll Record Detail
        </Title>
      </Space>

      {/* Employee Info */}
      <Card title="Employee Information" style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="Name">
            {record.employee.firstName} {record.employee.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Employee Code">
            {record.employee.employeeCode}
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {record.employee.department?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Position">
            {record.employee.position?.title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={recordStatusColors[record.status]}>{record.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Currency">{record.currency}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Gross Pay" value={record.grossPay} prefix="$" precision={2} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deductions"
              value={record.totalDeductions}
              prefix="-$"
              valueStyle={{ color: '#ff4d4f' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Net Pay"
              value={record.netPay}
              prefix="$"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Base Salary" value={record.baseSalary} prefix="$" precision={2} />
          </Card>
        </Col>
      </Row>

      {/* Earnings */}
      <Card title="Earnings" style={{ marginBottom: 16 }}>
        <Table
          columns={earningsColumns}
          dataSource={earningsData}
          rowKey="key"
          size="small"
          pagination={false}
          showHeader={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Text strong>Total Earnings</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>${record.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* Deductions */}
      <Card title="Deductions" style={{ marginBottom: 16 }}>
        <Table
          columns={deductionsColumns}
          dataSource={deductionsData}
          rowKey="key"
          size="small"
          pagination={false}
          showHeader={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Text strong>Total Deductions</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: '#ff4d4f' }}>
                  -${record.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* Net Pay Summary */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Text strong style={{ fontSize: 16 }}>Net Pay</Text>
          </Col>
          <Col>
            <Text
              strong
              style={{ fontSize: 28, color: '#1677ff' }}
            >
              ${record.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </Col>
        </Row>
        {record.payslipUrl && (
          <Divider />
        )}
        {record.payslipUrl && (
          <Button icon={<DownloadOutlined />} href={record.payslipUrl} target="_blank">
            Download Payslip PDF
          </Button>
        )}
      </Card>
    </div>
  );
};

export default PayrollRecordDetailPage;

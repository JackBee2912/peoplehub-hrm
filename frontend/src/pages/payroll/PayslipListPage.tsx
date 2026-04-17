import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Select,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import { EyeOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';
import { payslipService } from '@/services/payslip';
import type { Payslip } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PayslipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState<number>(dayjs().year());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, isLoading } = useQuery({
    queryKey: ['my-payslips', year, page, pageSize],
    queryFn: () => payslipService.getMyPayslips({ year, page, pageSize }),
  });

  const { data: ytdSummary } = useQuery({
    queryKey: ['ytd-summary'],
    queryFn: payslipService.getMyYTDSummary,
  });

  const downloadMutation = useMutation({
    mutationFn: payslipService.downloadPayslip,
    onSuccess: (blob, payslipId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Payslip downloaded');
    },
  });

  const resendMutation = useMutation({
    mutationFn: payslipService.resendPayslipEmail,
    onSuccess: () => {
      message.success('Payslip email resent');
    },
  });

  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 140,
      render: (period: string) => <Text strong>{period}</Text>,
    },
    {
      title: 'Pay Date',
      dataIndex: 'payDate',
      key: 'payDate',
      width: 130,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Gross Pay',
      dataIndex: 'grossPay',
      key: 'grossPay',
      width: 150,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      width: 150,
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
      width: 150,
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
          ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Payslip) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payroll/payslips/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            loading={downloadMutation.isPending}
            onClick={() => downloadMutation.mutate(record.id)}
          >
            Download
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MailOutlined />}
            loading={resendMutation.isPending}
            onClick={() => resendMutation.mutate(record.id)}
          >
            Resend
          </Button>
        </Space>
      ),
    },
  ];

  const yearOptions = [];
  for (let y = dayjs().year(); y >= dayjs().year() - 3; y--) {
    yearOptions.push({ label: String(y), value: y });
  }

  return (
    <div>
      <Title level={4}>My Payslips</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="YTD Gross"
              value={ytdSummary?.totalGross ?? 0}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="YTD Net"
              value={ytdSummary?.totalNet ?? 0}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="YTD Tax"
              value={ytdSummary?.totalTax ?? 0}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deductions"
              value={ytdSummary?.totalDeductions ?? 0}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text>Year:</Text>
          <Select
            value={year}
            onChange={setYear}
            options={yearOptions}
            style={{ width: 120 }}
          />
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

export default PayslipListPage;

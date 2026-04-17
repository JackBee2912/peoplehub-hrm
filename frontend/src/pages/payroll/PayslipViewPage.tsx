import React, { useRef } from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Table,
  Divider,
  Button,
  Space,
  Spin,
  Row,
  Col,
  Tag,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { payslipService } from '@/services/payslip';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PayslipViewPage: React.FC = () => {
  const { payslipId } = useParams<{ payslipId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payslip', payslipId],
    queryFn: () => payslipService.getMyPayslip(payslipId!),
    enabled: !!payslipId,
  });

  const downloadMutation = useMutation({
    mutationFn: payslipService.downloadPayslip,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  const resendMutation = useMutation({
    mutationFn: payslipService.resendPayslipEmail,
    onSuccess: () => {
      // message handled in parent context
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  }

  if (!payslip) {
    return <Text type="danger">Payslip not found</Text>;
  }

  const earningsColumns = [
    { title: 'Earnings', dataIndex: 'name', key: 'name' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) =>
        `${payslip.currency === 'VND' ? '' : '$'}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
  ];

  const deductionsColumns = [
    { title: 'Deductions', dataIndex: 'name', key: 'name' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) =>
        `-${payslip.currency === 'VND' ? '' : '$'}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <div ref={printRef}>
      {/* Action bar - hidden when printing */}
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>Payslip</Title>
        </Space>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={downloadMutation.isPending}
            onClick={() => downloadMutation.mutate(payslipId!)}
          >
            Download PDF
          </Button>
          <Button
            icon={<MailOutlined />}
            loading={resendMutation.isPending}
            onClick={() => resendMutation.mutate(payslipId!)}
          >
            Email
          </Button>
        </Space>
      </div>

      <Card>
        {/* Header */}
        <Row justify="space-between" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>PAYSLIP</Title>
            <Text type="secondary">Period: {payslip.period}</Text>
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <Text strong>Pay Date: </Text>
            <Text>{dayjs(payslip.payDate).format('DD/MM/YYYY')}</Text>
            <br />
            <Text strong>Currency: </Text>
            <Tag color="blue">{payslip.currency}</Tag>
          </Col>
        </Row>

        <Divider />

        {/* Employee Info */}
        <Descriptions column={3} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Employee Name">
            {payslip.employee.firstName} {payslip.employee.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Employee Code">
            {payslip.employee.employeeCode}
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {payslip.employee.department?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Position">
            {payslip.employee.position?.title || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={24}>
          {/* Earnings */}
          <Col span={12}>
            <Card
              title={<Text strong style={{ color: '#52c41a' }}>Earnings</Text>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              {payslip.baseSalary > 0 && (
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <Text>Base Salary</Text>
                  <Text>${payslip.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                </Row>
              )}
              <Table
                columns={earningsColumns}
                dataSource={(payslip.earnings || []).map((e, i) => ({
                  key: `earn-${i}`,
                  name: e.name,
                  amount: e.amount,
                }))}
                size="small"
                pagination={false}
                showHeader={false}
              />
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text strong>Gross Pay</Text>
                <Text strong>${payslip.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </Row>
            </Card>
          </Col>

          {/* Deductions */}
          <Col span={12}>
            <Card
              title={<Text strong style={{ color: '#ff4d4f' }}>Deductions</Text>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Table
                columns={deductionsColumns}
                dataSource={(payslip.deductions || []).map((d, i) => ({
                  key: `ded-${i}`,
                  name: d.name,
                  amount: d.amount,
                }))}
                size="small"
                pagination={false}
                showHeader={false}
              />
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text strong>Total Deductions</Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  -${payslip.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Net Pay */}
        <Card
          style={{
            background: '#f6ffed',
            borderColor: '#b7eb8f',
            marginBottom: 24,
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong style={{ fontSize: 20 }}>NET PAY</Text>
            </Col>
            <Col>
              <Text strong style={{ fontSize: 28, color: '#52c41a' }}>
                ${payslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* YTD Summary */}
        <Card title="Year-to-Date Summary" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="YTD Gross" value={payslip.ytdGross} prefix="$" precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="YTD Tax" value={payslip.ytdTax} prefix="$" precision={2} />
            </Col>
            <Col span={8}>
              <Statistic
                title="YTD Net"
                value={payslip.ytdNet}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
                precision={2}
              />
            </Col>
          </Row>
        </Card>
      </Card>

      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ant-layout, .ant-layout-sider, .ant-menu { display: none !important; }
          .ant-layout-content { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default PayslipViewPage;

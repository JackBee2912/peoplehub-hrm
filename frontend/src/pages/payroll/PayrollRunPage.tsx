import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
  Steps,
  Typography,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import type { PayrollRun, CreatePayrollRunInput, PayrollStatus } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<PayrollStatus, string> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'processing',
  APPROVED: 'success',
  PROCESSED: 'cyan',
  PAID: 'green',
  FAILED: 'error',
};

const PayrollRunPage: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreatePayrollRunInput>();
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => payrollService.getPayrollRuns(),
  });

  const createMutation = useMutation({
    mutationFn: payrollService.createPayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      message.success('Payroll run created');
      setModalOpen(false);
      form.resetFields();
    },
  });

  const calculateMutation = useMutation({
    mutationFn: payrollService.calculatePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      message.success('Payroll calculated successfully');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollService.approvePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      message.success('Payroll approved');
    },
  });

  const processMutation = useMutation({
    mutationFn: payrollService.processPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      message.success('Payroll processed');
    },
  });

  const exportMutation = useMutation({
    mutationFn: payrollService.exportBankFile,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bank-transfer.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Bank file downloaded');
    },
  });

  const handleSubmit = (values: CreatePayrollRunInput) => {
    createMutation.mutate(values);
  };

  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 140,
      render: (period: string) => <Text strong>{period}</Text>,
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      width: 200,
      render: (_: unknown, record: PayrollRun) =>
        `${dayjs(record.startDate).format('DD/MM')} - ${dayjs(record.endDate).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 100,
      render: (count: number) => count ?? '-',
    },
    {
      title: 'Gross Pay',
      dataIndex: 'totalGross',
      key: 'totalGross',
      width: 150,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Net Pay',
      dataIndex: 'totalNet',
      key: 'totalNet',
      width: 150,
      render: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: PayrollStatus) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      render: (_: unknown, record: PayrollRun) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => navigate(`/payroll/runs/${record.id}/records`)}
          >
            View Records
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={calculateMutation.isPending}
              onClick={() => calculateMutation.mutate(record.id)}
            >
              Calculate
            </Button>
          )}
          {record.status === 'PENDING_APPROVAL' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate(record.id)}
            >
              Approve
            </Button>
          )}
          {record.status === 'APPROVED' && (
            <Button
              size="small"
              type="primary"
              loading={processMutation.isPending}
              onClick={() => processMutation.mutate(record.id)}
            >
              Process
            </Button>
          )}
          {record.status === 'PROCESSED' && (
            <Button
              size="small"
              icon={<FileTextOutlined />}
              loading={exportMutation.isPending}
              onClick={() => exportMutation.mutate(record.id)}
            >
              Export Bank File
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Payroll Runs
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Payroll Run
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data ?? []}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title="Create Payroll Run"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="period"
            label="Period"
            rules={[{ required: true, message: 'Period is required' }]}
          >
            <Input placeholder="e.g. 2026-04" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="USD">
            <Select>
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="VND">VND</Select.Option>
              <Select.Option value="EUR">EUR</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Payroll Run Details"
        open={!!selectedRun}
        onCancel={() => setSelectedRun(null)}
        footer={null}
        width={700}
      >
        {selectedRun && (
          <>
            <Steps
              current={
                selectedRun.status === 'DRAFT'
                  ? 0
                  : selectedRun.status === 'PENDING_APPROVAL'
                    ? 1
                    : selectedRun.status === 'APPROVED'
                      ? 2
                      : selectedRun.status === 'PROCESSED'
                        ? 3
                        : 4
              }
              items={[
                { title: 'Draft' },
                { title: 'Pending' },
                { title: 'Approved' },
                { title: 'Processed' },
                { title: 'Paid' },
              ]}
              style={{ marginBottom: 24 }}
            />
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Period">{selectedRun.period}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedRun.status]}>{selectedRun.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {dayjs(selectedRun.startDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {dayjs(selectedRun.endDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Gross">
                ${selectedRun.totalGross.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Net">
                ${selectedRun.totalNet.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Deductions">
                ${selectedRun.totalDeductions.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Tax">
                ${selectedRun.totalTax.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};

export default PayrollRunPage;

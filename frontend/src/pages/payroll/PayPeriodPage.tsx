import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Tag,
  message,
  Popconfirm,
  DatePicker,
  Calendar,
  Typography,
  Card,
  Tabs,
} from 'antd';
import { PlusOutlined, CalendarOutlined, LockOutlined } from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import type { PayPeriod, CreatePayPeriodInput, PayPeriodFrequency } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const frequencyLabels: Record<PayPeriodFrequency, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
};

const statusColors: Record<string, string> = {
  OPEN: 'green',
  CLOSED: 'orange',
  LOCKED: 'red',
};

const PayPeriodTable: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PayPeriod | null>(null);
  const [form] = Form.useForm<CreatePayPeriodInput>();
  const queryClient = useQueryClient();

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['pay-periods'],
    queryFn: payrollService.getPayPeriods,
  });

  const createMutation = useMutation({
    mutationFn: payrollService.createPayPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods'] });
      message.success('Pay period created');
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: payrollService.updatePayPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods'] });
      message.success('Pay period updated');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: payrollService.deletePayPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods'] });
      message.success('Pay period deleted');
    },
  });

  const lockMutation = useMutation({
    mutationFn: payrollService.lockPayPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods'] });
      message.success('Pay period locked');
    },
  });

  const handleSubmit = async (values: CreatePayPeriodInput) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: PayPeriod) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      startDate: dayjs(record.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(record.endDate).format('YYYY-MM-DD'),
      cutoffDate: dayjs(record.cutoffDate).format('YYYY-MM-DD'),
      payDate: dayjs(record.payDate).format('YYYY-MM-DD'),
    });
    setModalOpen(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (f: PayPeriodFrequency) => frequencyLabels[f] || f,
    },
    {
      title: 'Start',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'End',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Cutoff',
      dataIndex: 'cutoffDate',
      key: 'cutoffDate',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Pay Date',
      dataIndex: 'payDate',
      key: 'payDate',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'FY',
      dataIndex: 'fiscalYear',
      key: 'fiscalYear',
      width: 70,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: PayPeriod) => (
        <Space>
          <Button
            type="link"
            size="small"
            disabled={record.status === 'LOCKED'}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          {record.status !== 'LOCKED' && (
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => lockMutation.mutate(record.id)}
            >
              Lock
            </Button>
          )}
          <Popconfirm
            title="Delete this pay period?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger disabled={record.status === 'LOCKED'}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">Manage pay periods for payroll processing</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Pay Period
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={periods}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
      <Modal
        title={editing ? 'Edit Pay Period' : 'Add Pay Period'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. April 2026" />
          </Form.Item>
          <Form.Item
            name="frequency"
            label="Frequency"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="WEEKLY">Weekly</Select.Option>
              <Select.Option value="BIWEEKLY">Bi-Weekly</Select.Option>
              <Select.Option value="MONTHLY">Monthly</Select.Option>
              <Select.Option value="QUARTERLY">Quarterly</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cutoffDate" label="Cutoff Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payDate" label="Pay Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fiscalYear" label="Fiscal Year" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={2020} max={2099} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const PayPeriodCalendar: React.FC = () => {
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['pay-periods-calendar', dayjs().year()],
    queryFn: () => payrollService.getPayPeriodCalendar(dayjs().year()),
  });

  const periodMap = new Map<string, PayPeriod>();
  periods.forEach((p) => {
    const start = dayjs(p.startDate);
    const end = dayjs(p.endDate);
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      periodMap.set(current.format('YYYY-MM-DD'), p);
      current = current.add(1, 'day');
    }
  });

  const dateCellRender = (value: dayjs.Dayjs) => {
    const period = periodMap.get(value.format('YYYY-MM-DD'));
    if (period) {
      return (
        <Tag color={statusColors[period.status]} style={{ margin: 0, fontSize: 10 }}>
          {period.name}
        </Tag>
      );
    }
    return null;
  };

  return (
    <Card loading={isLoading}>
      <Calendar dateCellRender={dateCellRender} />
    </Card>
  );
};

const PayPeriodPage: React.FC = () => {
  return (
    <div>
      <Title level={4}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        Pay Period Management
      </Title>
      <Tabs
        items={[
          { key: 'table', label: 'Pay Periods', children: <PayPeriodTable /> },
          { key: 'calendar', label: 'Calendar View', children: <PayPeriodCalendar /> },
        ]}
      />
    </div>
  );
};

export default PayPeriodPage;

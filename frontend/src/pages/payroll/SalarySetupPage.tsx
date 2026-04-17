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
  Card,
  Typography,
  Tabs,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { payrollService } from '@/services/payroll';
import type {
  SalaryComponent,
  CreateSalaryComponentInput,
  CreateEmployeeSalaryInput,
  SalaryComponentType,
} from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;

const componentTypeColors: Record<SalaryComponentType, string> = {
  BASE: 'blue',
  ALLOWANCE: 'green',
  DEDUCTION: 'red',
  BONUS: 'gold',
  OVERTIME: 'purple',
};

// --- Tab 1: Salary Component Management ---
const SalaryComponentTab: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [form] = Form.useForm<CreateSalaryComponentInput>();
  const queryClient = useQueryClient();

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['salary-components'],
    queryFn: payrollService.getSalaryComponents,
  });

  const createMutation = useMutation({
    mutationFn: payrollService.createSalaryComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      message.success('Salary component created');
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: payrollService.updateSalaryComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      message.success('Salary component updated');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: payrollService.deleteSalaryComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      message.success('Salary component deleted');
    },
  });

  const handleSubmit = async (values: CreateSalaryComponentInput) => {
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

  const openEdit = (record: SalaryComponent) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: SalaryComponentType) => (
        <Tag color={componentTypeColors[type]}>{type}</Tag>
      ),
    },
    {
      title: 'Default Amount',
      dataIndex: 'defaultAmount',
      key: 'defaultAmount',
      width: 160,
      render: (val: number) => (val ? `$${val.toLocaleString()}` : '-'),
    },
    {
      title: 'Fixed',
      dataIndex: 'isFixed',
      key: 'isFixed',
      width: 80,
      render: (val: boolean) => (val ? 'Yes' : 'No'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: SalaryComponent) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this component?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">Define salary components used in payroll calculations</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Component
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={components}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
      />
      <Modal
        title={editing ? 'Edit Salary Component' : 'Add Salary Component'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Transport Allowance" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Code is required' }]}
          >
            <Input placeholder="e.g. TRANS_ALLOW" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Type is required' }]}
          >
            <Select>
              <Select.Option value="BASE">Base Salary</Select.Option>
              <Select.Option value="ALLOWANCE">Allowance</Select.Option>
              <Select.Option value="DEDUCTION">Deduction</Select.Option>
              <Select.Option value="BONUS">Bonus</Select.Option>
              <Select.Option value="OVERTIME">Overtime</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="defaultAmount" label="Default Amount">
            <InputNumber style={{ width: '100%' }} prefix="$" />
          </Form.Item>
          <Form.Item name="isFixed" label="Fixed Amount" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// --- Tab 2: Employee Salary Setup ---
const EmployeeSalaryTab: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateEmployeeSalaryInput>();
  const queryClient = useQueryClient();

  const { data: components = [] } = useQuery({
    queryKey: ['salary-components'],
    queryFn: payrollService.getSalaryComponents,
  });

  const { data: salarySetups = [] } = useQuery({
    queryKey: ['employee-salary-setups'],
    queryFn: () => Promise.resolve([]),
    retry: false,
  });
  // salarySetups used for employee salary display in tabs
  void salarySetups;

  const createMutation = useMutation({
    mutationFn: payrollService.setEmployeeSalary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-setups'] });
      message.success('Employee salary configured');
      setModalOpen(false);
      form.resetFields();
    },
  });

  const handleSubmit = (values: CreateEmployeeSalaryInput) => {
    createMutation.mutate(values);
  };

  const activeComponents = components.filter((c) => c.isActive);

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">Configure salary for individual employees</Text>
        <Button type="primary" icon={<UserOutlined />} onClick={() => setModalOpen(true)}>
          Configure Employee Salary
        </Button>
      </div>

      <Card>
        <Typography.Paragraph>
          Select an employee to configure their salary structure. Salary components must be
          defined first in the Components tab.
        </Typography.Paragraph>
        <Form layout="vertical">
          <Form.Item label="Employee">
            <Select
              placeholder="Search employee..."
              showSearch
              optionFilterProp="label"
              options={[]}
            />
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Configure Employee Salary"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="employeeId"
            label="Employee"
            rules={[{ required: true, message: 'Select an employee' }]}
          >
            <Select placeholder="Search employee..." showSearch />
          </Form.Item>
          <Form.Item
            name="baseSalary"
            label="Base Salary"
            rules={[{ required: true, message: 'Base salary is required' }]}
          >
            <InputNumber style={{ width: '100%' }} prefix="$" />
          </Form.Item>
          <Form.Item
            name="effectiveFrom"
            label="Effective From"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Components">
            {activeComponents.map((comp) => (
              <Form.Item key={comp.id} label={comp.name}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="$"
                  placeholder={comp.defaultAmount ? `$${comp.defaultAmount}` : '0'}
                />
              </Form.Item>
            ))}
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const SalarySetupPage: React.FC = () => {
  return (
    <div>
      <Title level={4}>
        <DollarOutlined style={{ marginRight: 8 }} />
        Salary Setup
      </Title>
      <Tabs
        items={[
          {
            key: 'components',
            label: 'Salary Components',
            children: <SalaryComponentTab />,
          },
          {
            key: 'employee-salary',
            label: 'Employee Salary',
            children: <EmployeeSalaryTab />,
          },
        ]}
      />
    </div>
  );
};

export default SalarySetupPage;

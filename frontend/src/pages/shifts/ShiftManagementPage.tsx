import React, { useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, TimePicker,
  Switch, Tag, message, Popconfirm, Row, Col, Typography, Transfer,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '@/services/shift';
import { employeeService } from '@/services/employee';
import { PageHeader } from '@/components/common';
import type { Shift, ShiftType, Employee } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const shiftTypeColors: Record<ShiftType, string> = {
  FIXED: 'blue',
  ROTATING: 'purple',
  FLEXIBLE: 'green',
  CUSTOM: 'orange',
};

const ShiftManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);

  // Shifts list
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts-list'],
    queryFn: () => shiftService.getList(),
  });

  // Assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['shift-assignments'],
    queryFn: () => shiftService.getAssignments(),
  });

  // Employees for transfer
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-shift'],
    queryFn: () => employeeService.getList({ page: 1, pageSize: 100 }),
  });

  const employeeList: Employee[] = employeesData?.data || [];

  // Create/Update shift mutation
  const upsertMutation = useMutation({
    mutationFn: (data: { id?: string } & any) => {
      if (data.id) {
        return shiftService.update(data);
      }
      return shiftService.create(data);
    },
    onSuccess: () => {
      message.success(editingShift ? 'Shift updated successfully' : 'Shift created successfully');
      setModalVisible(false);
      form.resetFields();
      setEditingShift(null);
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
    },
    onError: () => message.error('Failed to save shift'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftService.delete(id),
    onSuccess: () => {
      message.success('Shift deleted');
      queryClient.invalidateQueries({ queryKey: ['shifts-list'] });
    },
    onError: () => message.error('Failed to delete shift'),
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (data: { shiftId: string; employeeIds: string[]; startDate: string; endDate?: string }) =>
      shiftService.assignShift(data),
    onSuccess: () => {
      message.success('Shift assigned successfully');
      setAssignModalVisible(false);
      assignForm.resetFields();
      setTargetKeys([]);
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });
    },
    onError: () => message.error('Failed to assign shift'),
  });

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    form.setFieldsValue({
      name: shift.name,
      code: shift.code,
      startTime: dayjs(shift.startTime, 'HH:mm'),
      endTime: dayjs(shift.endTime, 'HH:mm'),
      type: shift.type,
      color: shift.color,
      isActive: shift.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        startTime: values.startTime?.format('HH:mm:ss'),
        endTime: values.endTime?.format('HH:mm:ss'),
      };
      if (editingShift) {
        data.id = editingShift.id;
      }
      upsertMutation.mutate(data);
    });
  };

  const handleAssignSubmit = () => {
    assignForm.validateFields().then((values) => {
      assignMutation.mutate({
        shiftId: values.shiftId,
        employeeIds: targetKeys as string[],
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      });
    });
  };

  const columns: ColumnsType<Shift> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 100,
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('HH:mm'),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 100,
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('HH:mm'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ShiftType) => (
        <Tag color={shiftTypeColors[type]}>{type}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Assigned',
      key: 'assigned',
      width: 100,
      render: (_: unknown, record: Shift) => {
        const count = assignments?.filter((a) => a.shiftId === record.id).length || 0;
        return <Tag icon={<TeamOutlined />}>{count}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Shift) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this shift?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const transferDataSource = employeeList.map((emp) => ({
    key: emp.id,
    title: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
    description: emp.email,
  }));

  return (
    <div>
      <PageHeader
        title="Shift Management"
        subtitle="Create and manage work shifts"
        breadcrumbs={[{ title: 'Home' }, { title: 'Shifts' }]}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => setAssignModalVisible(true)}
            >
              Assign Shift
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingShift(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              New Shift
            </Button>
          </Space>
        }
      />

      <Card>
        <Table
          columns={columns}
          dataSource={shifts || []}
          loading={shiftsLoading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Schedule Preview */}
      <Card title={<><CalendarOutlined /> Current Assignments</>} style={{ marginTop: 16 }}>
        {assignments && assignments.length > 0 ? (
          <Table
            dataSource={assignments}
            loading={assignmentsLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Employee', render: (_, r) => `${r.employee.firstName} ${r.employee.lastName}` },
              { title: 'Code', dataIndex: ['employee', 'employeeCode'] },
              { title: 'Shift', dataIndex: ['shift', 'name'] },
              { title: 'Type', dataIndex: ['shift', 'type'], render: (t: ShiftType) => <Tag color={shiftTypeColors[t]}>{t}</Tag> },
              { title: 'Start', dataIndex: 'startDate', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
              { title: 'End', dataIndex: 'endDate', render: (d?: string) => d ? dayjs(d).format('DD MMM YYYY') : 'Ongoing' },
            ]}
          />
        ) : (
          <Typography.Text type="secondary">No shift assignments yet.</Typography.Text>
        )}
      </Card>

      {/* Shift Create/Edit Modal */}
      <Modal
        title={editingShift ? 'Edit Shift' : 'Create Shift'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={upsertMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Shift Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Morning Shift" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input placeholder="e.g., MORNING" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="type" label="Shift Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="FIXED">Fixed</Select.Option>
              <Select.Option value="ROTATING">Rotating</Select.Option>
              <Select.Option value="FLEXIBLE">Flexible</Select.Option>
              <Select.Option value="CUSTOM">Custom</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        title="Assign Shift to Employees"
        open={assignModalVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignModalVisible(false)}
        width={700}
        confirmLoading={assignMutation.isPending}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="shiftId" label="Select Shift" rules={[{ required: true }]}>
            <Select placeholder="Choose a shift">
              {shifts?.filter((s) => s.isActive).map((shift) => (
                <Select.Option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date (optional)">
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Select Employees">
            <Transfer
              dataSource={transferDataSource}
              titles={['Available', 'Selected']}
              targetKeys={targetKeys}
              onChange={(keys) => setTargetKeys(keys)}
              render={(item) => item.title}
              listStyle={{ width: 280, height: 300 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShiftManagementPage;

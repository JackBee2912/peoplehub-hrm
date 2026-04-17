import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Select, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee';
import { departmentService } from '@/services/department';
import { PageHeader, SearchInput, StatusBadge } from '@/components/common';
import { EmployeeModal } from '@/components/employee/EmployeeModal';
import type { Employee, EmployeeStatus, Department } from '@/types';
import { formatDate } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', search, departmentFilter, statusFilter, page, pageSize],
    queryFn: () =>
      employeeService.getList({
        search: search || undefined,
        departmentId: departmentFilter,
        status: statusFilter,
        page,
        pageSize,
      }),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: departmentService.getList,
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      message.success('Employee deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete employee');
    },
  });

  const handleCreate = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns: ColumnsType<Employee> = [
    {
      title: 'Employee',
      dataIndex: 'firstName',
      key: 'employee',
      render: (_: string, record: Employee) => (
        <Space>
          <span>
            <strong>{record.firstName} {record.lastName}</strong>
            <br />
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>{record.employeeCode}</span>
          </span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'department',
      render: (name: string) => name || '-',
    },
    {
      title: 'Position',
      dataIndex: ['position', 'title'],
      key: 'position',
      render: (title: string) => title || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status.toLowerCase()} />,
      width: 120,
    },
    {
      title: 'Hire Date',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => formatDate(date),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Employee) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/employees/${record.id}`)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Employee"
            description="Are you sure you want to delete this employee?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's employees"
        breadcrumbs={[{ title: 'Home', href: '/admin' }, { title: 'Employees' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Employee
          </Button>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <SearchInput
          placeholder="Search employees..."
          onSearch={setSearch}
        />
        <Select
          placeholder="Department"
          allowClear
          style={{ width: 200 }}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={departments?.map((d: Department) => ({ label: d.name, value: d.id }))}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Probation', value: 'PROBATION' },
            { label: 'On Leave', value: 'ON_LEAVE' },
            { label: 'Suspended', value: 'SUSPENDED' },
            { label: 'Terminated', value: 'TERMINATED' },
            { label: 'Resigned', value: 'RESIGNED' },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={employees?.data ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: employees?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} employees`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <EmployeeModal
        open={modalOpen}
        employee={editingEmployee}
        onClose={() => {
          setModalOpen(false);
          setEditingEmployee(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingEmployee(null);
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }}
      />
    </div>
  );
};

export default EmployeeListPage;

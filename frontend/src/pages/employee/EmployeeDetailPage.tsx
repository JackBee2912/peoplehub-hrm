import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Descriptions, Tabs, Tag, Space, Typography, Button, Skeleton } from 'antd';
import { MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee';
import { PageHeader, StatusBadge } from '@/components/common';
import { formatDate, getAge } from '@/utils/format';

const { Title, Text } = Typography;

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <PageHeader
          title="Employee Not Found"
          onBack={() => navigate('/admin/employees')}
        />
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const age = getAge(employee.dateOfBirth);
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

  const tabItems = [
    {
      key: 'info',
      label: 'Personal Information',
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Employee Code">{employee.employeeCode}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">
            <MailOutlined /> {employee.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            <PhoneOutlined /> {employee.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            <CalendarOutlined /> {formatDate(employee.dateOfBirth)} {age ? `(Age: ${age})` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">{employee.gender || '-'}</Descriptions.Item>
          <Descriptions.Item label="Marital Status">{employee.maritalStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nationality">{employee.nationality || '-'}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {[employee.address, employee.city, employee.state, employee.country, employee.postalCode]
              .filter(Boolean)
              .join(', ') || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Emergency Contact">{employee.emergencyContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="Emergency Phone">{employee.emergencyPhone || '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'employment',
      label: 'Employment',
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Status">
            <StatusBadge status={employee.status.toLowerCase()} />
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {employee.department?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Position">
            {employee.position?.title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Contract Type">
            {employee.contractType ? (
              <Tag>{employee.contractType.replace('_', ' ')}</Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Hire Date">
            {formatDate(employee.hireDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Probation Ends">
            {formatDate(employee.probationEndDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Manager">
            {employee.manager
              ? `${employee.manager.firstName} ${employee.manager.lastName}`
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Text type="secondary">No documents uploaded yet.</Text>
        </div>
      ),
    },
    {
      key: 'history',
      label: 'History',
      children: (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Text type="secondary">No employment history records yet.</Text>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={fullName}
        subtitle={employee.employeeCode}
        breadcrumbs={[
          { title: 'Home', href: '/admin' },
          { title: 'Employees', href: '/admin/employees' },
          { title: fullName },
        ]}
        onBack={() => navigate('/admin/employees')}
        extra={
          <Button onClick={() => navigate(`/admin/employees/${id}/edit`)}>
            Edit Employee
          </Button>
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Space size={24} style={{ width: '100%', flexWrap: 'wrap' }}>
          <Avatar
            size={64}
            style={{ backgroundColor: '#1677ff', fontSize: 24 }}
          >
            {initials}
          </Avatar>
          <div>
            <Title level={4} style={{ margin: '0 0 4px' }}>{fullName}</Title>
            <Space>
              <Tag color={employee.status === 'ACTIVE' ? 'green' : 'default'}>
                {employee.status}
              </Tag>
              {employee.department && (
                <Tag>{employee.department.name}</Tag>
              )}
              {employee.position && (
                <Tag>{employee.position.title}</Tag>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      <Tabs defaultActiveKey="info" items={tabItems} />
    </div>
  );
};

export default EmployeeDetailPage;

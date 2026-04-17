import React from 'react';
import { Row, Col, Card, Statistic, Table } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { PageHeader } from '@/components/common';
import type { ColumnsType } from 'antd/es/table';
import type { ActivityItem } from '@/types';
import { formatDate } from '@/utils/format';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: activities, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardService.getRecentActivity(10),
  });

  const activityColumns: ColumnsType<ActivityItem> = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Activity',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
      width: 150,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to PeopleHub HRM System"
        breadcrumbs={[{ title: 'Home' }, { title: 'Dashboard' }]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={stats?.totalEmployees ?? 0}
              prefix={<TeamOutlined />}
              loading={statsLoading}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Departments"
              value={stats?.totalDepartments ?? 0}
              prefix={<ApartmentOutlined />}
              loading={statsLoading}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Hires (This Month)"
              value={stats?.newHiresThisMonth ?? 0}
              prefix={<UserAddOutlined />}
              loading={statsLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={stats?.activeEmployees ?? 0}
              prefix={<RiseOutlined />}
              loading={statsLoading}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Activity" loading={activityLoading}>
        <Table
          columns={activityColumns}
          dataSource={activities ?? []}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'No recent activity' }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;

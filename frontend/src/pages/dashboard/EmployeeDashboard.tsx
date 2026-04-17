import React from 'react';
import { Row, Col, Card, Avatar, Typography, List, Button, Space, Tag } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  MailOutlined,
  ApartmentOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { dashboardService } from '@/services/dashboard';
import { employeeService } from '@/services/employee';
import { PageHeader } from '@/components/common';
import { formatDate } from '@/utils/format';
import type { BirthdayItem } from '@/types';

const { Title, Text, Paragraph } = Typography;

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({
    queryKey: ['dashboard-birthdays'],
    queryFn: () => dashboardService.getUpcomingBirthdays(5),
  });

  const { data: _employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => employeeService.getList({ page: 1, pageSize: 1 }),
  });

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  const quickActions = [
    { label: 'Apply for Leave', icon: <CalendarOutlined /> },
    { label: 'View Payslip', icon: <MailOutlined /> },
    { label: 'Update Profile', icon: <UserOutlined /> },
    { label: 'My Documents', icon: <ApartmentOutlined /> },
  ];

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle="Welcome back!"
        breadcrumbs={[{ title: 'Home' }, { title: 'Dashboard' }]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <Avatar size={48} style={{ backgroundColor: '#1677ff' }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Avatar>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{fullName}</Title>
                  <Text type="secondary">{user?.role}</Text>
                </div>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary"><MailOutlined /> Email</Text>
                <br />
                <Text strong>{user?.email}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary"><UserOutlined /> Role</Text>
                <br />
                <Tag color="blue">{user?.role}</Tag>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <List
              grid={{ gutter: 8, column: 2 }}
              dataSource={quickActions}
              renderItem={(action) => (
                <List.Item>
                  <Button type="text" icon={action.icon} block>
                    {action.label}
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <GiftOutlined />
                Upcoming Birthdays
              </Space>
            }
            loading={birthdaysLoading}
          >
            <List
              dataSource={birthdays ?? []}
              renderItem={(item: BirthdayItem) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.name.charAt(0)}</Avatar>}
                    title={item.name}
                    description={
                      <Space>
                        <CalendarOutlined />
                        {formatDate(item.dateOfBirth, 'MMM DD')}
                        {item.department && (
                          <>
                            <ApartmentOutlined />
                            {item.department}
                          </>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No upcoming birthdays' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Company Announcements">
            <Paragraph>
              Welcome to PeopleHub HRM System! This is your personalized dashboard.
              Here you can manage your profile, apply for leave, view payslips, and more.
            </Paragraph>
            <Text type="secondary">
              Use the sidebar navigation to explore all available features.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;

import React, { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography,
  Calendar, List, Avatar,
} from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { managerService } from '@/services/manager';
import { PageHeader } from '@/components/common';
import { formatDate, formatTime } from '@/utils/format';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'orange',
  ON_LEAVE: 'blue',
  REMOTE: 'cyan',
  EARLY_LEAVE: 'volcano',
};

const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [calendarMonth, setCalendarMonth] = useState(dayjs());

  const { data: teamAttendance, isLoading: teamLoading } = useQuery({
    queryKey: ['manager-team-attendance'],
    queryFn: () => managerService.getTeamAttendance(),
  });

  const { data: pendingApprovals, isLoading: pendingLoading } = useQuery({
    queryKey: ['manager-pending-approvals'],
    queryFn: () => managerService.getPendingApprovals(),
  });

  const { data: teamCalendar } = useQuery({
    queryKey: ['manager-team-calendar', calendarMonth.month(), calendarMonth.year()],
    queryFn: () => managerService.getTeamCalendar(calendarMonth.month() + 1, calendarMonth.year()),
  });

  const handleCalendarPanelChange = (value: Dayjs) => {
    setCalendarMonth(value);
  };

  const calendarMap = new Map<string, any>();
  teamCalendar?.forEach((item) => {
    calendarMap.set(item.date, item);
  });

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const data = calendarMap.get(dateStr);

    if (!data) return null;

    const hasEvents = (data.onLeave?.length || 0) + (data.absent?.length || 0) + (data.late?.length || 0);
    if (!hasEvents) return null;

    return (
      <div style={{ fontSize: 10 }}>
        {data.onLeave?.length > 0 && (
          <div style={{ color: '#1677ff' }}>
            {data.onLeave.length} on leave
          </div>
        )}
        {data.absent?.length > 0 && (
          <div style={{ color: '#ff4d4f' }}>
            {data.absent.length} absent
          </div>
        )}
        {data.late?.length > 0 && (
          <div style={{ color: '#faad14' }}>
            {data.late.length} late
          </div>
        )}
      </div>
    );
  };

  const teamColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, r: any) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
            {r.firstName.charAt(0)}{r.lastName.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{r.firstName} {r.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.employeeCode}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      key: 'department',
      render: (name?: string) => name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>,
    },
    {
      title: 'Check In',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (time?: string) => time ? formatTime(time) : '-',
    },
    {
      title: 'Shift',
      dataIndex: ['shift', 'name'],
      key: 'shift',
      render: (name?: string) => name || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        subtitle="Team overview and pending actions"
        breadcrumbs={[{ title: 'Home' }, { title: 'Manager' }]}
      />

      {/* Team Attendance Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={<><TeamOutlined /> Team Size</>}
              value={teamAttendance?.totalTeamMembers || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={<><CheckCircleOutlined /> Present</>}
              value={teamAttendance?.presentToday || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={<><ClockCircleOutlined /> Late</>}
              value={teamAttendance?.lateToday || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="On Leave"
              value={teamAttendance?.onLeaveToday || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Absent"
              value={teamAttendance?.absentToday || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Remote"
              value={teamAttendance?.remoteToday || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Team Attendance Table */}
        <Col xs={24} lg={16}>
          <Card
            title="Team Attendance Today"
            extra={
              <Button type="link" onClick={() => navigate('/attendance/history')}>
                View All
              </Button>
            }
          >
            <Table
              columns={teamColumns}
              dataSource={teamAttendance?.teamMembers || []}
              loading={teamLoading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>

        {/* Pending Approvals */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Pending Approvals
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/leave/approvals')}>
                View All
              </Button>
            }
          >
            {pendingApprovals && pendingApprovals.requests.length > 0 ? (
              <List
                dataSource={pendingApprovals.requests}
                loading={pendingLoading}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }} />,
                      <Button type="link" size="small" icon={<CloseOutlined />} danger />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#1677ff' }}>
                          {item.employeeName.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{item.employeeName}</Text>
                          <Tag color="blue">{item.leaveTypeName}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            {formatDate(item.startDate, 'DD MMM')} - {formatDate(item.endDate, 'DD MMM')}
                            ({item.days} days)
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Submitted {formatDate(item.createdAt, 'DD MMM')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No pending approvals</Text>
            )}
          </Card>
        </Col>

        {/* Team Calendar */}
        <Col xs={24}>
          <Card title={<><CalendarOutlined /> Team Calendar</>}>
            <Calendar
              value={calendarMonth}
              onPanelChange={handleCalendarPanelChange}
              dateCellRender={dateCellRender}
              fullscreen={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboardPage;

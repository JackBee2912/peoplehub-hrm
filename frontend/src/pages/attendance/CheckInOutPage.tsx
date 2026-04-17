import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Row, Col, Statistic, Tag, Timeline, message } from 'antd';
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { PageHeader } from '@/components/common';
import { formatDate, formatTime, formatDuration } from '@/utils/format';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CheckInOutPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's status
  const { data: todayStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceService.getTodayStatus(),
    refetchInterval: 30000,
  });

  // Recent history
  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-recent'],
    queryFn: () => attendanceService.getRecentHistory(5),
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-recent'] });
    },
    onError: () => {
      message.error('Check-in failed. Please try again.');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-recent'] });
    },
    onError: () => {
      message.error('Check-out failed. Please try again.');
    },
  });

  const canCheckIn = !todayStatus?.checkedIn;
  const canCheckOut = todayStatus?.checkedIn && !todayStatus?.checkedOut;

  const workedHours = todayStatus?.workedHours || 0;

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Check in/out and view your attendance history"
        breadcrumbs={[{ title: 'Home' }, { title: 'Attendance' }]}
      />

      {/* Big Clock + Action Card */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              minHeight: 280,
            }}
            styles={{ body: { padding: '32px 24px' } }}
          >
            <ClockCircleOutlined style={{ fontSize: 32, marginBottom: 16 }} />
            <Title level={1} style={{ color: '#fff', margin: '16px 0', fontSize: 56 }}>
              {currentTime.format('HH:mm:ss')}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              {currentTime.format('dddd, MMMM DD, YYYY')}
            </Text>

            <div style={{ marginTop: 32 }}>
              {canCheckIn && (
                <Button
                  type="primary"
                  size="large"
                  icon={<LoginOutlined />}
                  loading={checkInMutation.isPending}
                  onClick={() => checkInMutation.mutate()}
                  style={{
                    height: 56,
                    fontSize: 18,
                    padding: '0 48px',
                    borderRadius: 28,
                    background: '#52c41a',
                    borderColor: '#52c41a',
                  }}
                >
                  Check In
                </Button>
              )}
              {canCheckOut && (
                <Button
                  type="primary"
                  size="large"
                  icon={<LogoutOutlined />}
                  loading={checkOutMutation.isPending}
                  onClick={() => checkOutMutation.mutate()}
                  style={{
                    height: 56,
                    fontSize: 18,
                    padding: '0 48px',
                    borderRadius: 28,
                    background: '#fa541c',
                    borderColor: '#fa541c',
                  }}
                >
                  Check Out
                </Button>
              )}
              {todayStatus?.checkedOut && (
                <Tag
                  style={{
                    fontSize: 16,
                    padding: '8px 24px',
                    borderRadius: 20,
                    height: 'auto',
                  }}
                  color="default"
                >
                  <CheckCircleOutlined /> Checked out for today
                </Tag>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Today's Status" loading={statusLoading}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Check In"
                  value={todayStatus?.checkInTime ? formatTime(todayStatus.checkInTime) : '--:--'}
                  prefix={<LoginOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Check Out"
                  value={todayStatus?.checkOutTime ? formatTime(todayStatus.checkOutTime) : '--:--'}
                  prefix={<LogoutOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Worked Hours"
                  value={workedHours.toFixed(1)}
                  suffix="hrs"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Status"
                  value={todayStatus?.status || 'Not checked in'}
                />
              </Col>
            </Row>

            {todayStatus?.checkInTime && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  <EnvironmentOutlined /> IP tracked automatically
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Duration: {formatDuration(workedHours)}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent History */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            Recent Attendance History
          </Space>
        }
        style={{ marginTop: 16 }}
        loading={historyLoading}
      >
        {recentHistory && recentHistory.length > 0 ? (
          <Timeline
            items={recentHistory.map((log) => ({
              color:
                log.status === 'PRESENT'
                  ? 'green'
                  : log.status === 'LATE'
                    ? 'orange'
                    : 'red',
              children: (
                <div>
                  <Text strong>{formatDate(log.date, 'ddd, DD MMM YYYY')}</Text>
                  <br />
                  <Text type="secondary">
                    {log.checkInTime ? formatTime(log.checkInTime) : '--:--'}
                    {log.checkOutTime ? ` - ${formatTime(log.checkOutTime)}` : ''}
                    {log.workedHours ? ` (${formatDuration(log.workedHours)})` : ''}
                  </Text>
                  <Tag
                    style={{ marginLeft: 8 }}
                    color={
                      log.status === 'PRESENT'
                        ? 'green'
                        : log.status === 'LATE'
                          ? 'orange'
                          : 'red'
                    }
                  >
                    {log.status}
                  </Tag>
                </div>
              ),
            }))}
          />
        ) : (
          <Text type="secondary">No attendance history yet. Start by checking in!</Text>
        )}
      </Card>
    </div>
  );
};

export default CheckInOutPage;

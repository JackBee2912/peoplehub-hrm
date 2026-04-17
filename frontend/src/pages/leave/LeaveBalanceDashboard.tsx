import React, { useState } from 'react';
import { Card, Row, Col, Tag, Progress, Typography, Select, Space, Divider } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/services/leave';
import { PageHeader } from '@/components/common';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const categoryLabels: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  UNPAID: 'Unpaid Leave',
  COMPENSATORY: 'Compensatory Leave',
  BEREAVEMENT: 'Bereavement Leave',
  MARRIAGE: 'Marriage Leave',
  CUSTOM: 'Custom Leave',
};

const LeaveBalanceDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const { data: balances } = useQuery({
    queryKey: ['leave-balances', selectedYear],
    queryFn: () => leaveService.getMyBalances(selectedYear),
  });

  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const year = dayjs().year() - 1 + i;
    return { label: String(year), value: year };
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const totalAllocated = balances?.reduce((sum, b) => sum + b.totalAllocated, 0) || 0;
  const totalUsed = balances?.reduce((sum, b) => sum + b.used, 0) || 0;
  const totalRemaining = balances?.reduce((sum, b) => sum + b.remaining, 0) || 0;
  const totalPending = balances?.reduce((sum, b) => sum + b.pending, 0) || 0;

  return (
    <div>
      <PageHeader
        title="Leave Balance"
        subtitle="View your leave balances and usage"
        breadcrumbs={[{ title: 'Home' }, { title: 'Leave' }, { title: 'Balance' }]}
        extra={
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            style={{ width: 100 }}
          />
        }
      />

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <StatisticCard
              title="Total Allocated"
              value={totalAllocated}
              suffix="days"
              icon={<CalendarOutlined />}
              color="#1677ff"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <StatisticCard
              title="Total Used"
              value={totalUsed}
              suffix="days"
              icon={<CheckCircleOutlined />}
              color="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <StatisticCard
              title="Remaining"
              value={totalRemaining}
              suffix="days"
              icon={<BarChartOutlined />}
              color={totalRemaining > 0 ? '#52c41a' : '#ff4d4f'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <StatisticCard
              title="Pending"
              value={totalPending}
              suffix="days"
              icon={<ClockCircleOutlined />}
              color="#faad14"
            />
          </Card>
        </Col>
      </Row>

      {/* Balance Cards */}
      <Row gutter={[16, 16]}>
        {balances && balances.length > 0 ? (
          balances.map((balance) => {
            const usagePercent = balance.totalAllocated > 0
              ? Math.round((balance.used / balance.totalAllocated) * 100)
              : 0;

            return (
              <Col xs={24} sm={12} lg={8} key={balance.id}>
                <Card
                  hoverable
                  styles={{ body: { padding: 20 } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <Tag color={balance.leaveType.color || 'blue'} style={{ marginBottom: 4 }}>
                        {categoryLabels[balance.leaveType.category] || balance.leaveType.name}
                      </Tag>
                      <Title level={4} style={{ margin: 0 }}>
                        {balance.leaveType.name}
                      </Title>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Title level={2} style={{ margin: 0, color: balance.remaining > 0 ? '#52c41a' : '#ff4d4f' }}>
                        {balance.remaining}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>remaining</Text>
                    </div>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary">Usage</Text>
                        <Text strong>{usagePercent}%</Text>
                      </div>
                      <Progress
                        percent={usagePercent}
                        strokeColor={getProgressColor(usagePercent)}
                        trailColor="#f0f0f0"
                        showInfo={false}
                        size="small"
                      />
                    </div>

                    <Row gutter={8}>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Total</Text>
                        <br />
                        <Text strong>{balance.totalAllocated}</Text>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Used</Text>
                        <br />
                        <Text strong style={{ color: '#52c41a' }}>{balance.used}</Text>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Pending</Text>
                        <br />
                        <Text strong style={{ color: balance.pending > 0 ? '#faad14' : undefined }}>
                          {balance.pending}
                        </Text>
                      </Col>
                    </Row>

                    {balance.carryOver > 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> Carry over: {balance.carryOver} days
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col span={24}>
            <Card>
              <Text type="secondary">No leave balances available for {selectedYear}.</Text>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

// Simple inline stat card component
const StatisticCard: React.FC<{
  title: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, suffix, icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
      <br />
      <Title level={3} style={{ margin: 0, color }}>{value} <Text type="secondary" style={{ fontSize: 14 }}>{suffix}</Text></Title>
    </div>
  </div>
);

export default LeaveBalanceDashboard;

import React, { useState } from 'react';
import {
  Card, Row, Col, DatePicker, Button, Space, Typography, Statistic,
  Select,
} from 'antd';
import { ExportOutlined, BarChartOutlined, PieChartOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { PageHeader } from '@/components/common';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// Inline chart components to avoid recharts import complexity
const SimpleBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: 8, padding: '0 8px' }}>
      {data.map((item, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 500 }}>{item.value}</Text>
          <div
            style={{
              width: '100%',
              maxWidth: 40,
              height: `${(item.value / maxValue) * (height - 40)}px`,
              background: item.color,
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
              transition: 'height 0.3s',
            }}
          />
          <Text style={{ fontSize: 10 }} type="secondary">{item.label}</Text>
        </div>
      ))}
    </div>
  );
};

const SimpleLineChart: React.FC<{
  data: { label: string; values: { name: string; value: number; color: string }[] }[];
  height?: number;
}> = ({ data, height = 200 }) => {
  if (data.length === 0) return <Text type="secondary">No data</Text>;

  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const maxValue = Math.max(...allValues, 1);

  return (
    <div style={{ height, position: 'relative', borderLeft: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
      {data.map((point, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        return point.values.map((v, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              bottom: `${(v.value / maxValue) * (height - 20)}px`,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: v.color,
              transform: 'translate(-50%, 50%)',
            }}
            title={`${point.label}: ${v.name} = ${v.value}`}
          />
        ));
      })}
    </div>
  );
};

const AttendanceReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const [exportFormat, setExportFormat] = useState('csv');

  const { data: reportData } = useQuery({
    queryKey: [
      'attendance-report',
      dateRange[0]?.format('YYYY-MM-DD'),
      dateRange[1]?.format('YYYY-MM-DD'),
    ],
    queryFn: () =>
      attendanceService.getReport(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      ),
    enabled: !!dateRange[0] && !!dateRange[1],
  });

  const handleExport = async () => {
    try {
      const blob = await attendanceService.exportCSV({
        dateFrom: dateRange[0].format('YYYY-MM-DD'),
        dateTo: dateRange[1].format('YYYY-MM-DD'),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-export-${dateRange[0].format('YYYY-MM-DD')}-${dateRange[1].format('YYYY-MM-DD')}.${exportFormat}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }
  };

  const summary = reportData?.summary;
  const dailyData = reportData?.dailyData || [];

  // Prepare bar chart data for daily attendance
  const chartData = dailyData.slice(0, 14).map((d) => ({
    label: dayjs(d.date).format('DD'),
    value: d.present,
    color: '#52c41a',
  }));

  const combinedChartData = dailyData.slice(0, 14).map((d) => ({
    label: dayjs(d.date).format('DD'),
    values: [
      { name: 'Present', value: d.present, color: '#52c41a' },
      { name: 'Late', value: d.late, color: '#faad14' },
      { name: 'Absent', value: d.absent, color: '#ff4d4f' },
    ],
  }));

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        subtitle="Analytics and insights for attendance data"
        breadcrumbs={[{ title: 'Home' }, { title: 'Reports' }, { title: 'Attendance' }]}
        extra={
          <Space>
            <Select value={exportFormat} onChange={setExportFormat} style={{ width: 100 }}>
              <Select.Option value="csv">CSV</Select.Option>
              <Select.Option value="xlsx">Excel</Select.Option>
            </Select>
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Space>
        }
      />

      {/* Date Range Picker */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>Date Range:</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates: any) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange(dates);
              }
            }}
          />
        </Space>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={<><TeamOutlined /> Total Days</>}
              value={summary?.totalDays || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Present"
              value={summary?.presentDays || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Absent"
              value={summary?.absentDays || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Late"
              value={summary?.lateDays || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="On Leave"
              value={summary?.onLeaveDays || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Avg Hours/Day"
              value={summary?.avgWorkedHours?.toFixed(1) || 0}
              suffix="hrs"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><BarChartOutlined /> Daily Attendance (Last 14 days)</>}>
            {chartData.length > 0 ? (
              <SimpleBarChart data={chartData} height={200} />
            ) : (
              <Text type="secondary">No data available for the selected period.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><PieChartOutlined /> Attendance Overview</>}>
            {summary && (
              <SimpleBarChart
                data={[
                  { label: 'Present', value: summary.presentDays, color: '#52c41a' },
                  { label: 'Absent', value: summary.absentDays, color: '#ff4d4f' },
                  { label: 'Late', value: summary.lateDays, color: '#faad14' },
                  { label: 'Leave', value: summary.onLeaveDays, color: '#1677ff' },
                  { label: 'Remote', value: summary.remoteDays, color: '#13c2c2' },
                ]}
                height={200}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Daily Trends">
            {combinedChartData.length > 0 ? (
              <>
                <SimpleLineChart data={combinedChartData} height={180} />
                <div style={{ marginTop: 8 }}>
                  <Space size="large">
                    <Space><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a' }} /><Text>Present</Text></Space>
                    <Space><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#faad14' }} /><Text>Late</Text></Space>
                    <Space><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f' }} /><Text>Absent</Text></Space>
                  </Space>
                </div>
              </>
            ) : (
              <Text type="secondary">No daily data available.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceReportsPage;

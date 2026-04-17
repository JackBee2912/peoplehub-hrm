import React, { useState, useMemo } from 'react';
import { Card, Calendar, Tag, Modal, Descriptions, Typography, Spin } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { PageHeader } from '@/components/common';
import { formatDate, formatTime } from '@/utils/format';
import type { AttendanceDayRecord } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  PRESENT: '#52c41a',
  ABSENT: '#ff4d4f',
  LATE: '#faad14',
  EARLY_LEAVE: '#fa8c16',
  HALF_DAY: '#722ed1',
  ON_LEAVE: '#1890ff',
  REMOTE: '#13c2c2',
};

const statusLabels: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  EARLY_LEAVE: 'Early Leave',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
  REMOTE: 'Remote',
};

const AttendanceCalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDayRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [viewDate, setViewDate] = useState(dayjs());

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['attendance-calendar', viewDate.year(), viewDate.month()],
    queryFn: () => attendanceService.getCalendarData(viewDate.year(), viewDate.month()),
  });

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceDayRecord>();
    calendarData?.forEach((record) => {
      map.set(record.date, record);
    });
    return map;
  }, [calendarData]);

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const record = recordMap.get(dateStr);

    if (!record) {
      // Check if it's a future date
      if (value.isAfter(dayjs(), 'day')) {
        return null;
      }
      // Check if it's a weekend
      const dayOfWeek = value.day();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return null;
      }
      return (
        <div style={{ textAlign: 'center' }}>
          <Tag color="default" style={{ fontSize: 10 }}>Absent</Tag>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center' }}>
        <Tag
          color={statusColors[record.status] || 'default'}
          style={{ fontSize: 10, marginBottom: 2 }}
        >
          {statusLabels[record.status] || record.status}
        </Tag>
        {record.checkInTime && (
          <div>
            <Text style={{ fontSize: 10 }}>{record.checkInTime?.slice(0, 5)}</Text>
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const record = recordMap.get(dateStr);
    if (record) {
      setSelectedRecord(record);
      setSelectedDate(value);
      setModalVisible(true);
    }
  };

  const handlePanelChange = (value: Dayjs) => {
    setViewDate(value);
  };

  const calendarProps: CalendarProps<Dayjs> = {
    value: viewDate,
    onSelect: handleDateSelect,
    onPanelChange: handlePanelChange,
    dateCellRender,
    fullscreen: true,
  };

  // Calculate month summary
  const monthSummary = useMemo(() => {
    if (!calendarData) return null;
    const summary: Record<string, number> = {};
    calendarData.forEach((record) => {
      summary[record.status] = (summary[record.status] || 0) + 1;
    });
    return summary;
  }, [calendarData]);

  return (
    <div>
      <PageHeader
        title="Attendance Calendar"
        subtitle="Monthly view of your attendance"
        breadcrumbs={[{ title: 'Home' }, { title: 'Attendance' }, { title: 'Calendar' }]}
      />

      <Spin spinning={isLoading}>
        <Card
          styles={{ body: { padding: 0 } }}
          extra={
            monthSummary && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(monthSummary).map(([status, count]) => (
                  <Tag key={status} color={statusColors[status] || 'default'}>
                    {statusLabels[status] || status}: {count}
                  </Tag>
                ))}
              </div>
            )
          }
        >
          <Calendar {...calendarProps} />
        </Card>
      </Spin>

      <Card style={{ marginTop: 16 }}>
        <Typography.Title level={5}>Legend</Typography.Title>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(statusLabels).map(([key, label]) => (
            <Tag key={key} color={statusColors[key]}>
              {label}
            </Tag>
          ))}
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Attendance Details - ${selectedDate?.format('DD MMM YYYY')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Date">
              {formatDate(selectedRecord.date)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[selectedRecord.status]}>
                {statusLabels[selectedRecord.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Check In">
              {selectedRecord.checkInTime ? formatTime(selectedRecord.checkInTime) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Check Out">
              {selectedRecord.checkOutTime ? formatTime(selectedRecord.checkOutTime) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Worked Hours">
              {selectedRecord.workedHours ? `${selectedRecord.workedHours.toFixed(1)} hrs` : '-'}
            </Descriptions.Item>
            {selectedRecord.lateMinutes && selectedRecord.lateMinutes > 0 && (
              <Descriptions.Item label="Late By">
                <Tag color="orange">{selectedRecord.lateMinutes} minutes</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceCalendarPage;

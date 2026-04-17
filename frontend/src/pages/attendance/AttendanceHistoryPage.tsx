import React, { useState } from 'react';
import { Card, Table, Space, DatePicker, Select, Button, Tag } from 'antd';
import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { PageHeader } from '@/components/common';
import { formatDate, formatTime, formatDuration } from '@/utils/format';
import type { AttendanceLog, AttendanceFilters } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const statusColors: Record<string, string> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'orange',
  EARLY_LEAVE: 'volcano',
  HALF_DAY: 'gold',
  ON_LEAVE: 'blue',
  REMOTE: 'cyan',
};

const AttendanceHistoryPage: React.FC = () => {
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    pageSize: 20,
    dateFrom: dayjs().startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-history', filters],
    queryFn: () => attendanceService.getList(filters),
  });

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setFilters((prev) => ({
        ...prev,
        dateFrom: dates[0].format('YYYY-MM-DD'),
        dateTo: dates[1].format('YYYY-MM-DD'),
        page: 1,
      }));
    }
  };

  const handleStatusChange = (value?: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as AttendanceFilters['status'],
      page: 1,
    }));
  };

  const handleExport = async () => {
    try {
      const blob = await attendanceService.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-report-${dayjs().format('YYYY-MM-DD')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: show message
    }
  };

  const columns: ColumnsType<AttendanceLog> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date: string) => formatDate(date, 'DD MMM YYYY'),
    },
    {
      title: 'Check In',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 100,
      render: (time?: string) => time ? formatTime(time) : '-',
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 100,
      render: (time?: string) => time ? formatTime(time) : '-',
    },
    {
      title: 'Worked',
      dataIndex: 'workedHours',
      key: 'workedHours',
      width: 100,
      render: (hours?: number) => formatDuration(hours),
    },
    {
      title: 'Late',
      dataIndex: 'lateMinutes',
      key: 'lateMinutes',
      width: 80,
      render: (minutes?: number) =>
        minutes && minutes > 0 ? <Tag color="orange">{minutes}m</Tag> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Present', value: 'PRESENT' },
        { text: 'Absent', value: 'ABSENT' },
        { text: 'Late', value: 'LATE' },
        { text: 'Early Leave', value: 'EARLY_LEAVE' },
        { text: 'Half Day', value: 'HALF_DAY' },
        { text: 'On Leave', value: 'ON_LEAVE' },
        { text: 'Remote', value: 'REMOTE' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Shift',
      dataIndex: ['shift', 'name'],
      key: 'shift',
      width: 120,
      render: (name?: string) => name || '-',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes?: string) => notes || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance History"
        subtitle="View and filter your attendance records"
        breadcrumbs={[{ title: 'Home' }, { title: 'Attendance' }, { title: 'History' }]}
      />

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            onChange={handleStatusChange}
            options={[
              { label: 'Present', value: 'PRESENT' },
              { label: 'Absent', value: 'ABSENT' },
              { label: 'Late', value: 'LATE' },
              { label: 'Early Leave', value: 'EARLY_LEAVE' },
              { label: 'Half Day', value: 'HALF_DAY' },
              { label: 'On Leave', value: 'ON_LEAVE' },
              { label: 'Remote', value: 'REMOTE' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: data?.total || 0,
            showTotal: (total) => `Total ${total} records`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              setFilters((prev) => ({ ...prev, page, pageSize }));
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default AttendanceHistoryPage;

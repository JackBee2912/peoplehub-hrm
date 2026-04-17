import React, { useState } from 'react';
import {
  Card, Calendar, Modal, Form, Input, Select, Switch, Button,
  Tag, Space, message, Popconfirm, Typography, Spin,
} from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined, GlobalOutlined, BankOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '@/services/holiday';
import { PageHeader } from '@/components/common';
import { formatDate } from '@/utils/format';
import type { Holiday } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

const holidayTypeColors: Record<string, string> = {
  PUBLIC: 'red',
  COMPANY: 'blue',
  DEPARTMENT: 'green',
};

const HolidayCalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [viewYear, setViewYear] = useState(dayjs().year());

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', viewYear],
    queryFn: () => holidayService.getByYear(viewYear),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return holidayService.update(data);
      }
      return holidayService.create(data);
    },
    onSuccess: () => {
      message.success(editingHoliday ? 'Holiday updated' : 'Holiday created');
      setModalVisible(false);
      form.resetFields();
      setEditingHoliday(null);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: () => message.error('Failed to save holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => {
      message.success('Holiday deleted');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: () => message.error('Failed to delete holiday'),
  });

  const holidayMap = new Map<string, Holiday[]>();
  holidays?.forEach((h) => {
    const dateStr = h.date;
    if (!holidayMap.has(dateStr)) holidayMap.set(dateStr, []);
    holidayMap.get(dateStr)!.push(h);
  });

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayHolidays = holidayMap.get(dateStr);

    if (!dayHolidays) return null;

    return (
      <div>
        {dayHolidays.map((h) => (
          <Tag
            key={h.id}
            color={holidayTypeColors[h.type] || 'blue'}
            style={{ fontSize: 10, marginBottom: 2, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(h);
            }}
          >
            {h.name}
          </Tag>
        ))}
      </div>
    );
  };

  const handlePanelChange = (value: Dayjs) => {
    setViewYear(value.year());
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    form.setFieldsValue({
      name: holiday.name,
      date: dayjs(holiday.date),
      type: holiday.type,
      description: holiday.description,
      isRecurring: holiday.isRecurring,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };
      if (editingHoliday) {
        data.id = editingHoliday.id;
      }
      upsertMutation.mutate(data);
    });
  };

  const calendarProps: CalendarProps<Dayjs> = {
    value: dayjs().year(viewYear),
    onPanelChange: handlePanelChange,
    dateCellRender,
    fullscreen: true,
  };

  const holidayList = holidays || [];

  return (
    <div>
      <PageHeader
        title="Holiday Calendar"
        subtitle={`Manage holidays for ${viewYear}`}
        breadcrumbs={[{ title: 'Home' }, { title: 'Leave' }, { title: 'Holidays' }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingHoliday(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Add Holiday
          </Button>
        }
      />

      <Spin spinning={isLoading}>
        <Card styles={{ body: { padding: 0 } }}>
          <Calendar {...calendarProps} />
        </Card>
      </Spin>

      {/* Holiday List */}
      <Card title="Holiday List" style={{ marginTop: 16 }}>
        {holidayList.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {holidayList
              .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
              .map((holiday) => (
                <Card
                  key={holiday.id}
                  size="small"
                  extra={
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(holiday)}
                      />
                      <Popconfirm
                        title="Delete this holiday?"
                        onConfirm={() => handleDelete(holiday.id)}
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  }
                >
                  <Space>
                    <Tag color={holidayTypeColors[holiday.type]}>{holiday.type}</Tag>
                    <Text strong>{holiday.name}</Text>
                    <Text type="secondary">{formatDate(holiday.date, 'DD MMM YYYY')}</Text>
                    {holiday.isRecurring && (
                      <Tag color="purple">Recurring</Tag>
                    )}
                    {holiday.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{holiday.description}</Text>
                    )}
                  </Space>
                </Card>
              ))}
          </Space>
        ) : (
          <Text type="secondary">No holidays found for {viewYear}.</Text>
        )}
      </Card>

      {/* Legend */}
      <Card style={{ marginTop: 16 }}>
        <Space>
          <Text strong>Legend:</Text>
          <Tag color="red"><GlobalOutlined /> Public Holiday</Tag>
          <Tag color="blue"><BankOutlined /> Company Holiday</Tag>
          <Tag color="green">Department Holiday</Tag>
        </Space>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={upsertMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Holiday Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., New Year's Day" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="PUBLIC">Public Holiday</Select.Option>
              <Select.Option value="COMPANY">Company Holiday</Select.Option>
              <Select.Option value="DEPARTMENT">Department Holiday</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="isRecurring" label="Recurring (every year)" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HolidayCalendarPage;

import React, { useState, useMemo } from 'react';
import {
  Card, Form, Select, DatePicker, Input, Switch, Button, Row, Col,
  Typography, message, Upload, Alert, Space, Tag,
} from 'antd';
import { UploadOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave';
import { PageHeader } from '@/components/common';
import { getDaysBetween } from '@/utils/format';
import type { CreateLeaveRequestInput, LeaveType } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const LeaveRequestFormPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveService.getLeaveTypes(),
  });

  const { data: balances } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => leaveService.getMyBalances(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveRequestInput) => leaveService.createRequest(data),
    onSuccess: () => {
      message.success('Leave request submitted successfully');
      form.resetFields();
      setIsHalfDay(false);
      setDateRange(null);
      setSelectedLeaveType(null);
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to submit leave request');
    },
  });

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      const days = getDaysBetween(dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'));
      form.setFieldValue('days', isHalfDay ? 0.5 : days);
    }
  };

  const handleLeaveTypeChange = (value: string) => {
    const type = leaveTypes?.find((t) => t.id === value);
    setSelectedLeaveType(type || null);
  };

  const handleHalfDayToggle = (checked: boolean) => {
    setIsHalfDay(checked);
    if (checked && dateRange) {
      form.setFieldValue('days', 0.5);
    } else if (dateRange) {
      const days = getDaysBetween(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
      form.setFieldValue('days', days);
    }
  };

  const balanceForSelected = useMemo(() => {
    if (!selectedLeaveType || !balances) return null;
    return balances.find((b) => b.leaveTypeId === selectedLeaveType.id);
  }, [selectedLeaveType, balances]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (!dateRange) {
        message.error('Please select a date range');
        return;
      }

      const data: CreateLeaveRequestInput = {
        leaveTypeId: values.leaveTypeId,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        days: values.days,
        isHalfDay,
        halfDayPeriod: isHalfDay ? values.halfDayPeriod : undefined,
        reason: values.reason,
      };

      createMutation.mutate(data);
    });
  };

  return (
    <div>
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a new leave request"
        breadcrumbs={[{ title: 'Home' }, { title: 'Leave' }, { title: 'Apply' }]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <Form form={form} layout="vertical">
              <Form.Item
                name="leaveTypeId"
                label="Leave Type"
                rules={[{ required: true, message: 'Please select a leave type' }]}
              >
                <Select
                  placeholder="Select leave type"
                  onChange={handleLeaveTypeChange}
                  options={leaveTypes?.filter((t) => t.isActive).map((t) => ({
                    label: `${t.name} (${t.daysPerYear} days/year)`,
                    value: t.id,
                  }))}
                />
              </Form.Item>

              {selectedLeaveType && (
                <Alert
                  message={
                    <Space>
                      <InfoCircleOutlined />
                      <Text>
                        {selectedLeaveType.description || selectedLeaveType.name}
                      </Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                  style={{ marginBottom: 16 }}
                />
              )}

              {balanceForSelected && (
                <Alert
                  message={
                    <Space>
                      <CalendarOutlined />
                      <Text>
                        Available balance: <strong>{balanceForSelected.remaining}</strong> days
                        {balanceForSelected.pending > 0 && (
                          <> ({balanceForSelected.pending} days pending)</>
                        )}
                      </Text>
                    </Space>
                  }
                  type={balanceForSelected.remaining >= (form.getFieldValue('days') || 0) ? 'success' : 'warning'}
                  showIcon={false}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item label="Date Range" required>
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={handleDateChange}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="days"
                    label="Total Days"
                    rules={[{ required: true, message: 'Please enter number of days' }]}
                  >
                    <Input type="number" min={0.5} step={0.5} disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="isHalfDay"
                    label="Half Day"
                    valuePropName="checked"
                  >
                    <Switch checked={isHalfDay} onChange={handleHalfDayToggle} />
                  </Form.Item>
                </Col>
              </Row>

              {isHalfDay && (
                <Form.Item
                  name="halfDayPeriod"
                  label="Half Day Period"
                  rules={[{ required: true, message: 'Please select morning or afternoon' }]}
                >
                  <Select>
                    <Select.Option value="morning">Morning (AM)</Select.Option>
                    <Select.Option value="afternoon">Afternoon (PM)</Select.Option>
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                name="reason"
                label="Reason"
                rules={[{ required: true, message: 'Please provide a reason' }]}
              >
                <TextArea rows={4} placeholder="Please provide the reason for your leave request..." />
              </Form.Item>

              {selectedLeaveType?.requiresAttachment && (
                <Form.Item label="Attachment (Required)">
                  <Upload maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>Upload Document</Button>
                  </Upload>
                </Form.Item>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  loading={createMutation.isPending}
                  onClick={handleSubmit}
                >
                  Submit Leave Request
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Your Leave Balances">
            {balances && balances.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {balances.map((balance) => (
                  <Card size="small" key={balance.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Tag color={balance.leaveType.color || 'blue'}>{balance.leaveType.name}</Tag>
                      </Space>
                      <Title level={4} style={{ margin: 0, color: balance.remaining > 0 ? '#52c41a' : '#ff4d4f' }}>
                        {balance.remaining}
                      </Title>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Used: {balance.used} / {balance.totalAllocated}
                        </Text>
                        {balance.pending > 0 && (
                          <Tag color="orange" style={{ fontSize: 10 }}>
                            {balance.pending} pending
                          </Tag>
                        )}
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: '#f0f0f0',
                          borderRadius: 3,
                          marginTop: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min((balance.used / balance.totalAllocated) * 100, 100)}%`,
                            background: balance.remaining > 0 ? '#52c41a' : '#ff4d4f',
                            borderRadius: 3,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No leave balances available.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LeaveRequestFormPage;

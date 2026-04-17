import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Popconfirm, Modal, Descriptions, Select, Typography, message } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leaveService } from '@/services/leave';
import { PageHeader } from '@/components/common';
import { formatDate } from '@/utils/format';
import type { LeaveRequest } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'default',
};

const LeaveRequestListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests-my', statusFilter],
    queryFn: () => leaveService.getMyRequests(statusFilter ? { status: statusFilter as any } : undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancelRequest(id),
    onSuccess: () => {
      message.success('Leave request cancelled');
      queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] });
    },
    onError: () => message.error('Failed to cancel request'),
  });

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id);
  };

  const handleViewDetail = (record: LeaveRequest) => {
    setSelectedRequest(record);
    setDetailVisible(true);
  };

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Leave Type',
      dataIndex: ['leaveType', 'name'],
      key: 'leaveType',
      width: 150,
      render: (name: string, record: LeaveRequest) => (
        <Tag color={record.leaveType.color || 'blue'}>{name}</Tag>
      ),
    },
    {
      title: 'From',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => formatDate(date, 'DD MMM YYYY'),
    },
    {
      title: 'To',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => formatDate(date, 'DD MMM YYYY'),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      render: (days: number, record: LeaveRequest) => (
        <>
          {days}
          {record.isHalfDay && <Tag style={{ marginLeft: 4 }}>(Half Day)</Tag>}
        </>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Approved', value: 'APPROVED' },
        { text: 'Rejected', value: 'REJECTED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date, 'DD MMM'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: LeaveRequest) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          {record.status === 'PENDING' && (
            <Popconfirm
              title="Cancel this request?"
              onConfirm={() => handleCancel(record.id)}
              okText="Cancel"
              cancelText="Keep"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Leave Requests"
        subtitle="View and manage your leave requests"
        breadcrumbs={[{ title: 'Home' }, { title: 'Leave' }, { title: 'My Requests' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leave/apply')}>
            New Request
          </Button>
        }
      />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Typography.Text strong>Filter:</Typography.Text>
          <Select
            placeholder="All statuses"
            allowClear
            style={{ width: 160 }}
            onChange={setStatusFilter}
            options={[
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} requests`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={<><InfoCircleOutlined /> Leave Request Details</>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Leave Type">
              <Tag color={selectedRequest.leaveType.color || 'blue'}>
                {selectedRequest.leaveType.name}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Period">
              {formatDate(selectedRequest.startDate, 'DD MMM YYYY')} - {formatDate(selectedRequest.endDate, 'DD MMM YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Days">{selectedRequest.days}</Descriptions.Item>
            {selectedRequest.isHalfDay && (
              <Descriptions.Item label="Half Day">
                {selectedRequest.halfDayPeriod === 'morning' ? 'Morning' : 'Afternoon'}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Reason">{selectedRequest.reason}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[selectedRequest.status]}>{selectedRequest.status}</Tag>
            </Descriptions.Item>
            {selectedRequest.approver && (
              <Descriptions.Item label="Approver">
                {selectedRequest.approver.firstName} {selectedRequest.approver.lastName}
              </Descriptions.Item>
            )}
            {selectedRequest.approvedAt && (
              <Descriptions.Item label="Approved At">
                {formatDate(selectedRequest.approvedAt, 'DD MMM YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {selectedRequest.rejectionReason && (
              <Descriptions.Item label="Rejection Reason">
                <Typography.Text type="danger">{selectedRequest.rejectionReason}</Typography.Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Submitted">
              {formatDate(selectedRequest.createdAt, 'DD MMM YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequestListPage;

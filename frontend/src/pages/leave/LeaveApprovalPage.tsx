import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Typography, message,
  Row, Col, Descriptions, Statistic,
} from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave';
import { PageHeader } from '@/components/common';
import { formatDate } from '@/utils/format';
import type { LeaveRequest } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'default',
};

const LeaveApprovalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [detailVisible, setDetailVisible] = useState(false);

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['leave-pending-approvals'],
    queryFn: () => leaveService.getPendingApprovals(),
    refetchInterval: 30000,
  });

  const { data: allRequests, isLoading: allLoading } = useQuery({
    queryKey: ['leave-approval-list'],
    queryFn: () => leaveService.getApprovalList(),
  });

  const approvalMutation = useMutation({
    mutationFn: (data: { requestId: string; action: 'approve' | 'reject'; comment?: string }) =>
      leaveService.processApproval(data),
    onSuccess: () => {
      message.success(`Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['leave-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leave-approval-list'] });
    },
    onError: () => message.error('Failed to process approval'),
  });

  const handleAction = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!selectedRequest) return;
    form.validateFields().then((values) => {
      approvalMutation.mutate({
        requestId: selectedRequest.id,
        action: actionType,
        comment: values.comment,
      });
    });
  };

  const pendingColumns: ColumnsType<LeaveRequest> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong>{record.employee.firstName} {record.employee.lastName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee.employeeCode}</Text>
          {record.employee.department && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.employee.department.name}</Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Leave Type',
      dataIndex: ['leaveType', 'name'],
      key: 'leaveType',
      width: 120,
      render: (name: string, record) => (
        <Tag color={record.leaveType.color || 'blue'}>{name}</Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      width: 180,
      render: (_, record) => (
        <>
          {formatDate(record.startDate, 'DD MMM')} - {formatDate(record.endDate, 'DD MMM')}
          {record.isHalfDay && <Tag style={{ marginLeft: 4 }}>Half Day</Tag>}
        </>
      ),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      width: 70,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
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
      width: 160,
      render: (_, record: LeaveRequest) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedRequest(record); setDetailVisible(true); }}
          />
          <Button
            type="link"
            size="small"
            style={{ color: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => handleAction(record, 'approve')}
          >
            Approve
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleAction(record, 'reject')}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const allColumns: ColumnsType<LeaveRequest> = [
    ...pendingColumns.slice(0, -1),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record: LeaveRequest) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => { setSelectedRequest(record); setDetailVisible(true); }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Approvals"
        subtitle="Review and approve leave requests from your team"
        breadcrumbs={[{ title: 'Home' }, { title: 'Leave' }, { title: 'Approvals' }]}
      />

      {/* Pending Approvals Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={<><TeamOutlined /> Pending Approvals</>}
              value={pendingRequests?.length || 0}
              valueStyle={{ color: pendingRequests?.length ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Requests */}
      <Card
        title="Pending Approvals"
        extra={<Tag color="orange">{pendingRequests?.length || 0} pending</Tag>}
      >
        <Table
          columns={pendingColumns}
          dataSource={pendingRequests || []}
          loading={pendingLoading}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No pending leave requests' }}
        />
      </Card>

      {/* All Requests History */}
      <Card title="All Requests History" style={{ marginTop: 16 }}>
        <Table
          columns={allColumns}
          dataSource={allRequests?.data || []}
          loading={allLoading}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} requests` }}
        />
      </Card>

      {/* Action Modal */}
      <Modal
        title={
          actionType === 'approve'
            ? <><CheckOutlined /> Approve Leave Request</>
            : <><CloseOutlined /> Reject Leave Request</>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={approvalMutation.isPending}
        okText={actionType === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{ danger: actionType === 'reject' }}
      >
        {selectedRequest && (
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Employee">
              {selectedRequest.employee.firstName} {selectedRequest.employee.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Leave Type">{selectedRequest.leaveType.name}</Descriptions.Item>
            <Descriptions.Item label="Period">
              {formatDate(selectedRequest.startDate, 'DD MMM YYYY')} - {formatDate(selectedRequest.endDate, 'DD MMM YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Days">{selectedRequest.days}</Descriptions.Item>
            <Descriptions.Item label="Reason">{selectedRequest.reason}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            label={actionType === 'approve' ? 'Comment (Optional)' : 'Rejection Reason (Required)'}
            rules={actionType === 'reject' ? [{ required: true, message: 'Please provide a reason' }] : []}
          >
            <TextArea rows={3} placeholder="Add a comment..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<><EyeOutlined /> Request Details</>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Employee">
              {selectedRequest.employee.firstName} {selectedRequest.employee.lastName} ({selectedRequest.employee.employeeCode})
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {selectedRequest.employee.department?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Leave Type">
              <Tag color={selectedRequest.leaveType.color || 'blue'}>{selectedRequest.leaveType.name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Period">
              {formatDate(selectedRequest.startDate, 'DD MMM YYYY')} - {formatDate(selectedRequest.endDate, 'DD MMM YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Days">{selectedRequest.days}</Descriptions.Item>
            <Descriptions.Item label="Reason">{selectedRequest.reason}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[selectedRequest.status]}>{selectedRequest.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {formatDate(selectedRequest.createdAt, 'DD MMM YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LeaveApprovalPage;

import React from 'react';
import { Tag } from 'antd';

type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'probation'
  | 'suspended'
  | 'terminated'
  | 'resigned'
  | 'retired'
  | 'on_leave'
  | 'draft'
  | 'processing'
  | 'completed'
  | 'present'
  | 'absent'
  | 'late'
  | 'early_leave'
  | 'half_day'
  | 'remote';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  pending: { color: 'orange', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  cancelled: { color: 'default', label: 'Cancelled' },
  probation: { color: 'orange', label: 'Probation' },
  suspended: { color: 'volcano', label: 'Suspended' },
  terminated: { color: 'red', label: 'Terminated' },
  resigned: { color: 'default', label: 'Resigned' },
  retired: { color: 'purple', label: 'Retired' },
  on_leave: { color: 'gold', label: 'On Leave' },
  draft: { color: 'default', label: 'Draft' },
  processing: { color: 'processing', label: 'Processing' },
  completed: { color: 'success', label: 'Completed' },
  present: { color: 'green', label: 'Present' },
  absent: { color: 'red', label: 'Absent' },
  late: { color: 'orange', label: 'Late' },
  early_leave: { color: 'volcano', label: 'Early Leave' },
  half_day: { color: 'gold', label: 'Half Day' },
  remote: { color: 'blue', label: 'Remote' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const config = statusConfig[status.toLowerCase()] || { color: 'default', label: status };

  return (
    <Tag color={config.color}>
      {label || config.label}
    </Tag>
  );
};

import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmDialogProps {
  title: string;
  content: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  content,
  open,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  danger = false,
}) => {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined
            style={{
              color: danger ? '#ff4d4f' : '#faad14',
              marginRight: 8,
            }}
          />
          {title}
        </span>
      }
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{
        danger,
        loading: confirmLoading,
      }}
      maskClosable={!confirmLoading}
    >
      <p>{content}</p>
    </Modal>
  );
};

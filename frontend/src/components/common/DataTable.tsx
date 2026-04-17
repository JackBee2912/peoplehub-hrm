import { Table } from 'antd';
import type { TableProps } from 'antd';

interface DataTableProps<T> extends TableProps<T> {
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange?: (page: number, pageSize: number) => void;
    showSizeChanger?: boolean;
  };
}

export function DataTable<T extends object>({
  loading = false,
  pagination,
  ...tableProps
}: DataTableProps<T>) {
  const paginationConfig = pagination
    ? {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showTotal: (total: number) => `Total ${total} items`,
        showSizeChanger: pagination.showSizeChanger !== false,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: pagination.onChange,
      }
    : false;

  return (
    <Table
      loading={loading}
      pagination={paginationConfig}
      scroll={{ x: true }}
      size="middle"
      {...tableProps}
    />
  );
}

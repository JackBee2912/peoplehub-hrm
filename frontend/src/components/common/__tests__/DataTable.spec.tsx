import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

// Mock antd Table to capture props
const mockTableProps: any[] = [];

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Table: vi.fn((props: any) => {
      mockTableProps.push(props);
      return (
        <div data-testid="table" data-loading={String(props.loading)}>
          {props.pagination && typeof props.pagination === 'object' && (
            <div data-testid="pagination">
              <span data-testid="total">{props.pagination.total}</span>
              {props.pagination.showTotal && (
                <span data-testid="showTotal">{props.pagination.showTotal(props.pagination.total)}</span>
              )}
            </div>
          )}
        </div>
      );
    }),
  };
});

describe('DataTable', () => {
  const mockColumns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
  ];

  beforeEach(() => {
    mockTableProps.length = 0;
  });

  it('should render without crashing', () => {
    render(<DataTable columns={mockColumns} />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<DataTable columns={mockColumns} loading={true} />);
    expect(screen.getByTestId('table')).toHaveAttribute('data-loading', 'true');
  });

  it('should not show loading by default', () => {
    render(<DataTable columns={mockColumns} />);
    expect(screen.getByTestId('table')).toHaveAttribute('data-loading', 'false');
  });

  it('should render with pagination config', () => {
    render(
      <DataTable
        columns={mockColumns}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 50,
        }}
      />
    );

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('showTotal')).toHaveTextContent('Total 50 items');
  });

  it('should disable pagination when not provided', () => {
    render(<DataTable columns={mockColumns} />);
    expect(mockTableProps[mockTableProps.length - 1].pagination).toBe(false);
  });

  it('should pass through dataSource and columns', () => {
    const data = [
      { id: 1, name: 'John', email: 'john@example.com' },
    ];

    render(<DataTable columns={mockColumns} dataSource={data} />);
    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.dataSource).toEqual(data);
    expect(props.columns).toEqual(mockColumns);
  });

  it('should have scroll.x enabled by default', () => {
    render(<DataTable columns={mockColumns} />);
    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.scroll).toEqual({ x: true });
  });

  it('should have size="middle" by default', () => {
    render(<DataTable columns={mockColumns} />);
    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.size).toBe('middle');
  });

  it('should support custom pagination onChange', () => {
    const onChange = vi.fn();
    render(
      <DataTable
        columns={mockColumns}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 50,
          onChange,
        }}
      />
    );

    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.pagination.onChange).toBe(onChange);
  });

  it('should have showSizeChanger enabled by default', () => {
    render(
      <DataTable
        columns={mockColumns}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 50,
        }}
      />
    );

    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.pagination.showSizeChanger).toBe(true);
  });

  it('should allow disabling showSizeChanger', () => {
    render(
      <DataTable
        columns={mockColumns}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 50,
          showSizeChanger: false,
        }}
      />
    );

    const props = mockTableProps[mockTableProps.length - 1];
    expect(props.pagination.showSizeChanger).toBe(false);
  });
});

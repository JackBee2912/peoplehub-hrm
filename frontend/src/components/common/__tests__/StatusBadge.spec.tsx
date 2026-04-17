import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render with active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render with pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render with rejected status', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('should render with approved status', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should render with probation status', () => {
    render(<StatusBadge status="probation" />);
    expect(screen.getByText('Probation')).toBeInTheDocument();
  });

  it('should render with terminated status', () => {
    render(<StatusBadge status="terminated" />);
    expect(screen.getByText('Terminated')).toBeInTheDocument();
  });

  it('should render with on_leave status', () => {
    render(<StatusBadge status="on_leave" />);
    expect(screen.getByText('On Leave')).toBeInTheDocument();
  });

  it('should render with retired status', () => {
    render(<StatusBadge status="retired" />);
    expect(screen.getByText('Retired')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<StatusBadge status="active" label="Currently Active" />);
    expect(screen.getByText('Currently Active')).toBeInTheDocument();
  });

  it('should handle unknown status with default styling', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('should handle case-insensitive status matching', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render all known status types', () => {
    const statuses = [
      'active', 'inactive', 'pending', 'approved', 'rejected',
      'probation', 'suspended', 'terminated', 'resigned', 'retired',
      'on_leave', 'draft', 'processing', 'completed',
    ];

    statuses.forEach((status) => {
      const { container, unmount } = render(<StatusBadge status={status} />);
      expect(container.firstChild).toBeTruthy();
      unmount();
    });
  });
});

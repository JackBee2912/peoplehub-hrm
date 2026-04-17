import React, { useState } from 'react';
import { Button, Space, Tree, Card, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/department';
import { PageHeader } from '@/components/common';
import { DepartmentModal } from '@/components/department/DepartmentModal';
import type { Department as Dept } from '@/types';

const DepartmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Dept | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: departmentService.getTree,
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-tree'] });
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      message.success('Department deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete department');
    },
  });

  const handleCreate = () => {
    setEditingDept(null);
    setModalOpen(true);
  };

  const handleEdit = (dept: Dept) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const treeData = departments?.map((dept) => ({
    key: dept.id,
    title: (
      <Space>
        <ApartmentOutlined />
        <strong>{dept.name}</strong>
        {dept.code && <span style={{ color: '#8c8c8c' }}>({dept.code})</span>}
        {dept.employeeCount !== undefined && dept.employeeCount > 0 && (
          <span style={{ color: '#1677ff' }}>{dept.employeeCount} employees</span>
        )}
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(dept); }} />
          <Popconfirm
            title="Delete Department"
            description="Are you sure?"
            onConfirm={(e) => { e?.stopPropagation(); handleDelete(dept.id); }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      </Space>
    ),
    children: dept.children?.map((child) => ({
      key: child.id,
      title: (
        <Space>
          <ApartmentOutlined />
          <strong>{child.name}</strong>
          {child.code && <span style={{ color: '#8c8c8c' }}>({child.code})</span>}
          {child.employeeCount !== undefined && child.employeeCount > 0 && (
            <span style={{ color: '#1677ff' }}>{child.employeeCount} employees</span>
          )}
          <Space size="small">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(child); }} />
            <Popconfirm
              title="Delete Department"
              description="Are you sure?"
              onConfirm={(e) => { e?.stopPropagation(); handleDelete(child.id); }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </Space>
        </Space>
      ),
      children: child.children?.map((grandchild) => ({
        key: grandchild.id,
        title: (
          <Space>
            <ApartmentOutlined />
            <strong>{grandchild.name}</strong>
            {grandchild.code && <span style={{ color: '#8c8c8c' }}>({grandchild.code})</span>}
            <Space size="small">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(grandchild); }} />
              <Popconfirm
                title="Delete Department"
                description="Are you sure?"
                onConfirm={(e) => { e?.stopPropagation(); handleDelete(grandchild.id); }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            </Space>
          </Space>
        ),
      })),
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage your organization's department hierarchy"
        breadcrumbs={[{ title: 'Home', href: '/admin' }, { title: 'Departments' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Department
          </Button>
        }
      />

      <Card loading={isLoading}>
        <Tree
          treeData={treeData || []}
          showLine
          defaultExpandAll
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
        />
        {(!departments || departments.length === 0) && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <ApartmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <p style={{ marginTop: 16 }}>No departments yet. Create your first department.</p>
          </div>
        )}
      </Card>

      <DepartmentModal
        open={modalOpen}
        department={editingDept}
        departments={departments || []}
        onClose={() => {
          setModalOpen(false);
          setEditingDept(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingDept(null);
          queryClient.invalidateQueries({ queryKey: ['departments-tree'] });
          queryClient.invalidateQueries({ queryKey: ['departments-list'] });
        }}
      />
    </div>
  );
};

export default DepartmentPage;

import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { departmentService } from '@/services/department';
import type { Department, CreateDepartmentInput } from '@/types';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  budget: z.string().optional(),
  costCenter: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentModalProps {
  open: boolean;
  department: Department | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  open,
  department,
  departments,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!department;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      parentId: '',
      managerId: '',
      budget: '',
      costCenter: '',
    },
  });

  React.useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        code: department.code || '',
        description: department.description || '',
        parentId: department.parentId || '',
        managerId: department.managerId || '',
        budget: department.budget ? String(department.budget) : '',
        costCenter: department.costCenter || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        parentId: '',
        managerId: '',
        budget: '',
        costCenter: '',
      });
    }
  }, [department, reset, open]);

  const createMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => {
      message.success('Department created successfully');
      onSuccess();
    },
    onError: () => {
      message.error('Failed to create department');
    },
  });

  const updateMutation = useMutation({
    mutationFn: departmentService.update,
    onSuccess: () => {
      message.success('Department updated successfully');
      onSuccess();
    },
    onError: () => {
      message.error('Failed to update department');
    },
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    const payload = {
      ...data,
      budget: data.budget ? parseFloat(data.budget) : undefined,
    };

    if (isEditing && department) {
      await updateMutation.mutateAsync({
        id: department.id,
        ...payload,
        parentId: data.parentId || undefined,
      });
    } else {
      await createMutation.mutateAsync(payload as CreateDepartmentInput);
    }
  };

  // Filter out current department and its children from parent options
  const getParentOptions = (): { label: string; value: string }[] => {
    const options: { label: string; value: string }[] = [];

    const buildOptions = (depts: Department[], prefix = '') => {
      for (const dept of depts) {
        if (department && dept.id === department.id) continue;
        options.push({ label: `${prefix}${dept.name}`, value: dept.id });
        if (dept.children) {
          buildOptions(dept.children, `${prefix}  `);
        }
      }
    };

    buildOptions(departments);
    return options;
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? 'Edit Department' : 'Add New Department'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={600}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Department Name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Engineering" />} />
        </Form.Item>

        <Form.Item label="Code">
          <Controller name="code" control={control} render={({ field }) => <Input {...field} placeholder="e.g., ENG" />} />
        </Form.Item>

        <Form.Item label="Description">
          <Controller name="description" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
        </Form.Item>

        <Form.Item label="Parent Department">
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <Select
                allowClear
                placeholder="Select parent department"
                options={getParentOptions()}
                {...field}
                value={field.value || undefined}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Budget">
          <Controller name="budget" control={control} render={({ field }) => <Input {...field} type="number" placeholder="0.00" />} />
        </Form.Item>

        <Form.Item label="Cost Center">
          <Controller name="costCenter" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

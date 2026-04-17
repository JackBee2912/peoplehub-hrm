import React from 'react';
import { Modal, Form, Input, Select, Row, Col, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee';
import { departmentService } from '@/services/department';
import { positionService } from '@/services/position';
import type { Employee, CreateEmployeeInput, Department, Position } from '@/types';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(['PROBATION', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED', 'ON_LEAVE']).optional(),
  contractType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']).optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  hireDate: z.string().optional(),
  probationEndDate: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  open,
  employee,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!employee;

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: departmentService.getList,
  });

  const { data: positions } = useQuery({
    queryKey: ['positions-list'],
    queryFn: positionService.getList,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      nationality: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      status: 'ACTIVE',
      contractType: 'FULL_TIME',
      departmentId: '',
      positionId: '',
      managerId: '',
      hireDate: '',
      probationEndDate: '',
      bankName: '',
      bankAccount: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
  });

  React.useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
        gender: employee.gender || '',
        maritalStatus: employee.maritalStatus || '',
        nationality: employee.nationality || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        country: employee.country || '',
        postalCode: employee.postalCode || '',
        status: employee.status,
        contractType: employee.contractType || 'FULL_TIME',
        departmentId: employee.departmentId || '',
        positionId: employee.positionId || '',
        managerId: employee.managerId || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        probationEndDate: employee.probationEndDate ? new Date(employee.probationEndDate).toISOString().split('T')[0] : '',
        bankName: employee.bankName || '',
        bankAccount: employee.bankAccount || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        nationality: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        status: 'ACTIVE',
        contractType: 'FULL_TIME',
        departmentId: '',
        positionId: '',
        managerId: '',
        hireDate: '',
        probationEndDate: '',
        bankName: '',
        bankAccount: '',
        emergencyContact: '',
        emergencyPhone: '',
      });
    }
  }, [employee, reset, open]);

  const createMutation = useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => {
      message.success('Employee created successfully');
      onSuccess();
    },
    onError: () => {
      message.error('Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: employeeService.update,
    onSuccess: () => {
      message.success('Employee updated successfully');
      onSuccess();
    },
    onError: () => {
      message.error('Failed to update employee');
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    if (isEditing && employee) {
      await updateMutation.mutateAsync({ id: employee.id, ...data });
    } else {
      await createMutation.mutateAsync(data as CreateEmployeeInput);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? 'Edit Employee' : 'Add New Employee'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={800}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              validateStatus={errors.firstName ? 'error' : ''}
              help={errors.firstName?.message}
            >
              <Controller name="firstName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last Name"
              validateStatus={errors.lastName ? 'error' : ''}
              help={errors.lastName?.message}
            >
              <Controller name="lastName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller name="email" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Phone">
              <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Department">
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select allowClear placeholder="Select department" options={departments?.map((d: Department) => ({ label: d.name, value: d.id }))} {...field} value={field.value || undefined} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Position">
              <Controller
                name="positionId"
                control={control}
                render={({ field }) => (
                  <Select allowClear placeholder="Select position" options={positions?.map((p: Position) => ({ label: p.title, value: p.id }))} {...field} value={field.value || undefined} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { label: 'Active', value: 'ACTIVE' },
                      { label: 'Probation', value: 'PROBATION' },
                      { label: 'On Leave', value: 'ON_LEAVE' },
                      { label: 'Suspended', value: 'SUSPENDED' },
                      { label: 'Terminated', value: 'TERMINATED' },
                      { label: 'Resigned', value: 'RESIGNED' },
                    ]}
                    {...field}
                    value={field.value || undefined}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Hire Date">
              <Controller name="hireDate" control={control} render={({ field }) => <Input type="date" {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Contract Type">
              <Controller
                name="contractType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { label: 'Full Time', value: 'FULL_TIME' },
                      { label: 'Part Time', value: 'PART_TIME' },
                      { label: 'Contract', value: 'CONTRACT' },
                      { label: 'Intern', value: 'INTERN' },
                      { label: 'Freelance', value: 'FREELANCE' },
                    ]}
                    {...field}
                    value={field.value || undefined}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Address">
              <Controller name="address" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="City">
              <Controller name="city" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Date of Birth">
              <Controller name="dateOfBirth" control={control} render={({ field }) => <Input type="date" {...field} />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Gender">
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select allowClear options={[{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }]} {...field} value={field.value || undefined} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Emergency Contact">
              <Controller name="emergencyContact" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

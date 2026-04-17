import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  InputNumber,
  Switch,
  Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { taxService } from '@/services/tax';
import type { TaxRule, CreateTaxRuleInput, TaxBracket, TaxDeduction } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TaxRulePage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [brackets, setBrackets] = useState<TaxBracket[]>([
    { min: 0, max: null, rate: 0 },
  ]);
  const [deductions, setDeductions] = useState<TaxDeduction[]>([]);
  const [form] = Form.useForm<CreateTaxRuleInput>();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['tax-rules'],
    queryFn: taxService.getTaxRules,
  });

  const createMutation = useMutation({
    mutationFn: taxService.createTaxRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      message.success('Tax rule created');
      setModalOpen(false);
      form.resetFields();
      setBrackets([{ min: 0, max: null, rate: 0 }]);
      setDeductions([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: taxService.updateTaxRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      message.success('Tax rule updated');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setBrackets([{ min: 0, max: null, rate: 0 }]);
      setDeductions([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taxService.deleteTaxRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      message.success('Tax rule deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      taxService.toggleTaxRule(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      message.success('Tax rule status updated');
    },
  });

  const handleSubmit = async (values: CreateTaxRuleInput) => {
    const payload = {
      ...values,
      brackets,
      deductions,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setBrackets([{ min: 0, max: null, rate: 0 }]);
    setDeductions([]);
    setModalOpen(true);
  };

  const openEdit = (record: TaxRule) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      country: record.country,
      region: record.region,
      socialInsuranceRate: record.socialInsuranceRate,
      healthInsuranceRate: record.healthInsuranceRate,
      unemploymentInsuranceRate: record.unemploymentInsuranceRate,
      effectiveFrom: dayjs(record.effectiveFrom).format('YYYY-MM-DD'),
      effectiveTo: record.effectiveTo ? dayjs(record.effectiveTo).format('YYYY-MM-DD') : undefined,
    });
    setBrackets(record.brackets);
    setDeductions(record.deductions || []);
    setModalOpen(true);
  };

  const addBracket = () => {
    const lastMax = brackets[brackets.length - 1]?.max ?? 0;
    setBrackets([...brackets, { min: lastMax ?? 0, max: null, rate: 0 }]);
  };

  const updateBracket = (index: number, field: keyof TaxBracket, value: number | null) => {
    const updated = [...brackets];
    updated[index] = { ...updated[index], [field]: value };
    setBrackets(updated);
  };

  const removeBracket = (index: number) => {
    if (brackets.length > 1) {
      setBrackets(brackets.filter((_, i) => i !== index));
    }
  };

  const addDeduction = () => {
    setDeductions([...deductions, { name: '', amount: 0 }]);
  };

  const updateDeduction = (index: number, field: keyof TaxDeduction, value: string | number) => {
    const updated = [...deductions];
    updated[index] = { ...updated[index], [field]: value };
    setDeductions(updated);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const bracketColumns = [
    {
      title: 'Min',
      key: 'min',
      render: (_: unknown, _r: unknown, index: number) => (
        <InputNumber
          value={brackets[index]?.min}
          onChange={(v) => updateBracket(index, 'min', v ?? 0)}
          style={{ width: '100%' }}
          prefix="$"
        />
      ),
    },
    {
      title: 'Max',
      key: 'max',
      render: (_: unknown, _r: unknown, index: number) => (
        <InputNumber
          value={brackets[index]?.max}
          onChange={(v) => updateBracket(index, 'max', v)}
          style={{ width: '100%' }}
          prefix="$"
          addonAfter={index === brackets.length - 1 ? '+' : undefined}
        />
      ),
    },
    {
      title: 'Rate (%)',
      key: 'rate',
      render: (_: unknown, _r: unknown, index: number) => (
        <InputNumber
          value={(brackets[index]?.rate ?? 0) * 100}
          onChange={(v) => updateBracket(index, 'rate', (v ?? 0) / 100)}
          style={{ width: '100%' }}
          min={0}
          max={100}
          step={0.5}
          addonAfter="%"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, _r: unknown, index: number) =>
        brackets.length > 1 ? (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => removeBracket(index)}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  const deductionColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, _d: unknown, index: number) => (
        <Input
          value={deductions[index]?.name}
          onChange={(e) => updateDeduction(index, 'name', e.target.value)}
          placeholder="e.g. Dependent deduction"
        />
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, _r: unknown, index: number) => (
        <InputNumber
          value={deductions[index]?.amount}
          onChange={(v) => updateDeduction(index, 'amount', v ?? 0)}
          style={{ width: '100%' }}
          prefix="$"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, _r: unknown, index: number) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => removeDeduction(index)}
        >
          Remove
        </Button>
      ),
    },
  ];

  const tableColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Country', dataIndex: 'country', key: 'country', width: 100 },
    {
      title: 'Brackets',
      dataIndex: 'brackets',
      key: 'brackets',
      width: 200,
      render: (brackets: TaxBracket[]) => (
        <span>
          {brackets.map((b, i) => (
            <Tag key={i}>
              {b.min.toLocaleString()} - {b.max ? b.max.toLocaleString() : '+'}: {(b.rate * 100).toFixed(1)}%
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: 'SI Rate',
      key: 'si',
      width: 100,
      render: (_: unknown, record: TaxRule) => `${(record.socialInsuranceRate * 100).toFixed(1)}%`,
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      width: 140,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (val: boolean, record: TaxRule) => (
        <Switch
          checked={val}
          size="small"
          onChange={(checked) =>
            toggleMutation.mutate({ id: record.id, isActive: checked })
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: TaxRule) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this tax rule?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Tax Rule Configuration
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Tax Rule
        </Button>
      </div>

      <Table
        columns={tableColumns}
        dataSource={rules}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
      />

      <Modal
        title={editing ? 'Edit Tax Rule' : 'Add Tax Rule'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Vietnam Personal Income Tax 2026" />
          </Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true }]}>
            <Input placeholder="e.g. VN" />
          </Form.Item>
          <Form.Item name="region" label="Region (optional)">
            <Input placeholder="e.g. Ho Chi Minh City" />
          </Form.Item>

          <Divider orientation="left">Tax Brackets</Divider>
          <Table
            columns={bracketColumns}
            dataSource={brackets}
            rowKey={(r, i) => `bracket-${i}`}
            size="small"
            pagination={false}
            footer={() => (
              <Button type="dashed" size="small" onClick={addBracket}>
                + Add Bracket
              </Button>
            )}
          />

          <Divider orientation="left">Deductions</Divider>
          <Table
            columns={deductionColumns}
            dataSource={deductions}
            rowKey={(r, i) => `deduction-${i}`}
            size="small"
            pagination={false}
            footer={() => (
              <Button type="dashed" size="small" onClick={addDeduction}>
                + Add Deduction
              </Button>
            )}
          />

          <Divider orientation="left">Insurance Rates</Divider>
          <Form.Item label="Social Insurance Rate">
            <Form.Item name="socialInsuranceRate" noStyle initialValue={0.08}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1}
                step={0.005}
                addonAfter="%"
              />
            </Form.Item>
          </Form.Item>
          <Form.Item label="Health Insurance Rate">
            <Form.Item name="healthInsuranceRate" noStyle initialValue={0.015}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1}
                step={0.005}
                addonAfter="%"
              />
            </Form.Item>
          </Form.Item>
          <Form.Item label="Unemployment Insurance Rate">
            <Form.Item name="unemploymentInsuranceRate" noStyle initialValue={0.01}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1}
                step={0.005}
                addonAfter="%"
              />
            </Form.Item>
          </Form.Item>

          <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="effectiveTo" label="Effective To (optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaxRulePage;

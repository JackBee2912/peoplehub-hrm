import { Typography, Breadcrumb, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  onBack,
  extra,
  children,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: 8 }}>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index} {...(item.href ? { href: item.href } : {})}>
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
          )}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                {subtitle}
              </Typography.Text>
            )}
          </div>
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
      {children}
    </div>
  );
};

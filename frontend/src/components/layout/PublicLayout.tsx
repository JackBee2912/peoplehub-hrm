import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Text } = Typography;

export const PublicLayout: React.FC = () => {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
              PeopleHub
            </Typography.Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              All-in-one HRM Platform
            </Text>
          </div>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

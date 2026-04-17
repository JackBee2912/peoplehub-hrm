import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { themeConfig } from '@/config/theme';
import { queryClient } from '@/config/queryClient';
import { AdminLayout, PublicLayout } from '@/components/layout';
import { RequireAuth } from '@/components/layout/RequireAuth';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import EmployeeDashboard from '@/pages/dashboard/EmployeeDashboard';
import EmployeeListPage from '@/pages/employee/EmployeeListPage';
import EmployeeDetailPage from '@/pages/employee/EmployeeDetailPage';
import DepartmentPage from '@/pages/department/DepartmentPage';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig}>
        <AntdApp>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Protected admin routes */}
              <Route
                path="/admin"
                element={
                  <RequireAuth allowedRoles={['ADMIN', 'HR_MANAGER']}>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="employees" element={<EmployeeListPage />} />
                <Route path="employees/:id" element={<EmployeeDetailPage />} />
                <Route path="departments" element={<DepartmentPage />} />
              </Route>

              {/* Protected employee routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<EmployeeDashboard />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;

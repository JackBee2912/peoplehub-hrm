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

// Sprint 2: Attendance
import CheckInOutPage from '@/pages/attendance/CheckInOutPage';
import AttendanceCalendarPage from '@/pages/attendance/AttendanceCalendarPage';
import AttendanceHistoryPage from '@/pages/attendance/AttendanceHistoryPage';

// Sprint 2: Shifts
import ShiftManagementPage from '@/pages/shifts/ShiftManagementPage';

// Sprint 2: Leave
import LeaveRequestFormPage from '@/pages/leave/LeaveRequestFormPage';
import LeaveRequestListPage from '@/pages/leave/LeaveRequestListPage';
import LeaveBalanceDashboard from '@/pages/leave/LeaveBalanceDashboard';
import LeaveApprovalPage from '@/pages/leave/LeaveApprovalPage';

// Sprint 2: Holidays
import HolidayCalendarPage from '@/pages/holidays/HolidayCalendarPage';

// Sprint 2: Reports
import AttendanceReportsPage from '@/pages/reports/AttendanceReportsPage';

// Sprint 2: Manager
import ManagerDashboardPage from '@/pages/manager/ManagerDashboardPage';

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
                <Route path="shifts" element={<ShiftManagementPage />} />
                <Route path="holidays" element={<HolidayCalendarPage />} />
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

              {/* Sprint 2: Attendance routes */}
              <Route
                path="/attendance"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route path="checkin" element={<CheckInOutPage />} />
                <Route path="calendar" element={<AttendanceCalendarPage />} />
                <Route path="history" element={<AttendanceHistoryPage />} />
              </Route>

              {/* Sprint 2: Leave routes */}
              <Route
                path="/leave"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route path="apply" element={<LeaveRequestFormPage />} />
                <Route path="my-requests" element={<LeaveRequestListPage />} />
                <Route path="balance" element={<LeaveBalanceDashboard />} />
                <Route
                  path="approvals"
                  element={
                    <RequireAuth allowedRoles={['ADMIN', 'HR_MANAGER', 'MANAGER']}>
                      <LeaveApprovalPage />
                    </RequireAuth>
                  }
                />
              </Route>

              {/* Sprint 2: Reports routes */}
              <Route
                path="/reports"
                element={
                  <RequireAuth allowedRoles={['ADMIN', 'HR_MANAGER']}>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route path="attendance" element={<AttendanceReportsPage />} />
              </Route>

              {/* Sprint 2: Manager routes */}
              <Route
                path="/manager"
                element={
                  <RequireAuth allowedRoles={['ADMIN', 'HR_MANAGER', 'MANAGER']}>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<ManagerDashboardPage />} />
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

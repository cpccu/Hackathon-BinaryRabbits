import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

import LoginPage from '@/features/auth/LoginPage';
import SignupPage from '@/features/auth/SignupPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';

import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EventsPage } from '@/features/events/EventsPage';
import { EventDetailPage } from '@/features/events/EventDetailPage';
import { EventCheckInPage } from '@/features/events/EventCheckInPage';
import { ResourcesPage } from '@/features/resources/ResourcesPage';
import { ResourceUploadPage } from '@/features/resources/ResourceUploadPage';
import { CoursePage } from '@/features/resources/CoursePage';
import { HelpdeskPage } from '@/features/helpdesk/HelpdeskPage';
import { LostFoundPage } from '@/features/lost-found/LostFoundPage';
import { ReportItemPage } from '@/features/lost-found/ReportItemPage';
import { ItemDetailPage } from '@/features/lost-found/ItemDetailPage';
import { ComplaintsPage } from '@/features/complaints/ComplaintsPage';
import { NewComplaintPage } from '@/features/complaints/NewComplaintPage';
import { ComplaintDetailPage } from '@/features/complaints/ComplaintDetailPage';
import { MyCampusPage } from '@/features/my-campus/MyCampusPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ManageEventsPage } from '@/features/admin/ManageEventsPage';
import { NoticeManagementPage } from '@/features/admin/NoticeManagementPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/events', element: <EventsPage /> },
      { path: '/events/:eventId', element: <EventDetailPage /> },
      { path: '/events/:eventId/check-in', element: <EventCheckInPage /> },
      { path: '/resources', element: <ResourcesPage /> },
      { path: '/resources/upload', element: <ResourceUploadPage /> },
      { path: '/resources/:courseId', element: <CoursePage /> },
      { path: '/helpdesk', element: <HelpdeskPage /> },
      { path: '/lost-found', element: <LostFoundPage /> },
      { path: '/lost-found/report', element: <ReportItemPage /> },
      { path: '/lost-found/:itemId', element: <ItemDetailPage /> },
      { path: '/complaints', element: <ComplaintsPage /> },
      { path: '/complaints/new', element: <NewComplaintPage /> },
      { path: '/complaints/:complaintId', element: <ComplaintDetailPage /> },
      { path: '/my-campus', element: <MyCampusPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/admin/events', element: <ManageEventsPage /> },
      { path: '/admin/notices', element: <NoticeManagementPage /> },
    ]
  }
]);

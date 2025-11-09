import { AdminLayout } from '@/features/admin/components';
import { AdminDashboard } from './components/AdminDashboard';

/**
 * Admin Dashboard feature
 * Main dashboard for admin users
 */
export const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
};

export default AdminDashboardPage;


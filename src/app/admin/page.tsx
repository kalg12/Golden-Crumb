import { AdminDashboard, OrderData, CustomerData, RouteStop } from './AdminDashboard';
import { getDashboardData, getTodayDeliveries } from '@/app/actions/dbActions';
import { getCurrentSession } from '@/app/actions/authActions';
import { getEmailSettingsAction } from '@/app/actions/emailActions';
import { getSiteSettings } from '@/lib/siteSettings';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function AdminPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getCurrentSession();
  const resolvedSearchParams = await props.searchParams;
  const initialTab = resolvedSearchParams.tab || '';
  
  const dashboardResult = await getDashboardData();
  const deliveryResult = await getTodayDeliveries();
  const emailSettingsResult = await getEmailSettingsAction();
  const initialSiteSettings = await getSiteSettings();

  const initialStats = (dashboardResult.success && dashboardResult.stats)
    ? dashboardResult.stats
    : { totalRevenue: 0, activeOrders: 0, totalOrders: 0, totalCustomers: 0 };

  const initialOrders = dashboardResult.success ? dashboardResult.orders : [];
  const initialCustomers = dashboardResult.success ? dashboardResult.customers : [];
  const salesHistory = (dashboardResult.success && dashboardResult.salesHistory) ? dashboardResult.salesHistory : [];

  const initialRoute = deliveryResult.success ? deliveryResult.route : [];
  const bakeryCoords = (deliveryResult.success && deliveryResult.bakeryCoords)
    ? deliveryResult.bakeryCoords
    : { lat: 37.7749, lng: -122.4194 };

  const initialEmailSettings = emailSettingsResult.success ? emailSettingsResult.settings : null;

  // Fetch staff users if the logged-in user is admin
  let initialStaffUsers: { _id: string; name: string; email: string; role: 'admin' | 'kitchen' | 'courier'; createdAt: string }[] = [];
  if (session.isLoggedIn && session.role === 'admin') {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    initialStaffUsers = users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role as 'admin' | 'kitchen' | 'courier',
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
    }));
  }

  const currentUser = {
    name: session.name || 'Bakery Staff',
    email: session.email || '',
    role: (session.role || 'kitchen') as 'admin' | 'kitchen' | 'courier',
  };

  return (
    <main className="min-h-screen bg-[#F0E0D0] dark:bg-[#3A1D10] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard
          initialStats={initialStats}
          initialOrders={initialOrders as OrderData[]}
          initialCustomers={initialCustomers as CustomerData[]}
          salesHistory={salesHistory}
          initialRoute={initialRoute as RouteStop[]}
          bakeryCoords={bakeryCoords}
          currentUser={currentUser}
          initialStaffUsers={initialStaffUsers}
          initialEmailSettings={initialEmailSettings}
          initialSiteSettings={initialSiteSettings}
          initialTab={initialTab}
        />
      </div>
    </main>
  );
}

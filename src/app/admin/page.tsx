import { AdminDashboard, OrderData, CustomerData, RouteStop } from './AdminDashboard';
import { getDashboardData, getTodayDeliveries } from '@/app/actions/dbActions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const dashboardResult = await getDashboardData();
  const deliveryResult = await getTodayDeliveries();

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

  return (
    <main className="min-h-screen bg-[#F0E0D0] dark:bg-[#482612] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard
          initialStats={initialStats}
          initialOrders={initialOrders as OrderData[]}
          initialCustomers={initialCustomers as CustomerData[]}
          salesHistory={salesHistory}
          initialRoute={initialRoute as RouteStop[]}
          bakeryCoords={bakeryCoords}
        />
      </div>
    </main>
  );
}

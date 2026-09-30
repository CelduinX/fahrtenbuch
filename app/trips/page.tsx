import { AppHeader } from "@/components/AppHeader";
import { DashboardClient } from "@/components/DashboardClient";
import { requirePageUser } from "@/lib/auth";
import { currentDate, currentMonth, validMonthOrCurrent } from "@/lib/dates";
import { getActiveRoutePairs, toRouteOptions } from "@/lib/repositories/routes";
import { getTripColumnSettings } from "@/lib/repositories/settings";
import { getTripsForMonth } from "@/lib/repositories/trips";

export const dynamic = "force-dynamic";

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [, params] = await Promise.all([requirePageUser(), searchParams]);
  const todayDate = currentDate();
  const todayMonth = currentMonth();
  const month = validMonthOrCurrent(params.month);
  const [pairs, monthData, columnSettings] = await Promise.all([
    getActiveRoutePairs(),
    getTripsForMonth(month),
    getTripColumnSettings(),
  ]);

  return (
    <>
      <AppHeader />
      <main className="app-frame app-content page-enter py-5 lg:py-6">
        <DashboardClient initialVisibleColumns={columnSettings.visibleColumns} initialMonth={month} todayMonth={todayMonth} todayDate={todayDate} initialData={monthData} routeOptions={toRouteOptions(pairs)} />
      </main>
    </>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Banknote, Boxes, PackageCheck, Store, Users } from "lucide-react";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const summary = useQuery(trpc.admin.summary.queryOptions());
  const data = summary.data;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight">EcoExchange overview</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A simplified dashboard for marketplace activity, orders, and collected EcoExchange fees.
          </p>
        </div>
        <div className="border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Fees shown are the 3% EcoExchange site upkeep fees recorded on orders.
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Banknote className="size-5" />}
          label="EcoExchange fees collected"
          value={`PHP ${formatMoney(data?.totals.platformFees ?? 0)}`}
          detail="3% site upkeep fees"
        />
        <MetricCard
          icon={<PackageCheck className="size-5" />}
          label="Gross order total"
          value={`PHP ${formatMoney(data?.totals.grossSales ?? 0)}`}
          detail={`${data?.totals.orders ?? 0} total orders`}
        />
        <MetricCard
          icon={<Store className="size-5" />}
          label="Small businesses"
          value={String(data?.totals.businesses ?? 0)}
          detail={`${data?.totals.products ?? 0} products listed`}
        />
        <MetricCard
          icon={<Users className="size-5" />}
          label="Users"
          value={String(data?.totals.users ?? 0)}
          detail={`${data?.totals.activeOrders ?? 0} active orders`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-emerald-900/10 lg:col-span-2">
          <CardHeader>
            <CardTitle>Financial summary</CardTitle>
            <CardDescription>Simple marketplace totals from orders.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryRow label="Product subtotal" value={data?.totals.subtotal ?? 0} />
            <SummaryRow label="EcoExchange fees collected" value={data?.totals.platformFees ?? 0} />
            <SummaryRow label="Delivery fees quoted" value={data?.totals.deliveryFees ?? 0} />
            <SummaryRow label="Gross order total" value={data?.totals.grossSales ?? 0} strong />
          </CardContent>
        </Card>

        <Card className="border-emerald-900/10">
          <CardHeader>
            <CardTitle>Inventory watch</CardTitle>
            <CardDescription>Products that may need seller attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 border bg-muted/30 p-4">
              <Boxes className="size-5 text-emerald-700" />
              <div>
                <p className="text-2xl font-semibold">{data?.totals.lowStockProducts ?? 0}</p>
                <p className="text-sm text-muted-foreground">products with 5 or fewer in stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="Order status" values={data?.orderStatuses ?? {}} />
        <BreakdownCard title="Delivery status" values={data?.deliveryStatuses ?? {}} />
      </section>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest marketplace orders and fee contribution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden border">
            <div className="hidden grid-cols-[1fr_140px_160px_130px_130px] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
              <span>Order</span>
              <span>Status</span>
              <span>Delivery</span>
              <span className="text-right">Total</span>
              <span className="text-right">Site fee</span>
            </div>
            {(data?.recentOrders ?? []).map((order) => (
              <div
                key={order.id}
                className="grid gap-2 border-b px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_140px_160px_130px_130px] md:items-center"
              >
                <div>
                  <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                  <p className="text-muted-foreground">{order.deliveryName}</p>
                </div>
                <span>{formatStatus(order.status)}</span>
                <span>{formatStatus(order.deliveryStatus)}</span>
                <span className="md:text-right">PHP {formatMoney(order.total)}</span>
                <span className="font-medium text-emerald-700 md:text-right">
                  PHP {formatMoney(order.platformFee)}
                </span>
              </div>
            ))}
            {data?.recentOrders.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-emerald-900/10">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between border p-3 text-sm ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>PHP {formatMoney(value)}</span>
    </div>
  );
}

function BreakdownCard({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values);

  return (
    <Card className="border-emerald-900/10">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Current distribution across orders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([status, count]) => (
          <div key={status} className="flex justify-between border bg-muted/20 px-3 py-2 text-sm">
            <span>{formatStatus(status)}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
        {entries.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : null}
      </CardContent>
    </Card>
  );
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

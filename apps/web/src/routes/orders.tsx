import { Button } from "@ecoExchange/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/orders")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useQuery(trpc.orders.list.queryOptions());
  const acceptDeliveryFee = useMutation({
    mutationFn: (orderId: string) => trpcClient.orders.acceptDeliveryFee.mutate({ orderId }),
    onSuccess: () => {
      toast.success("Delivery fee accepted. The seller can now book the rider.");
      orders.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const rejectDeliveryFee = useMutation({
    mutationFn: (orderId: string) => trpcClient.orders.rejectDeliveryFee.mutate({ orderId }),
    onSuccess: () => {
      toast.success("Delivery fee rejected. The seller can send a new quote.");
      orders.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm font-medium text-emerald-700">Account</p>
        <h1 className="text-4xl font-semibold tracking-tight">My orders</h1>
      </div>

      {(orders.data ?? []).map((order) => (
        <Card key={order.id} className="border-emerald-900/10">
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PackageCheck className="size-5 text-emerald-700" />
                  Order {order.id.slice(0, 8)}
                </CardTitle>
                <CardDescription>
                  {order.status.replaceAll("_", " ")} - {new Date(order.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <p className="text-lg font-semibold">PHP {order.total.toFixed(2)}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.deliveryStatus === "fee_proposed" ? (
              <div className="space-y-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-2">
                  <Truck className="mt-0.5 size-4" />
                  <div>
                    <p className="font-medium">Delivery fee approval needed</p>
                    <p>
                      Seller proposes {order.deliveryProvider ?? "manual delivery"} for PHP{" "}
                      {(order.deliveryFeeCents / 100).toFixed(2)}.
                    </p>
                    {order.deliveryFeeNote ? <p className="mt-1">{order.deliveryFeeNote}</p> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800"
                    disabled={acceptDeliveryFee.isPending}
                    onClick={() => acceptDeliveryFee.mutate(order.id)}
                  >
                    Accept delivery fee
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rejectDeliveryFee.isPending}
                    onClick={() => rejectDeliveryFee.mutate(order.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}

            {order.deliveryStatus === "fee_rejected" ? (
              <div className="border bg-muted/30 p-3 text-sm text-muted-foreground">
                You rejected the delivery fee. The seller may send a new quote.
              </div>
            ) : null}

            {order.deliveryStatus === "fee_accepted" ? (
              <div className="border bg-emerald-50 p-3 text-sm text-emerald-950">
                Delivery fee accepted. The seller will book Lalamove, Maxim, or another rider.
              </div>
            ) : null}

            {order.deliveryStatus === "booked" || order.deliveryStatus === "delivered" ? (
              <div className="space-y-1 border bg-emerald-50 p-3 text-sm text-emerald-950">
                <p className="font-medium">Rider details</p>
                <p>Name: {order.riderName ?? "Not provided"}</p>
                <p>Phone: {order.riderPhone ?? "Not provided"}</p>
                {order.riderTrackingRef ? <p>Reference: {order.riderTrackingRef}</p> : null}
              </div>
            ) : null}

            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2 text-sm">
                <span>
                  {item.productName} x {item.quantity}
                </span>
                <span>PHP {((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="space-y-1 border-b pb-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>PHP {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>EcoExchange fee for site upkeep (3%)</span>
                <span>PHP {order.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Delivery fee</span>
                <span>PHP {order.deliveryFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Deliver to {order.deliveryName}, {order.deliveryAddress}
            </div>
          </CardContent>
        </Card>
      ))}

      {orders.data?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You do not have any orders yet.
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

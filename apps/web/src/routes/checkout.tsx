import { Button } from "@ecoExchange/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ecoExchange/ui/components/card";
import { Input } from "@ecoExchange/ui/components/input";
import { Label } from "@ecoExchange/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useQuery(trpc.cart.get.queryOptions());
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const checkout = useMutation({
    mutationFn: () =>
      trpcClient.orders.checkout.mutate({
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        notes,
      }),
    onSuccess: () => {
      toast.success("Order placed");
      navigate({ to: "/orders" });
    },
    onError: (error) => toast.error(error.message),
  });

  const items = cart.data?.items ?? [];
  const canSubmit =
    items.length > 0 &&
    deliveryName.trim().length >= 2 &&
    deliveryPhone.trim().length >= 7 &&
    deliveryAddress.trim().length >= 10;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-emerald-700">Checkout</p>
          <h1 className="text-4xl font-semibold tracking-tight">Reliable door to door delivery</h1>
        </div>
        <Card className="border-emerald-900/10">
          <CardHeader>
            <CardTitle>Delivery information</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                checkout.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="deliveryName">Full name</Label>
                <Input
                  id="deliveryName"
                  value={deliveryName}
                  onChange={(event) => setDeliveryName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryPhone">Phone number</Label>
                <Input
                  id="deliveryPhone"
                  value={deliveryPhone}
                  onChange={(event) => setDeliveryPhone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes for seller or rider</Label>
                <Input id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                disabled={!canSubmit || checkout.isPending}
              >
                {checkout.isPending ? "Placing order..." : "Place order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="h-fit border-emerald-900/10">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b pb-3 text-sm">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <p>PHP {(item.lineTotalCents / 100).toFixed(2)}</p>
            </div>
          ))}
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Your cart is empty.</p> : null}
          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>PHP {(cart.data?.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>EcoExchange fee for site upkeep (3%)</span>
              <span>PHP {(cart.data?.platformFee ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between pt-2 text-lg font-semibold">
            <span>Total</span>
            <span>PHP {(cart.data?.total ?? 0).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

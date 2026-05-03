import { Button } from "@ecoExchange/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ecoExchange/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/cart")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: CartPage,
});

function CartPage() {
  const cart = useQuery(trpc.cart.get.queryOptions());
  const updateCart = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      trpcClient.cart.update.mutate({ cartItemId, quantity }),
    onSuccess: () => cart.refetch(),
    onError: (error) => toast.error(error.message),
  });
  const removeItem = useMutation({
    mutationFn: (cartItemId: string) => trpcClient.cart.remove.mutate({ cartItemId }),
    onSuccess: () => cart.refetch(),
    onError: (error) => toast.error(error.message),
  });

  const items = cart.data?.items ?? [];

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-emerald-700">Cart</p>
          <h1 className="text-4xl font-semibold tracking-tight">Your EcoExchange cart</h1>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 p-8 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link to="/products">
                <Button>Browse products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-emerald-900/10">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[140px_1fr_auto] sm:items-center">
                <img
                  className="h-32 w-full object-cover sm:h-28"
                  src={item.product.imageUrl}
                  alt={item.product.name}
                />
                <div className="space-y-1">
                  <p className="text-sm text-emerald-700">{item.product.category}</p>
                  <h2 className="text-lg font-medium">{item.product.name}</h2>
                  <p className="text-sm text-muted-foreground">{item.product.ecoBadge}</p>
                  <p className="font-semibold">PHP {item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={item.quantity <= 1 || updateCart.isPending}
                    onClick={() =>
                      updateCart.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                    }
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={item.quantity >= item.product.stock || updateCart.isPending}
                    onClick={() =>
                      updateCart.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })
                    }
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Card className="h-fit border-emerald-900/10">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>PHP {(cart.data?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span>EcoExchange fee for site upkeep (3%)</span>
            <span>PHP {(cart.data?.platformFee ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <span>Calculated by seller</span>
          </div>
          <div className="border-t pt-4 text-lg font-semibold">
            PHP {(cart.data?.total ?? 0).toFixed(2)}
          </div>
          <Link to="/checkout">
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={items.length === 0}>
              Proceed to checkout
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

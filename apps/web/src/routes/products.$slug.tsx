import { Button } from "@ecoExchange/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Leaf, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const product = useQuery(trpc.products.detail.queryOptions({ slug }));
  const { data: session } = authClient.useSession();
  const addToCart = useMutation({
    mutationFn: (productId: string) => trpcClient.cart.add.mutate({ productId, quantity: 1 }),
    onSuccess: () => toast.success("Added to cart"),
    onError: (error) => toast.error(error.message),
  });

  if (product.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-10">Loading product...</main>;
  }

  if (!product.data) {
    return <main className="mx-auto max-w-7xl px-4 py-10">Product not found.</main>;
  }

  const item = product.data;

  const handleAddToCart = () => {
    if (!session) {
      toast.error("Please sign in to add items to your cart");
      return;
    }

    addToCart.mutate(item.id);
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.85fr]">
      <div className="overflow-hidden border bg-emerald-50/50">
        <img className="h-full min-h-[460px] w-full object-cover" src={item.imageUrl} alt={item.name} />
      </div>
      <section className="space-y-6">
        <div className="space-y-3">
          <Link to="/products" className="text-sm text-emerald-700">
            Back to shop
          </Link>
          <p className="text-sm font-medium text-emerald-700">{item.category}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
        <Card className="border-emerald-900/10">
          <CardHeader>
            <CardTitle className="text-3xl">PHP {item.price.toFixed(2)}</CardTitle>
            <CardDescription>{item.stock} available from {item.sellerName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="h-11 w-full bg-emerald-700 hover:bg-emerald-800"
              disabled={addToCart.isPending || item.stock === 0}
              onClick={handleAddToCart}
            >
              Add to cart
            </Button>
            <div className="grid gap-3 text-sm">
              <TrustRow icon={<Leaf className="size-4" />} title={item.ecoBadge} />
              <TrustRow icon={<Truck className="size-4" />} title="Reliable door to door delivery" />
              <TrustRow icon={<ShieldCheck className="size-4" />} title="Checkout protected by your account" />
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function TrustRow({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 border bg-muted/30 p-3 text-muted-foreground">
      <span className="text-emerald-700">{icon}</span>
      {title}
    </div>
  );
}

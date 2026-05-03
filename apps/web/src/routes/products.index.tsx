import { Button } from "@ecoExchange/ui/components/button";
import { Input } from "@ecoExchange/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import ProductCard from "@/components/product-card";
import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const products = useQuery(trpc.products.list.queryOptions({ search, category }));
  const categories = useQuery(trpc.products.categories.queryOptions());
  const { data: session } = authClient.useSession();
  const addToCart = useMutation({
    mutationFn: (productId: string) => trpcClient.cart.add.mutate({ productId, quantity: 1 }),
    onSuccess: () => toast.success("Added to cart"),
    onError: (error) => toast.error(error.message),
  });

  const handleAddToCart = (productId: string) => {
    if (!session) {
      toast.error("Please sign in to add items to your cart");
      return;
    }

    addToCart.mutate(productId);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-sm font-medium text-emerald-700">Marketplace</p>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Shop EcoExchange</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Find reusable essentials, secondhand home goods, and locally restored items.
            </p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Search sustainable goods"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(categories.data ?? ["All"]).map((item) => (
          <Button
            key={item}
            variant={category === item ? "default" : "outline"}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(products.data ?? []).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            isAdding={addToCart.isPending}
          />
        ))}
      </section>

      {products.data?.length === 0 ? (
        <div className="border bg-muted/30 p-8 text-center text-muted-foreground">
          No products found. Try another search or seed the database.
        </div>
      ) : null}
    </main>
  );
}

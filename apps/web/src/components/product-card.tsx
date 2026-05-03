import { Button, buttonVariants } from "@ecoExchange/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Leaf, ShoppingCart } from "lucide-react";

type ProductCardProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  ecoBadge: string;
  sellerName: string;
};

export default function ProductCard({
  product,
  onAddToCart,
  isAdding,
}: {
  product: ProductCardProduct;
  onAddToCart?: (productId: string) => void;
  isAdding?: boolean;
}) {
  return (
    <Card className="h-full border-emerald-900/10 bg-white/90 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10 dark:bg-card">
      <div className="px-3 pt-3">
        <img className="h-48 w-full rounded-[1.5rem] object-cover" src={product.imageUrl} alt={product.name} />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{product.category}</CardDescription>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
            <Leaf className="size-3" />
            {product.ecoBadge}
          </span>
        </div>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.sellerName}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">PHP {product.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className={buttonVariants({ variant: "outline" })}
          >
            View
          </Link>
          {onAddToCart ? (
            <Button disabled={isAdding || product.stock === 0} onClick={() => onAddToCart(product.id)}>
              <ShoppingCart className="size-4" />
              Add
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

import { Link } from "@tanstack/react-router";
import { Leaf, ShoppingCart } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/products", label: "Shop" },
    { to: "/sell", label: "Sell" },
    { to: "/orders", label: "Orders" },
  ] as const;

  return (
    <div className="sticky top-0 z-20 border-b border-emerald-900/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-emerald-700">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <Leaf className="size-5" />
            </span>
            ECO EXCHANGE
          </Link>
          <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
            {links.map(({ to, label }) => {
              return (
                <Link key={to} to={to} activeProps={{ className: "text-foreground" }}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/cart">
            <ButtonLinkIcon />
          </Link>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}

function ButtonLinkIcon() {
  return (
    <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-border bg-white/60 px-3 text-xs font-medium hover:bg-muted">
      <ShoppingCart className="size-4" />
      Cart
    </span>
  );
}

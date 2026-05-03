import { Button, buttonVariants } from "@ecoExchange/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ecoExchange/ui/components/card";
import { Input } from "@ecoExchange/ui/components/input";
import { Label } from "@ecoExchange/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { PackageCheck, Search, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/sell")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
  component: SellPage,
});

function SellPage() {
  const dashboard = useQuery(trpc.seller.dashboard.queryOptions());
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [category, setCategory] = useState("Accessories");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ecoBadge, setEcoBadge] = useState("Locally made");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("active");

  useEffect(() => {
    if (!dashboard.data?.business) {
      return;
    }

    setBusinessName(dashboard.data.business.name);
    setBusinessDescription(dashboard.data.business.description);
    setContactPhone(dashboard.data.business.contactPhone ?? "");
  }, [dashboard.data?.business]);

  const saveBusiness = useMutation({
    mutationFn: () =>
      trpcClient.seller.saveBusiness.mutate({
        name: businessName,
        description: businessDescription,
        contactPhone,
      }),
    onSuccess: () => {
      toast.success("Business saved");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const createProduct = useMutation({
    mutationFn: () =>
      trpcClient.seller.createProduct.mutate({
        name: productName,
        description: productDescription,
        category,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
        ecoBadge,
      }),
    onSuccess: () => {
      toast.success("Product listed");
      setProductName("");
      setProductDescription("");
      setPrice("");
      setStock("");
      setImageUrl("");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateProduct = useMutation({
    mutationFn: (input: Parameters<typeof trpcClient.seller.updateProduct.mutate>[0]) =>
      trpcClient.seller.updateProduct.mutate(input),
    onSuccess: () => {
      toast.success("Listing updated");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const proposeDeliveryFee = useMutation({
    mutationFn: (input: Parameters<typeof trpcClient.seller.proposeDeliveryFee.mutate>[0]) =>
      trpcClient.seller.proposeDeliveryFee.mutate(input),
    onSuccess: () => {
      toast.success("Delivery fee sent to customer");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveRiderDetails = useMutation({
    mutationFn: (input: Parameters<typeof trpcClient.seller.saveRiderDetails.mutate>[0]) =>
      trpcClient.seller.saveRiderDetails.mutate(input),
    onSuccess: () => {
      toast.success("Rider details saved");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: (input: Parameters<typeof trpcClient.seller.updateOrderStatus.mutate>[0]) =>
      trpcClient.seller.updateOrderStatus.mutate(input),
    onSuccess: () => {
      toast.success("Order status updated");
      dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const hasBusiness = Boolean(dashboard.data?.business);
  const canSaveBusiness = businessName.trim().length >= 2 && businessDescription.trim().length >= 10;
  const canCreateProduct =
    hasBusiness &&
    productName.trim().length >= 2 &&
    productDescription.trim().length >= 10 &&
    Number(price) > 0 &&
    Number.isInteger(Number(stock)) &&
    Number(stock) >= 0 &&
    imageUrl.trim().startsWith("http") &&
    ecoBadge.trim().length >= 2;
  const sellerOrders = dashboard.data?.orders ?? [];
  const filteredOrders = sellerOrders.filter((order) => {
    const normalizedSearch = orderSearch.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      order.id.toLowerCase().includes(normalizedSearch) ||
      order.deliveryName.toLowerCase().includes(normalizedSearch) ||
      order.deliveryPhone.toLowerCase().includes(normalizedSearch) ||
      order.items.some((item) => item.productName.toLowerCase().includes(normalizedSearch));
    const matchesFilter =
      orderFilter === "all" ||
      (orderFilter === "active" && order.status !== "delivered" && order.status !== "cancelled") ||
      order.status === orderFilter ||
      order.deliveryStatus === orderFilter;

    return matchesSearch && matchesFilter;
  });
  const needsFeeCount = sellerOrders.filter((order) => order.deliveryStatus === "pending_fee").length;
  const readyToBookCount = sellerOrders.filter((order) => order.deliveryStatus === "fee_accepted").length;
  const activeOrderCount = sellerOrders.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
      <section>
        <p className="text-sm font-medium text-emerald-700">Seller Center</p>
        <h1 className="text-4xl font-semibold tracking-tight">Manage your EcoExchange business</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          List goods, manage stock, review orders, propose Lalamove or Maxim delivery fees, and record
          rider contact details after the customer accepts.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <Card className="border-emerald-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-5 text-emerald-700" />
              Business profile
            </CardTitle>
            <CardDescription>This business is tied to your user account only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveBusiness.mutate();
              }}
            >
              <Field label="Business name" value={businessName} onChange={setBusinessName} />
              <Field
                label="Short description"
                value={businessDescription}
                onChange={setBusinessDescription}
                placeholder="What do you sell and what makes it eco-friendly?"
              />
              <Field
                label="Contact phone"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="Optional"
              />
              <Button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                disabled={!canSaveBusiness || saveBusiness.isPending}
              >
                {hasBusiness ? "Update business" : "Create business"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/10">
          <CardHeader>
            <CardTitle>Add product listing</CardTitle>
            <CardDescription>
              Keep it simple: name, category, price, stock, and one image URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                createProduct.mutate();
              }}
            >
              <Field label="Product name" value={productName} onChange={setProductName} />
              <Field label="Category" value={category} onChange={setCategory} />
              <Field label="Price" value={price} onChange={setPrice} type="number" placeholder="249.00" />
              <Field label="Stock" value={stock} onChange={setStock} type="number" placeholder="10" />
              <div className="md:col-span-2">
                <Field
                  label="Image URL"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://..."
                />
              </div>
              <Field label="Eco badge" value={ecoBadge} onChange={setEcoBadge} />
              <Field
                label="Description"
                value={productDescription}
                onChange={setProductDescription}
                placeholder="Describe the condition, material, and why it is sustainable."
              />
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  disabled={!canCreateProduct || createProduct.isPending}
                >
                  List product
                </Button>
                {!hasBusiness ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your business profile before listing products.
                  </p>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <CardTitle>Your listings</CardTitle>
          <CardDescription>Edit stock, price, and listing details for your goods.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(dashboard.data?.products ?? []).map((product) => (
            <form
              key={product.id}
              className="grid gap-3 border p-4 md:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateProduct.mutate({
                  productId: product.id,
                  name: String(formData.get("name")),
                  description: String(formData.get("description")),
                  category: String(formData.get("category")),
                  price: Number(formData.get("price")),
                  stock: Number(formData.get("stock")),
                  imageUrl: String(formData.get("imageUrl")),
                  ecoBadge: String(formData.get("ecoBadge")),
                });
              }}
            >
              <LabeledInput name="name" label="Name" defaultValue={product.name} />
              <LabeledInput name="category" label="Category" defaultValue={product.category} />
              <LabeledInput name="price" label="Price" type="number" defaultValue={product.price.toString()} />
              <LabeledInput name="stock" label="Stock" type="number" defaultValue={product.stock.toString()} />
              <div className="md:col-span-2">
                <LabeledInput name="imageUrl" label="Image URL" defaultValue={product.imageUrl} />
              </div>
              <LabeledInput name="ecoBadge" label="Eco badge" defaultValue={product.ecoBadge} />
              <LabeledInput name="description" label="Description" defaultValue={product.description} />
              <div className="flex items-end gap-2 md:col-span-4">
                <Button type="submit" disabled={updateProduct.isPending}>
                  Save listing
                </Button>
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className={buttonVariants({ variant: "outline" })}
                >
                  View
                </Link>
              </div>
            </form>
          ))}
          {dashboard.data?.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings yet.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-emerald-900/10">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="size-5 text-emerald-700" />
                Seller orders
              </CardTitle>
              <CardDescription>
                Search, filter, and expand orders only when delivery or rider actions are needed.
              </CardDescription>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Active" value={activeOrderCount} />
              <Metric label="Needs fee" value={needsFeeCount} />
              <Metric label="Book rider" value={readyToBookCount} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-10 pl-9"
                placeholder="Search order ID, customer, phone, or product"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />
            </div>
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={orderFilter}
              onChange={(event) => setOrderFilter(event.target.value)}
            >
              <option value="active">Active orders</option>
              <option value="all">All orders</option>
              <option value="pending_fee">Needs delivery fee</option>
              <option value="fee_proposed">Waiting for customer</option>
              <option value="fee_accepted">Ready to book rider</option>
              <option value="booked">Rider booked</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-hidden border">
            <div className="hidden grid-cols-[1fr_150px_160px_130px] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
              <span>Order</span>
              <span>Status</span>
              <span>Delivery</span>
              <span className="text-right">Total</span>
            </div>
            {filteredOrders.map((order) => (
              <details key={order.id} className="group border-b last:border-b-0">
                <summary className="grid cursor-pointer gap-3 px-4 py-4 hover:bg-muted/30 md:grid-cols-[1fr_150px_160px_130px] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {order.deliveryName} - {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusBadge label={formatStatus(order.status)} tone={getStatusTone(order.status)} />
                  <StatusBadge label={formatStatus(order.deliveryStatus)} tone={getDeliveryTone(order.deliveryStatus)} />
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <span className="font-semibold">PHP {order.total.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground group-open:hidden">View</span>
                    <span className="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
                  </div>
                </summary>

                <div className="space-y-5 border-t bg-background p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Customer and items</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{order.deliveryName}</p>
                        <p>{order.deliveryPhone}</p>
                        <p>{order.deliveryAddress}</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.productName} x {item.quantity} - PHP{" "}
                            {((item.priceCents * item.quantity) / 100).toFixed(2)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <SummaryRow label="Subtotal" value={order.subtotal} />
                      <SummaryRow label="EcoExchange fee" value={order.platformFee} />
                      <SummaryRow label="Delivery fee" value={order.deliveryFee} />
                      <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Total</span>
                        <span>PHP {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <form
                      className="grid gap-3 border p-3 md:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        proposeDeliveryFee.mutate({
                          orderId: order.id,
                          provider: String(formData.get("provider")) as "lalamove" | "maxim" | "other",
                          fee: Number(formData.get("fee")),
                          note: String(formData.get("note")),
                        });
                      }}
                    >
                      <p className="text-sm font-medium md:col-span-2">Delivery fee proposal</p>
                      <LabeledInput name="provider" label="Provider" defaultValue={order.deliveryProvider ?? "lalamove"} />
                      <LabeledInput
                        name="fee"
                        label="Delivery fee"
                        type="number"
                        defaultValue={(order.deliveryFeeCents / 100).toString()}
                      />
                      <div className="md:col-span-2">
                        <LabeledInput
                          name="note"
                          label="Fee note"
                          defaultValue={order.deliveryFeeNote ?? "Manual rider booking via Lalamove or Maxim"}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button type="submit" size="sm" disabled={proposeDeliveryFee.isPending}>
                          Send fee to customer
                        </Button>
                      </div>
                    </form>

                    <form
                      className="grid gap-3 border p-3 md:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        saveRiderDetails.mutate({
                          orderId: order.id,
                          riderName: String(formData.get("riderName")),
                          riderPhone: String(formData.get("riderPhone")),
                          riderTrackingRef: String(formData.get("riderTrackingRef")),
                        });
                      }}
                    >
                      <p className="text-sm font-medium md:col-span-2">Rider details</p>
                      <LabeledInput name="riderName" label="Rider name" defaultValue={order.riderName ?? ""} />
                      <LabeledInput name="riderPhone" label="Rider phone" defaultValue={order.riderPhone ?? ""} />
                      <div className="md:col-span-2">
                        <LabeledInput
                          name="riderTrackingRef"
                          label="Tracking/reference"
                          defaultValue={order.riderTrackingRef ?? ""}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={
                            saveRiderDetails.isPending ||
                            (order.deliveryStatus !== "fee_accepted" && order.deliveryStatus !== "booked")
                          }
                        >
                          Save after acceptance
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Order status</p>
                    <div className="flex flex-wrap gap-2">
                      {(["processing", "ready_for_delivery", "delivery_booked", "delivered", "cancelled"] as const).map(
                        (status) => (
                          <Button
                            key={status}
                            variant={order.status === status ? "default" : "outline"}
                            size="sm"
                            disabled={updateOrderStatus.isPending}
                            onClick={() => updateOrderStatus.mutate({ orderId: order.id, status })}
                          >
                            {formatStatus(status)}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <p className="border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No seller orders match the current search or filter.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function LabeledInput({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border bg-muted/30 px-3 py-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>PHP {value.toFixed(2)}</span>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "default" | "warning" | "success" | "muted" }) {
  const classes = {
    default: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-green-200 bg-green-50 text-green-800",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];

  return <span className={`w-fit border px-2 py-1 text-xs font-medium ${classes}`}>{label}</span>;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusTone(status: string) {
  if (status === "delivered") {
    return "success";
  }

  if (status === "cancelled") {
    return "muted";
  }

  return "default";
}

function getDeliveryTone(status: string) {
  if (status === "pending_fee" || status === "fee_rejected") {
    return "warning";
  }

  if (status === "booked" || status === "delivered") {
    return "success";
  }

  if (status === "fee_proposed") {
    return "default";
  }

  return "muted";
}

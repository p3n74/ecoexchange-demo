import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const business = sqliteTable(
  "business",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    contactPhone: text("contact_phone"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("business_user_id_idx").on(table.userId)],
);

export const product = sqliteTable(
  "product",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    imageUrl: text("image_url").notNull(),
    ecoBadge: text("eco_badge").notNull(),
    sellerName: text("seller_name").notNull(),
    businessId: text("business_id").references(() => business.id, { onDelete: "set null" }),
    featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("product_category_idx").on(table.category)],
);

export const cartItem = sqliteTable(
  "cart_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("cart_item_user_id_idx").on(table.userId),
    uniqueIndex("cart_item_user_product_idx").on(table.userId, table.productId),
  ],
);

export const order = sqliteTable(
  "order",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("processing"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    platformFeeCents: integer("platform_fee_cents").notNull().default(0),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    deliveryProvider: text("delivery_provider"),
    deliveryStatus: text("delivery_status").notNull().default("pending_fee"),
    deliveryFeeNote: text("delivery_fee_note"),
    riderName: text("rider_name"),
    riderPhone: text("rider_phone"),
    riderTrackingRef: text("rider_tracking_ref"),
    totalCents: integer("total_cents").notNull(),
    deliveryName: text("delivery_name").notNull(),
    deliveryPhone: text("delivery_phone").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("order_user_id_idx").on(table.userId)],
);

export const orderItem = sqliteTable(
  "order_item",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    priceCents: integer("price_cents").notNull(),
  },
  (table) => [index("order_item_order_id_idx").on(table.orderId)],
);

export const businessRelations = relations(business, ({ many, one }) => ({
  user: one(user, {
    fields: [business.userId],
    references: [user.id],
  }),
  products: many(product),
}));

export const productRelations = relations(product, ({ many, one }) => ({
  business: one(business, {
    fields: [product.businessId],
    references: [business.id],
  }),
  cartItems: many(cartItem),
  orderItems: many(orderItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  user: one(user, {
    fields: [cartItem.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
}));

export const orderRelations = relations(order, ({ many, one }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));

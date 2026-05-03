import { db } from "@ecoExchange/db";
import { user } from "@ecoExchange/db/schema/auth";
import { business, cartItem, order, orderItem, product } from "@ecoExchange/db/schema/commerce";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

const ECOEXCHANGE_FEE_RATE = 0.03;

function toProductCard(item: typeof product.$inferSelect) {
  return {
    ...item,
    price: item.priceCents / 100,
  };
}

async function getCartRows(userId: string) {
  const rows = await db
    .select({
      id: cartItem.id,
      quantity: cartItem.quantity,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.priceCents,
      stock: product.stock,
      imageUrl: product.imageUrl,
      ecoBadge: product.ecoBadge,
      sellerName: product.sellerName,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .where(eq(cartItem.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    lineTotalCents: row.quantity * row.priceCents,
    product: {
      id: row.productId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      priceCents: row.priceCents,
      price: row.priceCents / 100,
      stock: row.stock,
      imageUrl: row.imageUrl,
      ecoBadge: row.ecoBadge,
      sellerName: row.sellerName,
    },
  }));
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || crypto.randomUUID();
}

function getOrderTotals(subtotalCents: number, deliveryFeeCents = 0) {
  const platformFeeCents = Math.round(subtotalCents * ECOEXCHANGE_FEE_RATE);
  const totalCents = subtotalCents + platformFeeCents + deliveryFeeCents;

  return {
    subtotalCents,
    subtotal: subtotalCents / 100,
    platformFeeCents,
    platformFee: platformFeeCents / 100,
    platformFeeRate: ECOEXCHANGE_FEE_RATE,
    deliveryFeeCents,
    deliveryFee: deliveryFeeCents / 100,
    totalCents,
    total: totalCents / 100,
  };
}

async function getSellerBusiness(userId: string) {
  const [sellerBusiness] = await db
    .select()
    .from(business)
    .where(eq(business.userId, userId))
    .limit(1);

  return sellerBusiness;
}

async function assertSellerOwnsProduct(userId: string, productId: string) {
  const sellerBusiness = await getSellerBusiness(userId);

  if (!sellerBusiness) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Create your business profile first",
    });
  }

  const [sellerProduct] = await db
    .select()
    .from(product)
    .where(and(eq(product.id, productId), eq(product.businessId, sellerBusiness.id)))
    .limit(1);

  if (!sellerProduct) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product listing not found",
    });
  }

  return { sellerBusiness, sellerProduct };
}

async function assertSellerOwnsOrder(userId: string, orderId: string) {
  const sellerBusiness = await getSellerBusiness(userId);

  if (!sellerBusiness) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Create your business profile first",
    });
  }

  const rows = await db
    .select({
      order,
    })
    .from(order)
    .innerJoin(orderItem, eq(orderItem.orderId, order.id))
    .innerJoin(product, eq(orderItem.productId, product.id))
    .where(and(eq(order.id, orderId), eq(product.businessId, sellerBusiness.id)))
    .limit(1);

  const sellerOrder = rows[0]?.order;

  if (!sellerOrder) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Seller order not found",
    });
  }

  return { sellerBusiness, sellerOrder };
}

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  admin: router({
    summary: protectedProcedure.query(async () => {
      const [users, businesses, products, orders] = await Promise.all([
        db.select().from(user),
        db.select().from(business),
        db.select().from(product),
        db.select().from(order).orderBy(desc(order.createdAt)),
      ]);

      const grossSalesCents = orders.reduce((sum, item) => sum + item.totalCents, 0);
      const subtotalCents = orders.reduce((sum, item) => sum + item.subtotalCents, 0);
      const platformFeeCents = orders.reduce((sum, item) => sum + item.platformFeeCents, 0);
      const deliveryFeeCents = orders.reduce((sum, item) => sum + item.deliveryFeeCents, 0);
      const activeOrders = orders.filter(
        (item) => item.status !== "delivered" && item.status !== "cancelled",
      ).length;
      const lowStockProducts = products.filter((item) => item.stock <= 5).length;
      const orderStatuses = orders.reduce<Record<string, number>>((summary, item) => {
        summary[item.status] = (summary[item.status] ?? 0) + 1;
        return summary;
      }, {});
      const deliveryStatuses = orders.reduce<Record<string, number>>((summary, item) => {
        summary[item.deliveryStatus] = (summary[item.deliveryStatus] ?? 0) + 1;
        return summary;
      }, {});

      return {
        totals: {
          users: users.length,
          businesses: businesses.length,
          products: products.length,
          orders: orders.length,
          activeOrders,
          lowStockProducts,
          grossSales: grossSalesCents / 100,
          subtotal: subtotalCents / 100,
          platformFees: platformFeeCents / 100,
          deliveryFees: deliveryFeeCents / 100,
        },
        orderStatuses,
        deliveryStatuses,
        recentOrders: orders.slice(0, 8).map((item) => ({
          id: item.id,
          status: item.status,
          deliveryStatus: item.deliveryStatus,
          deliveryName: item.deliveryName,
          total: item.totalCents / 100,
          platformFee: item.platformFeeCents / 100,
          deliveryFee: item.deliveryFeeCents / 100,
          createdAt: item.createdAt,
        })),
      };
    }),
  }),
  products: router({
    list: publicProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            category: z.string().optional(),
            featured: z.boolean().optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const filters = [];

        if (input?.category && input.category !== "All") {
          filters.push(eq(product.category, input.category));
        }

        if (input?.featured) {
          filters.push(eq(product.featured, true));
        }

        if (input?.search) {
          const search = `%${input.search}%`;
          filters.push(or(like(product.name, search), like(product.description, search)));
        }

        const products = await db
          .select()
          .from(product)
          .where(filters.length ? and(...filters) : undefined)
          .orderBy(desc(product.featured), desc(product.createdAt));

        return products.map(toProductCard);
      }),
    detail: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => {
      const [item] = await db.select().from(product).where(eq(product.slug, input.slug)).limit(1);

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return toProductCard(item);
    }),
    categories: publicProcedure.query(async () => {
      const rows = await db
        .selectDistinct({
          category: product.category,
        })
        .from(product)
        .orderBy(product.category);

      return ["All", ...rows.map((row) => row.category)];
    }),
  }),
  seller: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const sellerBusiness = await getSellerBusiness(ctx.session.user.id);

      if (!sellerBusiness) {
        return {
          business: null,
          products: [],
          orders: [],
        };
      }

      const sellerProducts = await db
        .select()
        .from(product)
        .where(eq(product.businessId, sellerBusiness.id))
        .orderBy(desc(product.createdAt));

      const sellerOrderRows = await db
        .select({
          order,
        })
        .from(order)
        .innerJoin(orderItem, eq(orderItem.orderId, order.id))
        .innerJoin(product, eq(orderItem.productId, product.id))
        .where(eq(product.businessId, sellerBusiness.id))
        .orderBy(desc(order.createdAt));

      const uniqueOrders = new Map<string, typeof order.$inferSelect>();

      for (const row of sellerOrderRows) {
        uniqueOrders.set(row.order.id, row.order);
      }

      const sellerOrders = await Promise.all(
        [...uniqueOrders.values()].map(async (sellerOrder) => {
          const items = await db
            .select()
            .from(orderItem)
            .innerJoin(product, eq(orderItem.productId, product.id))
            .where(and(eq(orderItem.orderId, sellerOrder.id), eq(product.businessId, sellerBusiness.id)));
          const deliveryFeeCents =
            sellerOrder.deliveryStatus === "fee_accepted" ||
            sellerOrder.deliveryStatus === "booked" ||
            sellerOrder.deliveryStatus === "delivered"
              ? sellerOrder.deliveryFeeCents
              : 0;
          const totals = getOrderTotals(sellerOrder.subtotalCents, deliveryFeeCents);

          return {
            ...sellerOrder,
            ...totals,
            items: items.map((row) => row.order_item),
          };
        }),
      );

      return {
        business: sellerBusiness,
        products: sellerProducts.map(toProductCard),
        orders: sellerOrders,
      };
    }),
    saveBusiness: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          description: z.string().min(10),
          contactPhone: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const [existing] = await db
          .select()
          .from(business)
          .where(eq(business.userId, ctx.session.user.id))
          .limit(1);

        if (existing) {
          await db
            .update(business)
            .set({
              name: input.name,
              description: input.description,
              contactPhone: input.contactPhone,
            })
            .where(eq(business.id, existing.id));

          await db
            .update(product)
            .set({ sellerName: input.name })
            .where(eq(product.businessId, existing.id));

          return { businessId: existing.id };
        }

        const businessId = crypto.randomUUID();

        await db.insert(business).values({
          id: businessId,
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          contactPhone: input.contactPhone,
        });

        return { businessId };
      }),
    createProduct: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          description: z.string().min(10),
          category: z.string().min(2),
          price: z.number().positive(),
          stock: z.number().int().min(0),
          imageUrl: z.string().url(),
          ecoBadge: z.string().min(2),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const [sellerBusiness] = await db
          .select()
          .from(business)
          .where(eq(business.userId, ctx.session.user.id))
          .limit(1);

        if (!sellerBusiness) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Create your business profile before listing products",
          });
        }

        const productId = crypto.randomUUID();

        await db.insert(product).values({
          id: productId,
          slug: `${slugify(input.name)}-${productId.slice(0, 8)}`,
          name: input.name,
          description: input.description,
          category: input.category,
          priceCents: Math.round(input.price * 100),
          stock: input.stock,
          imageUrl: input.imageUrl,
          ecoBadge: input.ecoBadge,
          sellerName: sellerBusiness.name,
          businessId: sellerBusiness.id,
          featured: false,
        });

        return { productId };
      }),
    updateProduct: protectedProcedure
      .input(
        z.object({
          productId: z.string().min(1),
          name: z.string().min(2),
          description: z.string().min(10),
          category: z.string().min(2),
          price: z.number().positive(),
          stock: z.number().int().min(0),
          imageUrl: z.string().url(),
          ecoBadge: z.string().min(2),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertSellerOwnsProduct(ctx.session.user.id, input.productId);

        await db
          .update(product)
          .set({
            name: input.name,
            description: input.description,
            category: input.category,
            priceCents: Math.round(input.price * 100),
            stock: input.stock,
            imageUrl: input.imageUrl,
            ecoBadge: input.ecoBadge,
          })
          .where(eq(product.id, input.productId));

        return { success: true };
      }),
    proposeDeliveryFee: protectedProcedure
      .input(
        z.object({
          orderId: z.string().min(1),
          provider: z.enum(["lalamove", "maxim", "other"]),
          fee: z.number().min(0),
          note: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertSellerOwnsOrder(ctx.session.user.id, input.orderId);

        await db
          .update(order)
          .set({
            deliveryProvider: input.provider,
            deliveryFeeCents: Math.round(input.fee * 100),
            deliveryFeeNote: input.note,
            deliveryStatus: "fee_proposed",
            status: "ready_for_delivery",
          })
          .where(eq(order.id, input.orderId));

        return { success: true };
      }),
    saveRiderDetails: protectedProcedure
      .input(
        z.object({
          orderId: z.string().min(1),
          riderName: z.string().min(2),
          riderPhone: z.string().min(7),
          riderTrackingRef: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { sellerOrder } = await assertSellerOwnsOrder(ctx.session.user.id, input.orderId);

        if (sellerOrder.deliveryStatus !== "fee_accepted" && sellerOrder.deliveryStatus !== "booked") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Customer must accept the delivery fee before booking delivery",
          });
        }

        await db
          .update(order)
          .set({
            riderName: input.riderName,
            riderPhone: input.riderPhone,
            riderTrackingRef: input.riderTrackingRef,
            deliveryStatus: "booked",
            status: "delivery_booked",
          })
          .where(eq(order.id, input.orderId));

        return { success: true };
      }),
    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.string().min(1),
          status: z.enum(["processing", "ready_for_delivery", "delivery_booked", "delivered", "cancelled"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertSellerOwnsOrder(ctx.session.user.id, input.orderId);

        await db
          .update(order)
          .set(
            input.status === "delivered"
              ? {
                  status: input.status,
                  deliveryStatus: "delivered",
                }
              : {
                  status: input.status,
                },
          )
          .where(eq(order.id, input.orderId));

        return { success: true };
      }),
  }),
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await getCartRows(ctx.session.user.id);
      const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
      const totals = getOrderTotals(subtotalCents);

      return {
        items,
        ...totals,
      };
    }),
    add: protectedProcedure
      .input(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
      .mutation(async ({ ctx, input }) => {
        const [item] = await db.select().from(product).where(eq(product.id, input.productId)).limit(1);

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        if (item.stock < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough stock available",
          });
        }

        const [existing] = await db
          .select()
          .from(cartItem)
          .where(and(eq(cartItem.userId, ctx.session.user.id), eq(cartItem.productId, input.productId)))
          .limit(1);

        if (existing) {
          await db
            .update(cartItem)
            .set({ quantity: Math.min(existing.quantity + input.quantity, item.stock) })
            .where(eq(cartItem.id, existing.id));
        } else {
          await db.insert(cartItem).values({
            id: crypto.randomUUID(),
            userId: ctx.session.user.id,
            productId: input.productId,
            quantity: input.quantity,
          });
        }

        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({ cartItemId: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
      .mutation(async ({ ctx, input }) => {
        await db
          .update(cartItem)
          .set({ quantity: input.quantity })
          .where(and(eq(cartItem.id, input.cartItemId), eq(cartItem.userId, ctx.session.user.id)));

        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ cartItemId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await db
          .delete(cartItem)
          .where(and(eq(cartItem.id, input.cartItemId), eq(cartItem.userId, ctx.session.user.id)));

        return { success: true };
      }),
  }),
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const orders = await db
        .select()
        .from(order)
        .where(eq(order.userId, ctx.session.user.id))
        .orderBy(desc(order.createdAt));

      return Promise.all(
        orders.map(async (customerOrder) => {
          const items = await db
            .select()
            .from(orderItem)
            .where(eq(orderItem.orderId, customerOrder.id));

          const subtotalCents =
            "subtotalCents" in customerOrder && customerOrder.subtotalCents
              ? customerOrder.subtotalCents
              : customerOrder.totalCents - customerOrder.platformFeeCents;
          const deliveryFeeCents =
            customerOrder.deliveryStatus === "fee_accepted" ||
            customerOrder.deliveryStatus === "booked" ||
            customerOrder.deliveryStatus === "delivered"
              ? customerOrder.deliveryFeeCents
              : 0;
          const totals = getOrderTotals(subtotalCents, deliveryFeeCents);

          return {
            ...customerOrder,
            ...totals,
            items,
          };
        }),
      );
    }),
    checkout: protectedProcedure
      .input(
        z.object({
          deliveryName: z.string().min(2),
          deliveryPhone: z.string().min(7),
          deliveryAddress: z.string().min(10),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const items = await getCartRows(ctx.session.user.id);

        if (items.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your cart is empty",
          });
        }

        for (const item of items) {
          if (item.product.stock < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${item.product.name} does not have enough stock`,
            });
          }
        }

        const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
        const totals = getOrderTotals(subtotalCents);
        const orderId = crypto.randomUUID();

        await db.transaction(async (tx) => {
          await tx.insert(order).values({
            id: orderId,
            userId: ctx.session.user.id,
            status: "processing",
            subtotalCents: totals.subtotalCents,
            platformFeeCents: totals.platformFeeCents,
            totalCents: totals.totalCents,
            deliveryName: input.deliveryName,
            deliveryPhone: input.deliveryPhone,
            deliveryAddress: input.deliveryAddress,
            notes: input.notes,
          });

          await tx.insert(orderItem).values(
            items.map((item) => ({
              id: crypto.randomUUID(),
              orderId,
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              priceCents: item.product.priceCents,
            })),
          );

          for (const item of items) {
            await tx
              .update(product)
              .set({ stock: item.product.stock - item.quantity })
              .where(eq(product.id, item.product.id));
          }

          await tx.delete(cartItem).where(eq(cartItem.userId, ctx.session.user.id));
        });

        return { orderId };
      }),
    acceptDeliveryFee: protectedProcedure
      .input(z.object({ orderId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const [customerOrder] = await db
          .select()
          .from(order)
          .where(and(eq(order.id, input.orderId), eq(order.userId, ctx.session.user.id)))
          .limit(1);

        if (!customerOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (customerOrder.deliveryStatus !== "fee_proposed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This order has no pending delivery fee proposal",
          });
        }

        const totals = getOrderTotals(customerOrder.subtotalCents, customerOrder.deliveryFeeCents);

        await db
          .update(order)
          .set({
            deliveryStatus: "fee_accepted",
            totalCents: totals.totalCents,
          })
          .where(eq(order.id, customerOrder.id));

        return { success: true };
      }),
    rejectDeliveryFee: protectedProcedure
      .input(z.object({ orderId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const [customerOrder] = await db
          .select()
          .from(order)
          .where(and(eq(order.id, input.orderId), eq(order.userId, ctx.session.user.id)))
          .limit(1);

        if (!customerOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (customerOrder.deliveryStatus !== "fee_proposed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This order has no pending delivery fee proposal",
          });
        }

        const totals = getOrderTotals(customerOrder.subtotalCents);

        await db
          .update(order)
          .set({
            deliveryStatus: "fee_rejected",
            totalCents: totals.totalCents,
          })
          .where(eq(order.id, customerOrder.id));

        return { success: true };
      }),
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;

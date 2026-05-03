import path from "node:path";

import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({
  path: path.resolve(process.cwd(), "../../apps/server/.env"),
  override: false,
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Check your runtime environment or apps/server/.env.");
}

const client = createClient({
  url: databaseUrl,
});

async function execute(sql: string) {
  await client.execute(sql);
}

await execute(`
  create table if not exists "user" (
    "id" text primary key not null,
    "name" text not null,
    "email" text not null unique,
    "email_verified" integer not null default 0,
    "image" text,
    "username" text unique,
    "display_username" text,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "session" (
    "id" text primary key not null,
    "expires_at" integer not null,
    "token" text not null unique,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null,
    "ip_address" text,
    "user_agent" text,
    "user_id" text not null references "user"("id") on delete cascade
  )
`);

await execute(`
  create table if not exists "account" (
    "id" text primary key not null,
    "account_id" text not null,
    "provider_id" text not null,
    "user_id" text not null references "user"("id") on delete cascade,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null
  )
`);

await execute(`
  create table if not exists "verification" (
    "id" text primary key not null,
    "identifier" text not null,
    "value" text not null,
    "expires_at" integer not null,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "business" (
    "id" text primary key not null,
    "user_id" text not null references "user"("id") on delete cascade,
    "name" text not null,
    "description" text not null,
    "contact_phone" text,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "product" (
    "id" text primary key not null,
    "slug" text not null unique,
    "name" text not null,
    "description" text not null,
    "category" text not null,
    "price_cents" integer not null,
    "stock" integer not null default 0,
    "image_url" text not null,
    "eco_badge" text not null,
    "seller_name" text not null,
    "business_id" text references "business"("id") on delete set null,
    "featured" integer not null default 0,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "cart_item" (
    "id" text primary key not null,
    "user_id" text not null references "user"("id") on delete cascade,
    "product_id" text not null references "product"("id") on delete cascade,
    "quantity" integer not null default 1,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "order" (
    "id" text primary key not null,
    "user_id" text not null references "user"("id") on delete cascade,
    "status" text not null default 'processing',
    "subtotal_cents" integer not null default 0,
    "platform_fee_cents" integer not null default 0,
    "delivery_fee_cents" integer not null default 0,
    "delivery_provider" text,
    "delivery_status" text not null default 'pending_fee',
    "delivery_fee_note" text,
    "rider_name" text,
    "rider_phone" text,
    "rider_tracking_ref" text,
    "total_cents" integer not null,
    "delivery_name" text not null,
    "delivery_phone" text not null,
    "delivery_address" text not null,
    "notes" text,
    "created_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
    "updated_at" integer not null default (cast(unixepoch('subsecond') * 1000 as integer))
  )
`);

await execute(`
  create table if not exists "order_item" (
    "id" text primary key not null,
    "order_id" text not null references "order"("id") on delete cascade,
    "product_id" text not null references "product"("id") on delete restrict,
    "product_name" text not null,
    "quantity" integer not null,
    "price_cents" integer not null
  )
`);

const indexes = [
  'create index if not exists "session_userId_idx" on "session" ("user_id")',
  'create index if not exists "account_userId_idx" on "account" ("user_id")',
  'create index if not exists "verification_identifier_idx" on "verification" ("identifier")',
  'create unique index if not exists "business_user_id_idx" on "business" ("user_id")',
  'create index if not exists "product_category_idx" on "product" ("category")',
  'create index if not exists "cart_item_user_id_idx" on "cart_item" ("user_id")',
  'create unique index if not exists "cart_item_user_product_idx" on "cart_item" ("user_id", "product_id")',
  'create index if not exists "order_user_id_idx" on "order" ("user_id")',
  'create index if not exists "order_item_order_id_idx" on "order_item" ("order_id")',
];

for (const index of indexes) {
  await execute(index);
}

console.log("EcoExchange database schema is ready.");

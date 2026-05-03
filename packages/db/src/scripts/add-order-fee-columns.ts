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
  throw new Error("DATABASE_URL is required. Check apps/server/.env.");
}

const client = createClient({
  url: databaseUrl,
});

const tableInfo = await client.execute('pragma table_info("order")');
const existingColumns = new Set(tableInfo.rows.map((row) => String(row.name)));

if (!existingColumns.has("subtotal_cents")) {
  await client.execute('alter table "order" add column "subtotal_cents" integer not null default 0');
  console.log('Added "subtotal_cents" to "order".');
}

if (!existingColumns.has("platform_fee_cents")) {
  await client.execute('alter table "order" add column "platform_fee_cents" integer not null default 0');
  console.log('Added "platform_fee_cents" to "order".');
}

if (!existingColumns.has("delivery_fee_cents")) {
  await client.execute('alter table "order" add column "delivery_fee_cents" integer not null default 0');
  console.log('Added "delivery_fee_cents" to "order".');
}

if (!existingColumns.has("delivery_provider")) {
  await client.execute('alter table "order" add column "delivery_provider" text');
  console.log('Added "delivery_provider" to "order".');
}

if (!existingColumns.has("delivery_status")) {
  await client.execute('alter table "order" add column "delivery_status" text not null default "pending_fee"');
  console.log('Added "delivery_status" to "order".');
}

if (!existingColumns.has("delivery_fee_note")) {
  await client.execute('alter table "order" add column "delivery_fee_note" text');
  console.log('Added "delivery_fee_note" to "order".');
}

if (!existingColumns.has("rider_name")) {
  await client.execute('alter table "order" add column "rider_name" text');
  console.log('Added "rider_name" to "order".');
}

if (!existingColumns.has("rider_phone")) {
  await client.execute('alter table "order" add column "rider_phone" text');
  console.log('Added "rider_phone" to "order".');
}

if (!existingColumns.has("rider_tracking_ref")) {
  await client.execute('alter table "order" add column "rider_tracking_ref" text');
  console.log('Added "rider_tracking_ref" to "order".');
}

await client.execute(`
  update "order"
  set "subtotal_cents" = "total_cents"
  where "subtotal_cents" = 0
`);

console.log("Order fee and delivery columns are ready.");

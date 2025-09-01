import { pgTable, serial, varchar, boolean, timestamp, integer, real, text } from "drizzle-orm/pg-core";

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  ip: varchar("ip", { length: 128 }).notNull(),
  port: integer("port").default(554).notNull(),
  protocol: varchar("protocol", { length: 10 }).notNull(),
  usernameRef: varchar("username_ref", { length: 120 }),
  passwordRef: varchar("password_ref", { length: 120 }),
  lat: real("lat"),
  lng: real("lng"),
  authorized: boolean("authorized").default(false).notNull(),
  consentProof: text("consent_proof"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  latencyMs: integer("latency_ms"),
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const credentialTests = pgTable("credential_tests", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  username: varchar("username", { length: 120 }),
  password: varchar("password", { length: 120 }),
  protocol: varchar("protocol", { length: 10 }).notNull(),
  success: boolean("success").notNull(),
  responseCode: integer("response_code"),
  responseTime: integer("response_time_ms"),
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

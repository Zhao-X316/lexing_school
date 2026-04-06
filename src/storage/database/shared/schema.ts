import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================
// 系统表（必须保留，不得删除）
// ============================================
export const healthCheck = pgTable("health_check", {
  id: integer("id").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ============================================
// 用户表
// ============================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    realName: varchar("real_name", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 20 }).notNull().default("parent"),
    avatar: text("avatar"),
    status: varchar("status", { length: 20 }).default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
  ]
);

// ============================================
// 文章表
// ============================================
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).unique(),
    summary: text("summary"),
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    category: varchar("category", { length: 50 }).default("新闻动态"),
    tags: jsonb("tags").default(sql`'[]'::jsonb`),
    authorId: uuid("author_id"),
    status: varchar("status", { length: 20 }).default("draft"),
    viewCount: integer("view_count").default(0),
    isFeatured: boolean("is_featured").default(false),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index("articles_status_idx").on(table.status),
    index("articles_category_idx").on(table.category),
    index("articles_author_idx").on(table.authorId),
    index("articles_published_at_idx").on(table.publishedAt),
  ]
);

// ============================================
// 首页配置表
// ============================================
export const homepageConfig = pgTable(
  "homepage_config",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sectionKey: varchar("section_key", { length: 50 }).notNull().unique(),
    sectionName: varchar("section_name", { length: 100 }).notNull(),
    config: jsonb("config").notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedBy: uuid("updated_by"),
  }
);

// ============================================
// 活动表
// ============================================
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    eventType: varchar("event_type", { length: 50 }).default("活动"),
    startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }),
    location: varchar("location", { length: 200 }),
    coverImage: text("cover_image"),
    maxParticipants: integer("max_participants"),
    currentParticipants: integer("current_participants").default(0),
    status: varchar("status", { length: 20 }).default("upcoming"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index("events_status_idx").on(table.status),
    index("events_start_time_idx").on(table.startTime),
  ]
);

// ============================================
// 媒体资源表
// ============================================
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }),
    filepath: text("filepath").notNull(),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    uploadedBy: uuid("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("media_uploaded_by_idx").on(table.uploadedBy),
  ]
);

// ============================================
// 操作日志表
// ============================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id"),
    action: varchar("action", { length: 50 }).notNull(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: uuid("resource_id"),
    details: jsonb("details").default(sql`'{}'::jsonb`),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// ============================================
// TypeScript 类型导出
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export type HomepageConfig = typeof homepageConfig.$inferSelect;
export type InsertHomepageConfig = typeof homepageConfig.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

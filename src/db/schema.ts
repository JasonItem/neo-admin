import {
  bigint,
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

export const tenants = mysqlTable(
  "tenants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("tenants_code_uidx").on(table.code)],
);

export const organizations = mysqlTable(
  "organizations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }),
    parentId: varchar("parent_id", { length: 36 }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    type: mysqlEnum("type", [
      "GROUP",
      "COMPANY",
      "BRANCH",
      "DEPARTMENT",
      "TEAM",
    ]).notNull(),
    path: varchar("path", { length: 1000 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organizations_code_uidx").on(table.code),
    index("organizations_tenant_idx").on(table.tenantId),
    index("organizations_parent_idx").on(table.parentId),
  ],
);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    organizationId: varchar("organization_id", { length: 36 }).notNull(),
    username: varchar("username", { length: 64 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    bio: varchar("bio", { length: 1000 }),
    gender: mysqlEnum("gender", ["UNKNOWN", "MALE", "FEMALE"])
      .notNull()
      .default("UNKNOWN"),
    enabled: boolean("enabled").notNull().default(true),
    lastLoginAt: datetime("last_login_at", { mode: "date" }),
    passwordChangedAt: datetime("password_changed_at", { mode: "date" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_username_uidx").on(table.username),
    index("users_tenant_idx").on(table.tenantId),
    index("users_org_idx").on(table.organizationId),
  ],
);

export const roles = mysqlTable(
  "roles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    description: varchar("description", { length: 500 }),
    defaultDataScope: mysqlEnum("data_scope", [
      "SELF",
      "CURRENT_ORG",
      "ORG_SUBTREE",
      "TENANT",
      "PLATFORM",
    ])
      .notNull()
      .default("SELF"),
    enabled: boolean("enabled").notNull().default(true),
    builtIn: boolean("built_in").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_code_uidx").on(table.code),
    index("roles_tenant_idx").on(table.tenantId),
  ],
);

export const menuItems = mysqlTable(
  "menu_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    parentId: varchar("parent_id", { length: 36 }),
    name: varchar("name", { length: 100 }).notNull(),
    type: mysqlEnum("type", ["DIRECTORY", "MENU", "BUTTON"]).notNull(),
    path: varchar("path", { length: 255 }),
    icon: varchar("icon", { length: 64 }),
    permissionCode: varchar("permission_code", { length: 128 }),
    component: varchar("component", { length: 255 }),
    sortOrder: int("sort_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    enabled: boolean("enabled").notNull().default(true),
    openMode: mysqlEnum("open_mode", ["INTERNAL", "EMBED", "EXTERNAL"])
      .notNull()
      .default("INTERNAL"),
    metadata: json("metadata"),
    ...timestamps,
  },
  (table) => [
    index("menu_items_parent_idx").on(table.parentId),
    uniqueIndex("menu_items_permission_uidx").on(table.permissionCode),
  ],
);

export const userRoles = mysqlTable(
  "user_roles",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    roleId: varchar("role_id", { length: 36 }).notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    anchorOrganizationId: varchar("anchor_organization_id", {
      length: 36,
    }).notNull(),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_roles_tenant_idx").on(table.tenantId),
    index("user_roles_anchor_org_idx").on(table.anchorOrganizationId),
  ],
);

export const roleMenuItems = mysqlTable(
  "role_menu_items",
  {
    roleId: varchar("role_id", { length: 36 }).notNull(),
    menuItemId: varchar("menu_item_id", { length: 36 }).notNull(),
    dataScope: mysqlEnum("data_scope", [
      "SELF",
      "CURRENT_ORG",
      "ORG_SUBTREE",
      "TENANT",
      "PLATFORM",
    ])
      .notNull()
      .default("SELF"),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.menuItemId] })],
);

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("workspaces_user_idx").on(table.userId)],
);

export const userAppearancePreferences = mysqlTable(
  "user_appearance_preferences",
  {
    userId: varchar("user_id", { length: 36 }).primaryKey(),
    layout: mysqlEnum("layout", ["SIDEBAR", "TOP"])
      .notNull()
      .default("SIDEBAR"),
    theme: mysqlEnum("theme", ["SYSTEM", "LIGHT", "DARK"])
      .notNull()
      .default("SYSTEM"),
    density: mysqlEnum("density", ["COMFORTABLE", "COMPACT"])
      .notNull()
      .default("COMFORTABLE"),
    ...timestamps,
  },
);

export const workspaceMenuItems = mysqlTable(
  "workspace_menu_items",
  {
    workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
    menuItemId: varchar("menu_item_id", { length: 36 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.menuItemId] }),
    index("workspace_menu_items_menu_idx").on(table.menuItemId),
  ],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    lastSeenAt: datetime("last_seen_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("sessions_token_uidx").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expiresAt),
  ],
);

export const operationLogs = mysqlTable(
  "operation_logs",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    actorId: varchar("actor_id", { length: 36 }),
    module: varchar("module", { length: 64 }).notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    resourceType: varchar("resource_type", { length: 64 }),
    resourceId: varchar("resource_id", { length: 64 }),
    method: varchar("method", { length: 12 }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    success: boolean("success").notNull(),
    detail: json("detail"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("operation_logs_actor_idx").on(table.actorId),
    index("operation_logs_created_idx").on(table.createdAt),
  ],
);

export const loginLogs = mysqlTable(
  "login_logs",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .autoincrement()
      .primaryKey(),
    userId: varchar("user_id", { length: 36 }),
    username: varchar("username", { length: 64 }).notNull(),
    event: mysqlEnum("event", ["SUCCESS", "FAILURE", "LOGOUT"]).notNull(),
    reason: varchar("reason", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("login_logs_user_idx").on(table.userId),
    index("login_logs_created_idx").on(table.createdAt),
  ],
);

export const cmsSiteSettings = mysqlTable(
  "cms_site_settings",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    siteName: varchar("site_name", { length: 120 }).notNull(),
    companyName: varchar("company_name", { length: 160 }).notNull(),
    slogan: varchar("slogan", { length: 255 }),
    description: text("description"),
    logoMediaId: varchar("logo_media_id", { length: 36 }),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    address: varchar("address", { length: 500 }),
    footerText: varchar("footer_text", { length: 500 }),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("cms_site_settings_tenant_uidx").on(table.tenantId)],
);

export const cmsMedia = mysqlTable(
  "cms_media",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    organizationId: varchar("organization_id", { length: 36 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    storageName: varchar("storage_name", { length: 255 }).notNull(),
    relativePath: varchar("relative_path", { length: 1000 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    extension: varchar("extension", { length: 20 }).notNull(),
    size: bigint("size", { mode: "number", unsigned: true }).notNull(),
    altText: varchar("alt_text", { length: 255 }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    deletedAt: datetime("deleted_at", { mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("cms_media_tenant_idx").on(table.tenantId),
    index("cms_media_org_idx").on(table.organizationId),
    index("cms_media_created_idx").on(table.createdAt),
  ],
);

export const cmsPages = mysqlTable(
  "cms_pages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    summary: varchar("summary", { length: 500 }),
    coverMediaId: varchar("cover_media_id", { length: 36 }),
    blocks: json("blocks")
      .$type<
        Array<{
          id: string;
          type: string;
          title?: string;
          content?: string;
          mediaId?: string;
          items?: Array<{
            title: string;
            description?: string;
            mediaId?: string;
          }>;
        }>
      >()
      .notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "OFFLINE"])
      .notNull()
      .default("DRAFT"),
    isHome: boolean("is_home").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    publishedAt: datetime("published_at", { mode: "date" }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cms_pages_tenant_slug_uidx").on(table.tenantId, table.slug),
    index("cms_pages_status_idx").on(table.tenantId, table.status),
  ],
);

export const cmsNavigations = mysqlTable(
  "cms_navigations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    parentId: varchar("parent_id", { length: 36 }),
    label: varchar("label", { length: 100 }).notNull(),
    location: mysqlEnum("location", ["HEADER", "FOOTER"])
      .notNull()
      .default("HEADER"),
    linkType: mysqlEnum("link_type", ["PAGE", "URL"]).notNull().default("PAGE"),
    pageId: varchar("page_id", { length: 36 }),
    url: varchar("url", { length: 500 }),
    target: mysqlEnum("target", ["SELF", "BLANK"]).notNull().default("SELF"),
    sortOrder: int("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("cms_navigation_tenant_idx").on(table.tenantId),
    index("cms_navigation_parent_idx").on(table.parentId),
  ],
);

export const cmsCategories = mysqlTable(
  "cms_categories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    parentId: varchar("parent_id", { length: 36 }),
    kind: mysqlEnum("kind", ["ARTICLE", "PRODUCT", "CASE"]).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: varchar("description", { length: 500 }),
    sortOrder: int("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cms_categories_tenant_kind_slug_uidx").on(
      table.tenantId,
      table.kind,
      table.slug,
    ),
    index("cms_categories_parent_idx").on(table.parentId),
  ],
);

export const cmsContents = mysqlTable(
  "cms_contents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    kind: mysqlEnum("kind", ["ARTICLE", "PRODUCT", "CASE"]).notNull(),
    categoryId: varchar("category_id", { length: 36 }),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    summary: varchar("summary", { length: 1000 }),
    body: text("body"),
    coverMediaId: varchar("cover_media_id", { length: 36 }),
    galleryMediaIds: json("gallery_media_ids").$type<string[]>().notNull(),
    attributes: json("attributes").$type<Record<string, string>>().notNull(),
    featured: boolean("featured").notNull().default(false),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "OFFLINE"])
      .notNull()
      .default("DRAFT"),
    sortOrder: int("sort_order").notNull().default(0),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 500 }),
    publishedAt: datetime("published_at", { mode: "date" }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cms_contents_tenant_kind_slug_uidx").on(
      table.tenantId,
      table.kind,
      table.slug,
    ),
    index("cms_contents_category_idx").on(table.categoryId),
    index("cms_contents_status_idx").on(
      table.tenantId,
      table.kind,
      table.status,
    ),
  ],
);

export type DataScope = typeof roles.$inferSelect.defaultDataScope;
export type MenuItem = typeof menuItems.$inferSelect;

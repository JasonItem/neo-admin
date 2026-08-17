import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";
import {
  cmsCategories,
  cmsContents,
  cmsNavigations,
  cmsPages,
  menuItems,
  organizations,
  roleMenuItems,
  roles,
  tenants,
  userRoles,
  users,
} from "./schema";
import {
  PERMISSION_NAMES,
  PERMISSIONS,
  type PermissionCode,
} from "../lib/permissions";

if (existsSync(".env.local")) loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 2,
});
const db = drizzle({ client: pool });

const ids = {
  org: "00000000-0000-4000-8000-000000000001",
  admin: "00000000-0000-4000-8000-000000000002",
  role: "00000000-0000-4000-8000-000000000003",
  dashboard: "10000000-0000-4000-8000-000000000001",
  cms: "10000000-0000-4000-8000-000000000009",
  cmsSite: "10000000-0000-4000-8000-000000000010",
  cmsMedia: "10000000-0000-4000-8000-000000000011",
  cmsPages: "10000000-0000-4000-8000-000000000012",
  cmsNavigation: "10000000-0000-4000-8000-000000000013",
  cmsArticles: "10000000-0000-4000-8000-000000000014",
  cmsProducts: "10000000-0000-4000-8000-000000000015",
  cmsCases: "10000000-0000-4000-8000-000000000016",
  system: "10000000-0000-4000-8000-000000000002",
  users: "10000000-0000-4000-8000-000000000003",
  roles: "10000000-0000-4000-8000-000000000004",
  menus: "10000000-0000-4000-8000-000000000005",
  orgs: "10000000-0000-4000-8000-000000000006",
  operationLogs: "10000000-0000-4000-8000-000000000007",
  loginLogs: "10000000-0000-4000-8000-000000000008",
};

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const displayName = process.env.SEED_ADMIN_NAME ?? "系统管理员";
  await db
    .insert(tenants)
    .values({ id: ids.org, name: "总部", code: "HQ" })
    .onDuplicateKeyUpdate({ set: { name: "总部" } });
  await db
    .insert(organizations)
    .values({
      id: ids.org,
      tenantId: ids.org,
      name: "总部",
      code: "HQ",
      type: "COMPANY",
      path: ids.org,
      sortOrder: 1,
    })
    .onDuplicateKeyUpdate({ set: { name: "总部" } });
  await db
    .insert(roles)
    .values({
      id: ids.role,
      tenantId: null,
      name: "超级管理员",
      code: "SUPER_ADMIN",
      defaultDataScope: "PLATFORM",
      builtIn: true,
    })
    .onDuplicateKeyUpdate({
      set: { name: "超级管理员", defaultDataScope: "PLATFORM" },
    });
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const userId = existing?.id ?? ids.admin;
  if (!existing)
    await db.insert(users).values({
      id: userId,
      tenantId: ids.org,
      organizationId: ids.org,
      username,
      passwordHash: await hash(password, 12),
      displayName,
    });
  await db
    .insert(userRoles)
    .values({
      userId,
      roleId: ids.role,
      tenantId: ids.org,
      anchorOrganizationId: ids.org,
    })
    .onDuplicateKeyUpdate({
      set: { tenantId: ids.org, anchorOrganizationId: ids.org },
    });

  const definitions = [
    {
      id: ids.dashboard,
      name: "数据概览",
      type: "MENU" as const,
      path: "/dashboard",
      icon: "CircleGauge",
      permissionCode: PERMISSIONS.dashboardView,
      sortOrder: 1,
    },
    {
      id: ids.cms,
      name: "网站管理",
      type: "DIRECTORY" as const,
      path: null,
      icon: "Globe2",
      permissionCode: null,
      sortOrder: 2,
    },
    {
      id: ids.cmsSite,
      parentId: ids.cms,
      name: "站点设置",
      type: "MENU" as const,
      path: "/cms/site",
      icon: "Globe2",
      permissionCode: PERMISSIONS.cmsSiteList,
      sortOrder: 1,
    },
    {
      id: ids.cmsMedia,
      parentId: ids.cms,
      name: "媒体库",
      type: "MENU" as const,
      path: "/cms/media",
      icon: "Images",
      permissionCode: PERMISSIONS.cmsMediaList,
      sortOrder: 2,
    },
    {
      id: ids.cmsPages,
      parentId: ids.cms,
      name: "页面管理",
      type: "MENU" as const,
      path: "/cms/pages",
      icon: "PanelsTopLeft",
      permissionCode: PERMISSIONS.cmsPageList,
      sortOrder: 3,
    },
    {
      id: ids.cmsNavigation,
      parentId: ids.cms,
      name: "栏目导航",
      type: "MENU" as const,
      path: "/cms/navigation",
      icon: "ListTree",
      permissionCode: PERMISSIONS.cmsNavigationList,
      sortOrder: 4,
    },
    {
      id: ids.cmsArticles,
      parentId: ids.cms,
      name: "文章新闻",
      type: "MENU" as const,
      path: "/cms/articles",
      icon: "Newspaper",
      permissionCode: PERMISSIONS.cmsArticleList,
      sortOrder: 5,
    },
    {
      id: ids.cmsProducts,
      parentId: ids.cms,
      name: "产品管理",
      type: "MENU" as const,
      path: "/cms/products",
      icon: "Package",
      permissionCode: PERMISSIONS.cmsProductList,
      sortOrder: 6,
    },
    {
      id: ids.cmsCases,
      parentId: ids.cms,
      name: "案例管理",
      type: "MENU" as const,
      path: "/cms/cases",
      icon: "BriefcaseBusiness",
      permissionCode: PERMISSIONS.cmsCaseList,
      sortOrder: 7,
    },
    {
      id: ids.system,
      name: "权限管理",
      type: "DIRECTORY" as const,
      path: null,
      icon: "ShieldCheck",
      permissionCode: null,
      sortOrder: 3,
    },
    {
      id: ids.users,
      parentId: ids.system,
      name: "用户管理",
      type: "MENU" as const,
      path: "/system/users",
      icon: "Users",
      permissionCode: PERMISSIONS.userList,
      sortOrder: 1,
    },
    {
      id: ids.roles,
      parentId: ids.system,
      name: "角色管理",
      type: "MENU" as const,
      path: "/system/roles",
      icon: "ShieldCheck",
      permissionCode: PERMISSIONS.roleList,
      sortOrder: 2,
    },
    {
      id: ids.menus,
      parentId: ids.system,
      name: "菜单管理",
      type: "MENU" as const,
      path: "/system/menus",
      icon: "MenuSquare",
      permissionCode: PERMISSIONS.menuList,
      sortOrder: 3,
    },
    {
      id: ids.orgs,
      parentId: ids.system,
      name: "组织管理",
      type: "MENU" as const,
      path: "/system/organizations",
      icon: "Building2",
      permissionCode: PERMISSIONS.organizationList,
      sortOrder: 4,
    },
    {
      id: ids.operationLogs,
      parentId: ids.system,
      name: "操作日志",
      type: "MENU" as const,
      path: "/system/operation-logs",
      icon: "FileClock",
      permissionCode: PERMISSIONS.operationLogList,
      sortOrder: 5,
    },
    {
      id: ids.loginLogs,
      parentId: ids.system,
      name: "登录日志",
      type: "MENU" as const,
      path: "/system/login-logs",
      icon: "FileClock",
      permissionCode: PERMISSIONS.loginLogList,
      sortOrder: 6,
    },
  ];
  const buttonParents = [
    [ids.cmsSite, [PERMISSIONS.cmsSiteUpdate]],
    [
      ids.cmsMedia,
      [
        PERMISSIONS.cmsMediaUpload,
        PERMISSIONS.cmsMediaUpdate,
        PERMISSIONS.cmsMediaDelete,
      ],
    ],
    [ids.cmsPages, [PERMISSIONS.cmsPageManage]],
    [ids.cmsNavigation, [PERMISSIONS.cmsNavigationManage]],
    [ids.cmsArticles, [PERMISSIONS.cmsArticleManage]],
    [ids.cmsProducts, [PERMISSIONS.cmsProductManage]],
    [ids.cmsCases, [PERMISSIONS.cmsCaseManage]],
    [
      ids.users,
      [PERMISSIONS.userCreate, PERMISSIONS.userUpdate, PERMISSIONS.userDelete],
    ],
    [
      ids.roles,
      [
        PERMISSIONS.roleCreate,
        PERMISSIONS.roleUpdate,
        PERMISSIONS.roleDelete,
        PERMISSIONS.roleGrant,
      ],
    ],
    [
      ids.menus,
      [PERMISSIONS.menuCreate, PERMISSIONS.menuUpdate, PERMISSIONS.menuDelete],
    ],
    [
      ids.orgs,
      [
        PERMISSIONS.organizationCreate,
        PERMISSIONS.organizationUpdate,
        PERMISSIONS.organizationDelete,
      ],
    ],
    [ids.system, [PERMISSIONS.profileUpdate, PERMISSIONS.passwordUpdate]],
  ] as const;
  const allDefinitions: Array<
    | (typeof definitions)[number]
    | {
        id: string;
        parentId: string;
        name: string;
        type: "BUTTON";
        path: null;
        icon: null;
        permissionCode: string;
        sortOrder: number;
        visible: boolean;
      }
  > = [...definitions];
  let sequence = 100;
  for (const [parentId, permissions] of buttonParents)
    for (const permissionCode of permissions)
      allDefinitions.push({
        id: `20000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`,
        parentId,
        name: PERMISSION_NAMES[permissionCode as PermissionCode],
        type: "BUTTON",
        path: null,
        icon: null,
        permissionCode,
        sortOrder: sequence,
        visible: false,
      });
  for (const definition of allDefinitions) {
    const [existingMenuItem] = definition.permissionCode
      ? await db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.permissionCode, definition.permissionCode))
          .limit(1)
      : [];
    const menuItemId = existingMenuItem?.id ?? definition.id;

    await db
      .insert(menuItems)
      .values({ ...definition, id: menuItemId })
      .onDuplicateKeyUpdate({
        set: {
          name: definition.name,
          parentId: definition.parentId ?? null,
          path: definition.path,
          icon: definition.icon,
          permissionCode: definition.permissionCode,
          sortOrder: definition.sortOrder,
          visible: "visible" in definition ? definition.visible : true,
        },
      });
    await db
      .insert(roleMenuItems)
      .values({ roleId: ids.role, menuItemId, dataScope: "PLATFORM" })
      .onDuplicateKeyUpdate({
        set: { dataScope: "PLATFORM" },
      });
  }
  await seedCmsExamples(userId);
  console.log(`初始化完成。管理员账号：${username}`);
  await pool.end();
}

async function seedCmsExamples(userId: string) {
  const pageAbout = "30000000-0000-4000-8000-000000000001";
  const pageSolutions = "30000000-0000-4000-8000-000000000002";
  const articleCategory = "31000000-0000-4000-8000-000000000001";
  const productCategory = "31000000-0000-4000-8000-000000000002";
  const caseCategory = "31000000-0000-4000-8000-000000000003";
  const pages = [
    {
      id: pageAbout,
      title: "关于我们",
      slug: "about",
      summary: "了解我们的团队、使命与企业服务能力。",
      status: "PUBLISHED" as const,
      isHome: false,
      sortOrder: 1,
      seoTitle: "关于我们 - NeoAdmin",
      seoDescription: "NeoAdmin 企业介绍与服务能力。",
      createdBy: userId,
      blocks: [
        {
          id: "about-hero",
          type: "HERO",
          title: "用数字体验连接品牌与客户",
          content:
            "我们专注企业网站建设与长期内容运营，帮助企业建立可信赖的线上形象。",
        },
        {
          id: "about-intro",
          type: "RICH_TEXT",
          title: "关于 NeoAdmin",
          content:
            "从信息架构、视觉设计到内容管理，我们提供覆盖企业建站全生命周期的服务。\n\n后台采用结构化内容管理，让运营人员无需修改代码即可持续更新网站。",
        },
        {
          id: "about-features",
          type: "FEATURES",
          title: "我们的优势",
          content:
            "清晰的信息架构、可复用的媒体资源、可靠的权限管理与灵活的内容发布。",
        },
        {
          id: "about-cta",
          type: "CTA",
          title: "准备好升级您的企业官网吗？",
          content: "与我们沟通您的业务目标，一起规划更专业的数字门户。",
        },
      ],
    },
    {
      id: pageSolutions,
      title: "解决方案",
      slug: "solutions",
      summary: "企业建站、产品展示与内容运营解决方案。",
      status: "PUBLISHED" as const,
      isHome: false,
      sortOrder: 2,
      seoTitle: "企业建站解决方案",
      seoDescription: "面向企业官网的数字化建站与内容运营方案。",
      createdBy: userId,
      blocks: [
        {
          id: "solutions-hero",
          type: "HERO",
          title: "适合企业长期运营的网站解决方案",
          content: "不仅完成一次上线，更让内容、产品和案例能够持续成长。",
        },
        {
          id: "solutions-products",
          type: "PRODUCTS",
          title: "核心产品",
          content: "围绕企业不同阶段提供灵活的建站产品。",
        },
        {
          id: "solutions-cases",
          type: "CASES",
          title: "客户案例",
          content: "从真实项目中了解我们的实施能力。",
        },
        {
          id: "solutions-news",
          type: "ARTICLES",
          title: "最新动态",
          content: "关注产品更新与企业数字化实践。",
        },
      ],
    },
  ];
  for (const page of pages)
    await db
      .insert(cmsPages)
      .values({
        ...page,
        tenantId: ids.org,
        coverMediaId: null,
        publishedAt: new Date(),
      })
      .onDuplicateKeyUpdate({ set: { id: page.id } });

  const categories = [
    {
      id: articleCategory,
      kind: "ARTICLE" as const,
      name: "企业动态",
      slug: "company-news",
      description: "公司新闻与产品更新",
      sortOrder: 1,
    },
    {
      id: productCategory,
      kind: "PRODUCT" as const,
      name: "建站产品",
      slug: "website-products",
      description: "企业建站相关产品",
      sortOrder: 1,
    },
    {
      id: caseCategory,
      kind: "CASE" as const,
      name: "客户案例",
      slug: "customer-cases",
      description: "企业网站建设案例",
      sortOrder: 1,
    },
  ];
  for (const category of categories)
    await db
      .insert(cmsCategories)
      .values({ ...category, tenantId: ids.org, parentId: null, enabled: true })
      .onDuplicateKeyUpdate({ set: { id: category.id } });

  const contents = [
    {
      id: "32000000-0000-4000-8000-000000000001",
      kind: "ARTICLE" as const,
      categoryId: articleCategory,
      title: "企业官网内容管理的五个关键原则",
      slug: "five-cms-principles",
      summary:
        "从内容结构、媒体复用、发布流程、SEO 和权限管理出发，建立可长期维护的企业官网。",
      body: "企业官网不是一次性交付物，而是一套持续运营的内容系统。结构化页面、统一媒体库、清晰的发布状态、完整的 SEO 字段和按角色分配的权限，是长期维护的基础。",
    },
    {
      id: "32000000-0000-4000-8000-000000000002",
      kind: "ARTICLE" as const,
      categoryId: articleCategory,
      title: "NeoAdmin CMS 内容模块正式上线",
      slug: "cms-content-release",
      summary: "页面、导航、文章、产品和案例模块现已可以统一管理。",
      body: "本次更新新增企业建站所需的核心内容能力，运营人员可以在后台创建页面、组合区块并发布内容。",
    },
    {
      id: "32000000-0000-4000-8000-000000000003",
      kind: "PRODUCT" as const,
      categoryId: productCategory,
      title: "企业官网标准版",
      slug: "corporate-website-standard",
      summary:
        "适合成长型企业的响应式官网，包含品牌展示、产品、新闻、案例和联系页面。",
      body: "标准版提供完整的企业官网内容结构和自主维护后台。",
      attributes: {
        交付周期: "15-20 个工作日",
        适用企业: "成长型企业",
        终端支持: "电脑、平板、手机",
      },
    },
    {
      id: "32000000-0000-4000-8000-000000000004",
      kind: "PRODUCT" as const,
      categoryId: productCategory,
      title: "企业官网专业版",
      slug: "corporate-website-pro",
      summary: "适合具有多业务线和大量内容运营需求的企业。",
      body: "专业版支持更复杂的栏目、内容模型和精细化权限配置。",
      attributes: {
        交付周期: "25-35 个工作日",
        适用企业: "集团与多业务企业",
        内容规模: "中大型",
      },
    },
    {
      id: "32000000-0000-4000-8000-000000000005",
      kind: "CASE" as const,
      categoryId: caseCategory,
      title: "智能制造企业官网升级",
      slug: "smart-manufacturing-case",
      summary: "重构品牌信息架构和产品中心，让海外客户更快理解企业能力。",
      body: "项目围绕品牌升级、产品分类、案例展示和多终端体验完成整体改版。",
    },
    {
      id: "32000000-0000-4000-8000-000000000006",
      kind: "CASE" as const,
      categoryId: caseCategory,
      title: "科技服务公司内容门户",
      slug: "technology-service-case",
      summary: "通过结构化内容和统一媒体库降低日常运营成本。",
      body: "上线后市场团队可以独立维护新闻、解决方案与客户案例。",
    },
  ];
  for (const content of contents)
    await db
      .insert(cmsContents)
      .values({
        ...content,
        attributes: ("attributes" in content
          ? content.attributes
          : {}) as Record<string, string>,
        tenantId: ids.org,
        coverMediaId: null,
        galleryMediaIds: [],
        featured: true,
        status: "PUBLISHED",
        sortOrder: 1,
        seoTitle: content.title,
        seoDescription: content.summary,
        publishedAt: new Date(),
        createdBy: userId,
      })
      .onDuplicateKeyUpdate({ set: { id: content.id } });

  const navigations = [
    {
      id: "33000000-0000-4000-8000-000000000001",
      label: "关于我们",
      location: "HEADER" as const,
      pageId: pageAbout,
      sortOrder: 1,
    },
    {
      id: "33000000-0000-4000-8000-000000000002",
      label: "解决方案",
      location: "HEADER" as const,
      pageId: pageSolutions,
      sortOrder: 2,
    },
    {
      id: "33000000-0000-4000-8000-000000000003",
      label: "关于我们",
      location: "FOOTER" as const,
      pageId: pageAbout,
      sortOrder: 1,
    },
    {
      id: "33000000-0000-4000-8000-000000000004",
      label: "解决方案",
      location: "FOOTER" as const,
      pageId: pageSolutions,
      sortOrder: 2,
    },
    {
      id: "33000000-0000-4000-8000-000000000005",
      label: "服务能力",
      location: "HEADER" as const,
      pageId: pageSolutions,
      parentId: "33000000-0000-4000-8000-000000000002",
      sortOrder: 1,
    },
  ];
  for (const navigation of navigations)
    await db
      .insert(cmsNavigations)
      .values({
        parentId: null,
        ...navigation,
        tenantId: ids.org,
        linkType: "PAGE",
        url: null,
        target: "SELF",
        enabled: true,
      })
      .onDuplicateKeyUpdate({ set: { id: navigation.id } });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

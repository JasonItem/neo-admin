# NeoAdmin

NeoAdmin 是一个基于 Next.js、MySQL 和 Drizzle ORM 构建的现代化后台管理系统，提供完整的 RBAC 权限控制、组织数据范围、可配置工作区以及响应式双布局。

## 界面预览

### 登录页面

![NeoAdmin 登录页面](./public/readme/login.png)

### 顶部菜单布局

![NeoAdmin 顶部菜单数据概览](./public/readme/dashboard-top.png)

### 左侧菜单与角色权限

![NeoAdmin 左侧菜单角色管理](./public/readme/roles-sidebar.png)

## 功能特性

- 用户、角色、菜单、组织、操作日志和登录日志管理
- 基于角色的功能权限控制（RBAC）
- 按权限分别配置数据范围：本人、当前组织、当前组织及下级、当前公司、全平台
- 平台管理员可创建具备全平台数据权限的角色
- 工作区管理：管理员可根据已有权限配置每个工作区展示的菜单
- 左侧菜单与顶部菜单两种后台布局
- 顶部菜单支持图标、选中高亮、无限级下拉和空间不足自动收纳
- 移动端自动切换为侧边栏抽屉布局
- 浅色、深色和跟随系统主题
- 登录页 Pixel Blast 动态粒子背景
- 单站点企业官网与响应式固定主题
- 站点品牌、联系方式、网站状态和 SEO 配置
- 本地媒体库：图片、PDF、Word、Excel 上传与删除
- 媒体文件按公司隔离存储，并可直接设置网站 Logo

## 技术栈

- Next.js 16（App Router）
- React 19 + TypeScript
- Tailwind CSS 4
- Base UI / shadcn/ui
- MySQL + Drizzle ORM
- Vitest
- Three.js + postprocessing

## 本地开发

### 环境要求

- Node.js 20 或更高版本
- npm
- MySQL 8 或兼容版本

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，然后按本地环境修改：

```env
DATABASE_URL=mysql://root:root@127.0.0.1:3306/neoadmin
APP_DEMO_MODE=false
```

### 3. 初始化数据库

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

### 4. 启动项目

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

默认平台管理员：

- 账号：`admin`
- 密码：`ChangeMe123!`

首次登录后请立即修改默认密码。

## 权限与数据边界

- 功能权限由角色授予，数据范围按每一项权限独立配置。
- 集团用于平台归类，不作为数据租户；公司是独立租户。
- 分公司、部门和小组继承所属公司的租户边界。
- 平台超级管理员可以维护集团、公司及全平台角色。
- 公司管理员只能维护本公司范围内的组织节点与数据。
- 授权遵循“不可向上越权”：用户不能授予自己没有的功能权限，也不能授予比自身更大的数据范围。

## 本地媒体存储

上传的图片和文档默认保存在 `data/uploads`，数据库仅保存文件元数据。该目录已加入 `.gitignore`，部署时需要作为持久化目录单独挂载和备份。

```yaml
# Docker Compose 示例
volumes:
  - ./data/uploads:/app/data/uploads
```

备份系统时请同时备份 MySQL 数据库和 `data/uploads` 目录。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查
npm test             # 运行测试
npm run db:create    # 创建数据库
npm run db:generate  # 生成 Drizzle 迁移
npm run db:migrate   # 执行数据库迁移
npm run db:seed      # 导入初始化数据
```

## 项目结构

```text
src/
├─ app/            Next.js 页面、服务端操作与 API
├─ components/     UI、布局、认证和业务组件
├─ db/             数据库 Schema、连接与种子数据
├─ hooks/          响应式等客户端 Hooks
└─ lib/            权限、会话、导航和工作区逻辑
drizzle/           数据库迁移文件
scripts/           数据库初始化脚本
```

## 安全提示

- 不要提交 `.env.local` 或其他包含真实数据库凭据的文件。
- 生产环境应使用独立的强密码数据库账号。
- 上线前请更换默认管理员密码并启用 HTTPS。

## License

项目暂未声明开源许可证。登录页 Pixel Blast 组件基于 [React Bits](https://reactbits.dev/backgrounds/pixel-blast)，遵循其 MIT + Commons Clause 许可。

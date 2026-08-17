CREATE TABLE `cms_categories` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`kind` enum('ARTICLE','PRODUCT','CASE') NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`description` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_categories_tenant_kind_slug_uidx` UNIQUE(`tenant_id`,`kind`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `cms_contents` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`kind` enum('ARTICLE','PRODUCT','CASE') NOT NULL,
	`category_id` varchar(36),
	`title` varchar(200) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`summary` varchar(1000),
	`body` text,
	`cover_media_id` varchar(36),
	`gallery_media_ids` json NOT NULL,
	`attributes` json NOT NULL,
	`featured` boolean NOT NULL DEFAULT false,
	`status` enum('DRAFT','PUBLISHED','OFFLINE') NOT NULL DEFAULT 'DRAFT',
	`sort_order` int NOT NULL DEFAULT 0,
	`seo_title` varchar(255),
	`seo_description` varchar(500),
	`published_at` datetime,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_contents_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_contents_tenant_kind_slug_uidx` UNIQUE(`tenant_id`,`kind`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `cms_navigations` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`label` varchar(100) NOT NULL,
	`location` enum('HEADER','FOOTER') NOT NULL DEFAULT 'HEADER',
	`link_type` enum('PAGE','URL') NOT NULL DEFAULT 'PAGE',
	`page_id` varchar(36),
	`url` varchar(500),
	`target` enum('SELF','BLANK') NOT NULL DEFAULT 'SELF',
	`sort_order` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_navigations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_pages` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`summary` varchar(500),
	`cover_media_id` varchar(36),
	`blocks` json NOT NULL,
	`seo_title` varchar(255),
	`seo_description` varchar(500),
	`status` enum('DRAFT','PUBLISHED','OFFLINE') NOT NULL DEFAULT 'DRAFT',
	`is_home` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_pages_tenant_slug_uidx` UNIQUE(`tenant_id`,`slug`)
);
--> statement-breakpoint
CREATE INDEX `cms_categories_parent_idx` ON `cms_categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `cms_contents_category_idx` ON `cms_contents` (`category_id`);--> statement-breakpoint
CREATE INDEX `cms_contents_status_idx` ON `cms_contents` (`tenant_id`,`kind`,`status`);--> statement-breakpoint
CREATE INDEX `cms_navigation_tenant_idx` ON `cms_navigations` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `cms_navigation_parent_idx` ON `cms_navigations` (`parent_id`);--> statement-breakpoint
CREATE INDEX `cms_pages_status_idx` ON `cms_pages` (`tenant_id`,`status`);
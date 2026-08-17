CREATE TABLE `cms_media` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`storage_name` varchar(255) NOT NULL,
	`relative_path` varchar(1000) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`extension` varchar(20) NOT NULL,
	`size` bigint unsigned NOT NULL,
	`alt_text` varchar(255),
	`created_by` varchar(36) NOT NULL,
	`deleted_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_site_settings` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`site_name` varchar(120) NOT NULL,
	`company_name` varchar(160) NOT NULL,
	`slogan` varchar(255),
	`description` text,
	`logo_media_id` varchar(36),
	`phone` varchar(50),
	`email` varchar(255),
	`address` varchar(500),
	`footer_text` varchar(500),
	`seo_title` varchar(255),
	`seo_description` varchar(500),
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_site_settings_tenant_uidx` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE INDEX `cms_media_tenant_idx` ON `cms_media` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `cms_media_org_idx` ON `cms_media` (`organization_id`);--> statement-breakpoint
CREATE INDEX `cms_media_created_idx` ON `cms_media` (`created_at`);
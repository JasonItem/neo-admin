CREATE TABLE `login_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36),
	`username` varchar(64) NOT NULL,
	`event` enum('SUCCESS','FAILURE','LOGOUT') NOT NULL,
	`reason` varchar(255),
	`ip_address` varchar(64),
	`user_agent` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `login_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`name` varchar(100) NOT NULL,
	`type` enum('DIRECTORY','MENU','BUTTON') NOT NULL,
	`path` varchar(255),
	`icon` varchar(64),
	`permission_code` varchar(128),
	`component` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`enabled` boolean NOT NULL DEFAULT true,
	`open_mode` enum('INTERNAL','EMBED','EXTERNAL') NOT NULL DEFAULT 'INTERNAL',
	`metadata` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `menu_items_permission_uidx` UNIQUE(`permission_code`)
);
--> statement-breakpoint
CREATE TABLE `operation_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`actor_id` varchar(36),
	`module` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`resource_type` varchar(64),
	`resource_id` varchar(64),
	`method` varchar(12) NOT NULL,
	`path` varchar(500) NOT NULL,
	`success` boolean NOT NULL,
	`detail` json,
	`ip_address` varchar(64),
	`user_agent` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `operation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`name` varchar(100) NOT NULL,
	`code` varchar(64) NOT NULL,
	`type` enum('COMPANY','DEPARTMENT','TEAM') NOT NULL,
	`path` varchar(1000) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `role_menu_items` (
	`role_id` varchar(36) NOT NULL,
	`menu_item_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `role_menu_items_role_id_menu_item_id_pk` PRIMARY KEY(`role_id`,`menu_item_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(64) NOT NULL,
	`description` varchar(500),
	`data_scope` enum('SELF','SAME_ORG','ORG_TREE','ALL') NOT NULL DEFAULT 'SELF',
	`enabled` boolean NOT NULL DEFAULT true,
	`built_in` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ip_address` varchar(64),
	`user_agent` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_uidx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` varchar(36) NOT NULL,
	`role_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_roles_user_id_role_id_pk` PRIMARY KEY(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`display_name` varchar(100) NOT NULL,
	`email` varchar(255),
	`phone` varchar(32),
	`avatar_url` varchar(500),
	`gender` enum('UNKNOWN','MALE','FEMALE') NOT NULL DEFAULT 'UNKNOWN',
	`enabled` boolean NOT NULL DEFAULT true,
	`last_login_at` datetime,
	`password_changed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_uidx` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `login_logs_user_idx` ON `login_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `login_logs_created_idx` ON `login_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `menu_items_parent_idx` ON `menu_items` (`parent_id`);--> statement-breakpoint
CREATE INDEX `operation_logs_actor_idx` ON `operation_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `operation_logs_created_idx` ON `operation_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `organizations_parent_idx` ON `organizations` (`parent_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`organization_id`);

CREATE TABLE `workspace_menu_items` (
	`workspace_id` varchar(36) NOT NULL,
	`menu_item_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_menu_items_workspace_id_menu_item_id_pk` PRIMARY KEY(`workspace_id`,`menu_item_id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`layout` enum('SIDEBAR','TOP') NOT NULL DEFAULT 'SIDEBAR',
	`is_default` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `workspace_menu_items_menu_idx` ON `workspace_menu_items` (`menu_item_id`);--> statement-breakpoint
CREATE INDEX `workspaces_user_idx` ON `workspaces` (`user_id`);
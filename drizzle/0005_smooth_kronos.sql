CREATE TABLE `user_appearance_preferences` (
	`user_id` varchar(36) NOT NULL,
	`layout` enum('SIDEBAR','TOP') NOT NULL DEFAULT 'SIDEBAR',
	`theme` enum('SYSTEM','LIGHT','DARK') NOT NULL DEFAULT 'SYSTEM',
	`density` enum('COMFORTABLE','COMPACT') NOT NULL DEFAULT 'COMFORTABLE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_appearance_preferences_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `workspaces` DROP COLUMN `layout`;
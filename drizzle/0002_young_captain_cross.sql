CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT INTO `tenants` (`id`, `name`, `code`, `enabled`)
SELECT `id`, `name`, `code`, `enabled`
FROM `organizations`
WHERE `type` = 'COMPANY';
--> statement-breakpoint
ALTER TABLE `organizations` ADD `tenant_id` varchar(36);
--> statement-breakpoint
CREATE TEMPORARY TABLE `organization_tenant_map` AS
SELECT `organization`.`id` AS `organization_id`, `company`.`id` AS `tenant_id`
FROM `organizations` AS `organization`
INNER JOIN `organizations` AS `company`
	ON `company`.`type` = 'COMPANY'
	AND (`organization`.`path` = `company`.`path` OR `organization`.`path` LIKE CONCAT(`company`.`path`, '/%'))
WHERE NOT EXISTS (
	SELECT 1
	FROM `organizations` AS `deeper_company`
	WHERE `deeper_company`.`type` = 'COMPANY'
		AND `deeper_company`.`id` <> `company`.`id`
		AND `deeper_company`.`path` LIKE CONCAT(`company`.`path`, '/%')
		AND (`organization`.`path` = `deeper_company`.`path` OR `organization`.`path` LIKE CONCAT(`deeper_company`.`path`, '/%'))
);
--> statement-breakpoint
UPDATE `organizations` AS `organization`
INNER JOIN `organization_tenant_map` AS `mapping` ON `mapping`.`organization_id` = `organization`.`id`
SET `organization`.`tenant_id` = `mapping`.`tenant_id`;
--> statement-breakpoint
DROP TEMPORARY TABLE `organization_tenant_map`;
--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` varchar(36);
--> statement-breakpoint
UPDATE `users` AS `user`
INNER JOIN `organizations` AS `organization` ON `organization`.`id` = `user`.`organization_id`
SET `user`.`tenant_id` = `organization`.`tenant_id`;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;
--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `data_scope` enum('SELF','SAME_ORG','ORG_TREE','ALL','CURRENT_ORG','ORG_SUBTREE','TENANT','PLATFORM') NOT NULL DEFAULT 'SELF';
--> statement-breakpoint
UPDATE `roles` SET `data_scope` = CASE
	WHEN `code` = 'SUPER_ADMIN' THEN 'PLATFORM'
	WHEN `data_scope` = 'SAME_ORG' THEN 'CURRENT_ORG'
	WHEN `data_scope` = 'ORG_TREE' THEN 'ORG_SUBTREE'
	WHEN `data_scope` = 'ALL' THEN 'TENANT'
	ELSE `data_scope`
END;
--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `data_scope` enum('SELF','CURRENT_ORG','ORG_SUBTREE','TENANT','PLATFORM') NOT NULL DEFAULT 'SELF';
--> statement-breakpoint
ALTER TABLE `roles` ADD `tenant_id` varchar(36);
--> statement-breakpoint
UPDATE `roles` AS `role`
INNER JOIN (
	SELECT `assignment`.`role_id`, MIN(`user`.`tenant_id`) AS `tenant_id`
	FROM `user_roles` AS `assignment`
	INNER JOIN `users` AS `user` ON `user`.`id` = `assignment`.`user_id`
	GROUP BY `assignment`.`role_id`
) AS `role_tenant` ON `role_tenant`.`role_id` = `role`.`id`
SET `role`.`tenant_id` = IF(`role`.`code` = 'SUPER_ADMIN', NULL, `role_tenant`.`tenant_id`);
--> statement-breakpoint
ALTER TABLE `role_menu_items` ADD `data_scope` enum('SELF','CURRENT_ORG','ORG_SUBTREE','TENANT','PLATFORM') DEFAULT 'SELF' NOT NULL;
--> statement-breakpoint
UPDATE `role_menu_items` AS `grant`
INNER JOIN `roles` AS `role` ON `role`.`id` = `grant`.`role_id`
SET `grant`.`data_scope` = `role`.`data_scope`;
--> statement-breakpoint
ALTER TABLE `user_roles` ADD `tenant_id` varchar(36);
--> statement-breakpoint
ALTER TABLE `user_roles` ADD `anchor_organization_id` varchar(36);
--> statement-breakpoint
UPDATE `user_roles` AS `assignment`
INNER JOIN `users` AS `user` ON `user`.`id` = `assignment`.`user_id`
SET `assignment`.`tenant_id` = `user`.`tenant_id`, `assignment`.`anchor_organization_id` = `user`.`organization_id`;
--> statement-breakpoint
ALTER TABLE `user_roles` MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_roles` MODIFY COLUMN `anchor_organization_id` varchar(36) NOT NULL;
--> statement-breakpoint
CREATE INDEX `organizations_tenant_idx` ON `organizations` (`tenant_id`);
--> statement-breakpoint
CREATE INDEX `roles_tenant_idx` ON `roles` (`tenant_id`);
--> statement-breakpoint
CREATE INDEX `user_roles_tenant_idx` ON `user_roles` (`tenant_id`);
--> statement-breakpoint
CREATE INDEX `user_roles_anchor_org_idx` ON `user_roles` (`anchor_organization_id`);
--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`);

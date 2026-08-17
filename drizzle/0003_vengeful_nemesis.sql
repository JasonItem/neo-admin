ALTER TABLE `organizations` MODIFY COLUMN `tenant_id` varchar(36);--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `type` enum('GROUP','COMPANY','BRANCH','DEPARTMENT','TEAM') NOT NULL;--> statement-breakpoint
UPDATE `organizations` AS `organization`
SET `organization`.`type` = 'GROUP', `organization`.`tenant_id` = NULL
WHERE `organization`.`code` = 'SUPPLIER'
	AND `organization`.`type` = 'COMPANY'
	AND NOT EXISTS (SELECT 1 FROM `users` WHERE `users`.`tenant_id` = `organization`.`id`)
	AND NOT EXISTS (SELECT 1 FROM `roles` WHERE `roles`.`tenant_id` = `organization`.`id`);--> statement-breakpoint
DELETE `tenant`
FROM `tenants` AS `tenant`
LEFT JOIN `organizations` AS `organization` ON `organization`.`tenant_id` = `tenant`.`id`
LEFT JOIN `users` AS `user` ON `user`.`tenant_id` = `tenant`.`id`
LEFT JOIN `roles` AS `role` ON `role`.`tenant_id` = `tenant`.`id`
WHERE `organization`.`id` IS NULL
	AND `user`.`id` IS NULL
	AND `role`.`id` IS NULL;

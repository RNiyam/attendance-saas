CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` bigint unsigned,
	`actor_user_id` bigint unsigned,
	`action` varchar(120) NOT NULL,
	`entity_type` varchar(120) NOT NULL,
	`entity_id` varchar(120) NOT NULL,
	`before_data` text,
	`after_data` text,
	`request_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `activity_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` bigint unsigned,
	`user_id` bigint unsigned,
	`activity_type` varchar(120) NOT NULL,
	`metadata` text,
	`ip_address` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);

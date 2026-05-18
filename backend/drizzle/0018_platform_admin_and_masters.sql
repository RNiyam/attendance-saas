CREATE TABLE `platform_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`display_name` varchar(150) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_admins_email_uidx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `ref_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(8) NOT NULL,
	`name` varchar(120) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `ref_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_states_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ref_cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`state_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `ref_cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_cities_state_name_uidx` UNIQUE(`state_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `ref_sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(128) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `ref_sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_sectors_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ref_sub_sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sector_id` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(128) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `ref_sub_sectors_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_sub_sectors_sector_code_uidx` UNIQUE(`sector_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `platform_enum_masters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enum_type` varchar(64) NOT NULL,
	`code` varchar(64) NOT NULL,
	`label` varchar(150) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `platform_enum_masters_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_enum_type_code_uidx` UNIQUE(`enum_type`,`code`)
);
--> statement-breakpoint
ALTER TABLE `ref_cities` ADD CONSTRAINT `ref_cities_state_fk` FOREIGN KEY (`state_id`) REFERENCES `ref_states`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `ref_sub_sectors` ADD CONSTRAINT `ref_sub_sectors_sector_fk` FOREIGN KEY (`sector_id`) REFERENCES `ref_sectors`(`id`) ON DELETE cascade ON UPDATE no action;

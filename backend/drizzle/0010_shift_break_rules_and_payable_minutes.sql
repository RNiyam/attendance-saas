CREATE TABLE `shift_breaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`shift_id` int NOT NULL,
	`category` ENUM('shift_break','casual_break') NOT NULL DEFAULT 'shift_break',
	`break_name` varchar(120) NOT NULL,
	`pay_type` ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid',
	`rule_type` ENUM('interval','duration') NOT NULL DEFAULT 'interval',
	`duration_minutes` int,
	`start_time` time,
	`end_time` time,
	`buffer_start_time` time,
	`buffer_end_time` time,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_breaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shift_breaks` ADD CONSTRAINT `shift_breaks_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `shift_breaks` ADD CONSTRAINT `shift_breaks_shift_id_shifts_id_fk` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `payable_duration_minutes` int;
--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `unpaid_break_minutes` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `attendance_breaks` ADD `shift_break_id` int;
--> statement-breakpoint
ALTER TABLE `attendance_breaks` ADD `category` varchar(40);
--> statement-breakpoint
ALTER TABLE `attendance_breaks` ADD `pay_type` varchar(20);
--> statement-breakpoint
ALTER TABLE `attendance_breaks` ADD `rule_type` varchar(20);
--> statement-breakpoint
ALTER TABLE `attendance_breaks` ADD CONSTRAINT `attendance_breaks_shift_break_id_shift_breaks_id_fk` FOREIGN KEY (`shift_break_id`) REFERENCES `shift_breaks`(`id`) ON DELETE set null ON UPDATE no action;

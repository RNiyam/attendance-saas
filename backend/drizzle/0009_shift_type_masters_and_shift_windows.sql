CREATE TABLE `shift_type_masters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`label` varchar(120) NOT NULL,
	`description` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `shift_type_masters_id` PRIMARY KEY(`id`),
	CONSTRAINT `shift_type_masters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT IGNORE INTO `shift_type_masters` (`code`, `label`, `description`, `sort_order`) VALUES
	('fixed', 'Fixed Shift', 'Same clock-in and clock-out each day', 10),
	('open', 'Open Shift', 'Flexible within a wider window', 20),
	('rotational', 'Rotational Shift', 'Pattern that rotates across teams', 30),
	('flexible', 'Flexible Shift', 'Flexible hours with optional core time', 40);
--> statement-breakpoint
ALTER TABLE `shifts` ADD `shift_code` varchar(40);
--> statement-breakpoint
ALTER TABLE `shifts` ADD `earliest_punch_in` time;
--> statement-breakpoint
ALTER TABLE `shifts` ADD `latest_punch_out` time;
--> statement-breakpoint
ALTER TABLE `shifts` MODIFY `shift_type` ENUM('fixed', 'flexible', 'open', 'rotational') NOT NULL DEFAULT 'fixed';

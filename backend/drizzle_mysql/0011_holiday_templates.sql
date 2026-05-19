CREATE TABLE `holiday_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holiday_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holiday_template_holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`template_id` int NOT NULL,
	`holiday_name` varchar(150) NOT NULL,
	`holiday_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holiday_template_holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holiday_template_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`template_id` int NOT NULL,
	`assignment_type` ENUM('organization','branch','department','employee','shift') NOT NULL DEFAULT 'organization',
	`assignment_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `holiday_template_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `holiday_templates` ADD CONSTRAINT `holiday_templates_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `holiday_template_holidays` ADD CONSTRAINT `holiday_template_holidays_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `holiday_template_holidays` ADD CONSTRAINT `holiday_template_holidays_template_id_holiday_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `holiday_templates`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `holiday_template_assignments` ADD CONSTRAINT `holiday_template_assignments_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `holiday_template_assignments` ADD CONSTRAINT `holiday_template_assignments_template_id_holiday_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `holiday_templates`(`id`) ON DELETE cascade ON UPDATE no action;

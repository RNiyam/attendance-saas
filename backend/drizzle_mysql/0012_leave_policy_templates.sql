CREATE TABLE `leave_policy_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_policy_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_policy_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`template_id` int NOT NULL,
	`leave_name` varchar(100) NOT NULL,
	`leave_code` varchar(30) NOT NULL,
	`annual_quota` decimal(8,2) NOT NULL DEFAULT '0',
	`is_paid` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_policy_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_policy_template_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`template_id` int NOT NULL,
	`assignment_type` ENUM('organization','branch','department','employee','shift') NOT NULL DEFAULT 'organization',
	`assignment_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leave_policy_template_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leave_policy_templates` ADD CONSTRAINT `lp_tpl_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_template_items` ADD CONSTRAINT `lp_item_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_template_items` ADD CONSTRAINT `lp_item_tpl_fk` FOREIGN KEY (`template_id`) REFERENCES `leave_policy_templates`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_template_assignments` ADD CONSTRAINT `lp_asgn_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_template_assignments` ADD CONSTRAINT `lp_asgn_tpl_fk` FOREIGN KEY (`template_id`) REFERENCES `leave_policy_templates`(`id`) ON DELETE cascade ON UPDATE no action;

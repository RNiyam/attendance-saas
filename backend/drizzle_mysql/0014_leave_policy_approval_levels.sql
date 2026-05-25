CREATE TABLE `leave_policy_approval_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`template_id` int NOT NULL,
	`level_order` int NOT NULL DEFAULT 1,
	`min_approvers_required` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_policy_approval_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_policy_approval_approvers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`level_id` int NOT NULL,
	`approver_type` ENUM('owner','admin','restricted_admin','attendance_supervisors','reporting_manager') NOT NULL,
	`approver_name` varchar(150) NOT NULL DEFAULT 'Any Admin',
	`substitute_enabled` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leave_policy_approval_approvers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leave_policy_approval_levels` ADD CONSTRAINT `lp_ap_lvl_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_approval_levels` ADD CONSTRAINT `lp_ap_lvl_tpl_fk` FOREIGN KEY (`template_id`) REFERENCES `leave_policy_templates`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_approval_approvers` ADD CONSTRAINT `lp_ap_apr_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leave_policy_approval_approvers` ADD CONSTRAINT `lp_ap_apr_lvl_fk` FOREIGN KEY (`level_id`) REFERENCES `leave_policy_approval_levels`(`id`) ON DELETE cascade ON UPDATE no action;

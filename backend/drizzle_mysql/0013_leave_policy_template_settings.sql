ALTER TABLE `leave_policy_templates`
  ADD COLUMN `policy_cycle` ENUM('yearly','monthly','quarterly') NOT NULL DEFAULT 'yearly' AFTER `end_date`,
  ADD COLUMN `unpaid_leave_enabled` int NOT NULL DEFAULT 1 AFTER `policy_cycle`,
  ADD COLUMN `count_sandwich_leaves` int NOT NULL DEFAULT 0 AFTER `unpaid_leave_enabled`,
  ADD COLUMN `approval_levels_json` text NULL AFTER `count_sandwich_leaves`;
--> statement-breakpoint
ALTER TABLE `leave_policy_template_items`
  ADD COLUMN `accrual_period` ENUM('all_at_once','monthly','quarterly','na') NOT NULL DEFAULT 'all_at_once' AFTER `is_paid`,
  ADD COLUMN `is_system` int NOT NULL DEFAULT 0 AFTER `accrual_period`,
  ADD COLUMN `custom_fields_count` int NOT NULL DEFAULT 0 AFTER `is_system`,
  ADD COLUMN `sort_order` int NOT NULL DEFAULT 0 AFTER `custom_fields_count`;

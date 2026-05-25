ALTER TABLE `employees`
  MODIFY `employment_type` varchar(32) NOT NULL DEFAULT 'FULL_TIME';
--> statement-breakpoint
UPDATE `employees` SET `employment_type` = CASE `employment_type`
  WHEN 'full_time' THEN 'FULL_TIME'
  WHEN 'part_time' THEN 'PART_TIME'
  WHEN 'contract' THEN 'CONTRACTOR'
  WHEN 'intern' THEN 'INTERN'
  ELSE `employment_type`
END;
--> statement-breakpoint
ALTER TABLE `employees`
  MODIFY `employment_type` ENUM('FULL_TIME','PART_TIME','CONTRACTOR','WORK_BASIS','INTERN','PROBATION') NOT NULL DEFAULT 'FULL_TIME',
  ADD COLUMN `work_email` varchar(255) AFTER `employee_code`,
  ADD COLUMN `phone` varchar(32) AFTER `work_email`,
  ADD COLUMN `manager_name` varchar(150) AFTER `work_location`,
  ADD COLUMN `weekly_off_policy` varchar(120) AFTER `manager_name`,
  ADD COLUMN `ctc` decimal(12,2) AFTER `weekly_off_policy`,
  ADD COLUMN `salary_structure` varchar(120) AFTER `ctc`,
  ADD COLUMN `bank_account_number` varchar(64) AFTER `salary_structure`,
  ADD COLUMN `bank_ifsc` varchar(20) AFTER `bank_account_number`,
  ADD COLUMN `pan` varchar(20) AFTER `bank_ifsc`,
  ADD COLUMN `aadhaar` varchar(20) AFTER `pan`,
  ADD COLUMN `pf_number` varchar(64) AFTER `aadhaar`,
  ADD COLUMN `esi_number` varchar(64) AFTER `pf_number`,
  ADD COLUMN `work_hours_per_week` decimal(6,2) AFTER `esi_number`,
  ADD COLUMN `hourly_rate` decimal(10,2) AFTER `work_hours_per_week`,
  ADD COLUMN `prorated_salary_percent` decimal(5,2) AFTER `hourly_rate`,
  ADD COLUMN `contract_start` date AFTER `prorated_salary_percent`,
  ADD COLUMN `contract_end` date AFTER `contract_start`,
  ADD COLUMN `vendor_company` varchar(150) AFTER `contract_end`,
  ADD COLUMN `billing_cycle` ENUM('weekly','monthly','project','milestone') AFTER `vendor_company`,
  ADD COLUMN `invoice_amount` decimal(12,2) AFTER `billing_cycle`,
  ADD COLUMN `daily_wage` decimal(10,2) AFTER `invoice_amount`,
  ADD COLUMN `work_unit` ENUM('day','hour','piece') AFTER `daily_wage`,
  ADD COLUMN `supervisor` varchar(150) AFTER `work_unit`,
  ADD COLUMN `internship_start` date AFTER `supervisor`,
  ADD COLUMN `internship_end` date AFTER `internship_start`,
  ADD COLUMN `mentor` varchar(150) AFTER `internship_end`,
  ADD COLUMN `stipend` decimal(10,2) AFTER `mentor`,
  ADD COLUMN `college` varchar(180) AFTER `stipend`,
  ADD COLUMN `probation_start` date AFTER `college`,
  ADD COLUMN `probation_end` date AFTER `probation_start`,
  ADD COLUMN `confirmation_date` date AFTER `probation_end`,
  ADD COLUMN `onboarding_notes` text AFTER `confirmation_date`;
--> statement-breakpoint
CREATE TABLE `employee_attendance_policy_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organization_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `attendance_policy_id` int NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `employee_attendance_policy_assignments_id` PRIMARY KEY(`id`),
  CONSTRAINT `employee_attendance_policy_unique` UNIQUE(`organization_id`,`employee_id`,`attendance_policy_id`,`effective_from`)
);
--> statement-breakpoint
CREATE TABLE `salary_templates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organization_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(500),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `salary_templates_id` PRIMARY KEY(`id`),
  CONSTRAINT `salary_templates_org_name_uidx` UNIQUE(`organization_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `employee_salary_template_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organization_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `salary_template_id` int NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `employee_salary_template_assignments_id` PRIMARY KEY(`id`),
  CONSTRAINT `employee_salary_template_unique` UNIQUE(`organization_id`,`employee_id`,`salary_template_id`,`effective_from`)
);
--> statement-breakpoint
ALTER TABLE `employee_attendance_policy_assignments` ADD CONSTRAINT `emp_att_pol_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employee_attendance_policy_assignments` ADD CONSTRAINT `emp_att_pol_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employee_attendance_policy_assignments` ADD CONSTRAINT `emp_att_pol_policy_fk` FOREIGN KEY (`attendance_policy_id`) REFERENCES `attendance_policies`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `salary_templates` ADD CONSTRAINT `salary_templates_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employee_salary_template_assignments` ADD CONSTRAINT `emp_salary_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employee_salary_template_assignments` ADD CONSTRAINT `emp_salary_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employee_salary_template_assignments` ADD CONSTRAINT `emp_salary_template_fk` FOREIGN KEY (`salary_template_id`) REFERENCES `salary_templates`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `employees`
  MODIFY `employment_type` varchar(32) NOT NULL DEFAULT 'FULL_TIME';
--> statement-breakpoint
UPDATE `employees`
SET `employment_type` = 'FULL_TIME'
WHERE `employment_type` IN ('CONTRACTOR', 'WORK_BASIS', 'contract', 'work_basis');
--> statement-breakpoint
UPDATE `employees`
SET `employment_type` = CASE `employment_type`
  WHEN 'full_time' THEN 'FULL_TIME'
  WHEN 'part_time' THEN 'PART_TIME'
  WHEN 'intern' THEN 'INTERN'
  ELSE `employment_type`
END;
--> statement-breakpoint
ALTER TABLE `employees`
  MODIFY `employment_type` ENUM('FULL_TIME','PART_TIME','INTERN','PROBATION') NOT NULL DEFAULT 'FULL_TIME';

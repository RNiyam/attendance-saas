ALTER TABLE `organizations`
	ADD `region_state` varchar(100),
	ADD `region_city` varchar(150),
	ADD `business_sector` varchar(128),
	ADD `business_sub_sector` varchar(128),
	ADD `employee_count_band` varchar(32);
--> statement-breakpoint
ALTER TABLE `users`
	ADD `first_name` varchar(100),
	ADD `last_name` varchar(100);

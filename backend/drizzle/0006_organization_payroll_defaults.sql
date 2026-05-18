ALTER TABLE `organizations`
	ADD `payable_days_policy` varchar(32) NOT NULL DEFAULT 'calendar_month',
	ADD `standard_workday_minutes` int NOT NULL DEFAULT 480;

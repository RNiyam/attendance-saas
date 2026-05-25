CREATE TABLE `smtp_configurations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`host` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_encrypted` text NOT NULL,
	`from_email` varchar(255) NOT NULL,
	`from_name` varchar(255) NOT NULL,
	`secure` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtp_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `smtp_configurations_org_uidx` UNIQUE(`organization_id`),
	CONSTRAINT `smtp_configurations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action
);

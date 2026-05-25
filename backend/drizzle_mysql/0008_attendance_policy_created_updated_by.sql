ALTER TABLE `attendance_policies`
ADD COLUMN `created_by_user_id` int NULL,
ADD COLUMN `updated_by_user_id` int NULL;
--> statement-breakpoint
ALTER TABLE `attendance_policies`
ADD CONSTRAINT `attendance_policies_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE `attendance_policies`
ADD CONSTRAINT `attendance_policies_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

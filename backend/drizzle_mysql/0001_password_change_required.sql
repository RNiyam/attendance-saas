ALTER TABLE `users`
  ADD COLUMN `password_change_required` boolean NOT NULL DEFAULT false AFTER `password_hash`,
  ADD COLUMN `temporary_password_expires_at` timestamp AFTER `password_change_required`;

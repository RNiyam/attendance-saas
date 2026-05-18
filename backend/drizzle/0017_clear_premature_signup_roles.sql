-- Users were incorrectly assigned OWNER at signup before personal-details onboarding.
DELETE ur FROM `user_roles` ur
INNER JOIN `users` u ON u.`id` = ur.`user_id`
INNER JOIN `organizations` o ON o.`id` = u.`organization_id`
WHERE o.`legal_name` IS NULL;

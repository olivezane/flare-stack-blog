ALTER TABLE `account` ADD `issuer` text;
--> statement-breakpoint
-- Backfill issuer per better-auth 1.7 upgrade guide:
-- https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-is-scoped-by-issuer
UPDATE `account` SET `issuer` = 'local:credential' WHERE `provider_id` = 'credential' AND `issuer` IS NULL;
--> statement-breakpoint
UPDATE `account` SET `issuer` = 'local:oauth:' || `provider_id` WHERE `issuer` IS NULL;

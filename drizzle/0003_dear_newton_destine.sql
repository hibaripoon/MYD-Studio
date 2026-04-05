ALTER TABLE `tasks` ADD `idempotencyKey` varchar(64);--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_idempotencyKey_unique` UNIQUE(`idempotencyKey`);
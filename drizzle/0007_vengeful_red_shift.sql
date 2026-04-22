CREATE TABLE `meeting_notes` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`authorId` varchar(32) NOT NULL,
	`authorName` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meeting_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `taskType` enum('task','meeting') DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `dueDate` varchar(16);--> statement-breakpoint
ALTER TABLE `tasks` ADD `dueTime` varchar(8);--> statement-breakpoint
ALTER TABLE `tasks` ADD `endDate` varchar(16);--> statement-breakpoint
CREATE INDEX `meeting_notes_task_id_idx` ON `meeting_notes` (`taskId`);
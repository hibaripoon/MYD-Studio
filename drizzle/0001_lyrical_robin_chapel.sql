CREATE TABLE `activity_logs` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`type` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`authorName` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` varchar(32) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`password` varchar(128) NOT NULL,
	`role` enum('company','customer') NOT NULL,
	`companyRole` enum('admin','sub_admin','head','ae'),
	`name` varchar(128) NOT NULL,
	`avatarInitials` varchar(8) NOT NULL,
	`avatarColor` varchar(32) NOT NULL,
	`aeId` varchar(32),
	`email` varchar(320),
	`profilePhoto` text,
	`bankAccount` varchar(64),
	`bankName` varchar(64),
	`customerId` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `cash_collections` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`amount` decimal(15,2) NOT NULL DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'THB',
	`status` enum('unpaid','invoiced','partial','paid') NOT NULL DEFAULT 'unpaid',
	`invoiceNumber` varchar(64),
	`invoiceDate` varchar(16),
	`dueDate` varchar(16),
	`paidDate` varchar(16),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cash_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `cash_collections_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(32) NOT NULL,
	`brandName` varchar(256) NOT NULL,
	`type` enum('SME','Agency','Brand') NOT NULL,
	`contactName` varchar(128),
	`contactPhone` varchar(20),
	`contactEmail` varchar(320),
	`taxCompanyName` varchar(256),
	`taxAddress` text,
	`taxId` varchar(32),
	`avatarInitials` varchar(8) NOT NULL,
	`avatarColor` varchar(32) NOT NULL,
	`profilePhoto` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_documents` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`docType` enum('QT','BL','INV','PO','other') NOT NULL,
	`otherLabel` varchar(128),
	`docDate` varchar(16),
	`fileUrl` text,
	`fileName` varchar(256),
	`note` text,
	`createdBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_tasks` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`title` varchar(512) NOT NULL,
	`done` boolean NOT NULL DEFAULT false,
	`completedAt` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internal_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_items` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`mediaName` varchar(128) NOT NULL,
	`productType` varchar(128) NOT NULL,
	`amount` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenue_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`authorId` varchar(32) NOT NULL,
	`authorName` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(32) NOT NULL,
	`customerId` varchar(32) NOT NULL,
	`title` varchar(512) NOT NULL,
	`contactName` varchar(128) NOT NULL,
	`contactPhone` varchar(20),
	`contactEmail` varchar(320),
	`aeId` varchar(32),
	`aeName` varchar(128),
	`status` enum('pending','in_progress','review','done','cancelled') NOT NULL DEFAULT 'pending',
	`brief` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` varchar(32) NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','review','done','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` varchar(16),
	`completedAt` varchar(32),
	`evidence` json DEFAULT ('[]'),
	`evidenceNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_items_id` PRIMARY KEY(`id`)
);

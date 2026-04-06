CREATE INDEX `activity_logs_task_id_idx` ON `activity_logs` (`taskId`);--> statement-breakpoint
CREATE INDEX `financial_documents_task_id_idx` ON `financial_documents` (`taskId`);--> statement-breakpoint
CREATE INDEX `internal_tasks_task_id_idx` ON `internal_tasks` (`taskId`);--> statement-breakpoint
CREATE INDEX `revenue_items_task_id_idx` ON `revenue_items` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_comments_task_id_idx` ON `task_comments` (`taskId`);--> statement-breakpoint
CREATE INDEX `tasks_customer_id_idx` ON `tasks` (`customerId`);--> statement-breakpoint
CREATE INDEX `tasks_ae_id_idx` ON `tasks` (`aeId`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `work_items_task_id_idx` ON `work_items` (`taskId`);
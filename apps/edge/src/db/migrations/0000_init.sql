CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`avatar_url` text,
	`color` text,
	`api_token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`hands_played` integer DEFAULT 0 NOT NULL,
	`hands_won` integer DEFAULT 0 NOT NULL,
	`total_winnings` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_api_token_hash_unique` ON `agents` (`api_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_agents_user` ON `agents` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_agents_user_name` ON `agents` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`replay_id` text NOT NULL,
	`label` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `replay_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`replay_id`) REFERENCES `replays`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`follower_id` text NOT NULL,
	`followee_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`follower_id`, `followee_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`followee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_follows_followee` ON `follows` (`followee_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `replays` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`room` text NOT NULL,
	`room_kind` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`hands_count` integer NOT NULL,
	`events_json` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`truncated` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_replays_user` ON `replays` (`user_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`bio` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
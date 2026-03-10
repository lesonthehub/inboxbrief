CREATE TABLE `briefing_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailAccountId` int,
	`emailsFetched` int NOT NULL DEFAULT 0,
	`highPriorityCount` int NOT NULL DEFAULT 0,
	`generalCount` int NOT NULL DEFAULT 0,
	`ignoredCount` int NOT NULL DEFAULT 0,
	`encryptedSummary` text,
	`smsStatus` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`smsMessageSid` varchar(64),
	`triggerType` enum('manual','scheduled') NOT NULL DEFAULT 'manual',
	`planAtTime` enum('trial','starter','pro','business') NOT NULL DEFAULT 'trial',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `briefing_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('gmail','outlook') NOT NULL,
	`emailAddress` varchar(320) NOT NULL,
	`encryptedAccessToken` text NOT NULL,
	`encryptedRefreshToken` text,
	`tokenExpiresAt` timestamp,
	`lastProcessedEmailId` text,
	`lastFetchedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`plan` enum('trial','starter','pro','business') NOT NULL DEFAULT 'trial',
	`status` enum('active','trialing','past_due','canceled','incomplete','unpaid') NOT NULL DEFAULT 'trialing',
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `businessType` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVolume` enum('under_50','50_200','200_500','over_500');--> statement-breakpoint
ALTER TABLE `users` ADD `primaryGoal` enum('lead_tracking','client_updates','general_inbox','all_of_above');--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingComplete` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `scheduleType` enum('manual','daily_morning','daily_evening','twice_daily','custom') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `scheduleTimes` varchar(255) DEFAULT '08:00';--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64) DEFAULT 'America/Chicago';--> statement-breakpoint
ALTER TABLE `users` ADD `trialStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialUsed` boolean DEFAULT false NOT NULL;
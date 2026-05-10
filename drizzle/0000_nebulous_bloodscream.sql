CREATE TABLE `matches` (
	`match_id` text PRIMARY KEY NOT NULL,
	`game_creation` integer NOT NULL,
	`game_duration` integer NOT NULL,
	`game_version` text NOT NULL,
	`patch` text NOT NULL,
	`queue_id` integer NOT NULL,
	`win` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matchup` (
	`match_id` text PRIMARY KEY NOT NULL,
	`opponent_puuid` text,
	`opp_champion_id` integer NOT NULL,
	`opp_champion_name` text NOT NULL,
	`opp_kills` integer NOT NULL,
	`opp_deaths` integer NOT NULL,
	`opp_assists` integer NOT NULL,
	`opp_cs_total` integer NOT NULL,
	`opp_gold_total` integer NOT NULL,
	`opp_damage_to_champions` integer NOT NULL,
	`opp_cs_at_15` integer,
	`opp_gold_at_15` integer,
	`opp_level_at_15` integer,
	`cs_diff_at_15` integer,
	`gold_diff_at_15` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `my_build_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` text NOT NULL,
	`timestamp_ms` integer NOT NULL,
	`item_id` integer NOT NULL,
	`event_type` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `my_performance` (
	`match_id` text PRIMARY KEY NOT NULL,
	`champion_id` integer NOT NULL,
	`champion_name` text NOT NULL,
	`role` text NOT NULL,
	`team_id` integer NOT NULL,
	`kills` integer NOT NULL,
	`deaths` integer NOT NULL,
	`assists` integer NOT NULL,
	`cs_total` integer NOT NULL,
	`gold_total` integer NOT NULL,
	`damage_to_champions` integer NOT NULL,
	`vision_score` integer NOT NULL,
	`cs_at_15` integer,
	`gold_at_15` integer,
	`level_at_15` integer,
	`xp_at_15` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `my_skill_order` (
	`match_id` text NOT NULL,
	`level` integer NOT NULL,
	`skill_slot` integer NOT NULL,
	PRIMARY KEY(`match_id`, `level`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`match_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `raw_data` (
	`match_id` text NOT NULL,
	`data_type` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`match_id`, `data_type`)
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`matches_added` integer DEFAULT 0 NOT NULL,
	`matches_skipped` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`error_message` text
);

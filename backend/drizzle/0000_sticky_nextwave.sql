CREATE TYPE "public"."answer" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('food', 'science', 'sports', 'entertainment', 'family_life', 'hobbies', 'cultures', 'famous_people', 'world_records', 'planets', 'environment', 'plants', 'transportation', 'world_history', 'other');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category" "category" NOT NULL,
	"option_a_text" text NOT NULL,
	"option_a_value" text NOT NULL,
	"option_a_image" text,
	"option_b_text" text NOT NULL,
	"option_b_value" text NOT NULL,
	"option_b_image" text,
	"answer" "answer" NOT NULL,
	"answer_label" text NOT NULL,
	"explanation" text NOT NULL,
	"authored" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_slug_unique" UNIQUE("slug")
);

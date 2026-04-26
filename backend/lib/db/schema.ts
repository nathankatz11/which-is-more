import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
  "food",
  "science",
  "sports",
  "entertainment",
  "family_life",
  "hobbies",
  "cultures",
  "famous_people",
  "world_records",
  "planets",
  "environment",
  "plants",
  "transportation",
  "world_history",
  "other",
]);

export const answerEnum = pgEnum("answer", ["A", "B"]);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  category: categoryEnum("category").notNull(),
  optionAText: text("option_a_text").notNull(),
  optionAValue: text("option_a_value").notNull(),
  optionAImage: text("option_a_image"),
  optionAEmoji: text("option_a_emoji"),
  optionBText: text("option_b_text").notNull(),
  optionBValue: text("option_b_value").notNull(),
  optionBImage: text("option_b_image"),
  optionBEmoji: text("option_b_emoji"),
  answer: answerEnum("answer").notNull(),
  answerLabel: text("answer_label").notNull(),
  explanation: text("explanation").notNull(),
  authored: boolean("authored").notNull().default(false),
  needsReview: boolean("needs_review").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export const questionVotes = pgTable("question_votes", {
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  option: answerEnum("option").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.questionId, t.option] }),
}));

export type QuestionVote = typeof questionVotes.$inferSelect;

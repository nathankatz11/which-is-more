CREATE TABLE "question_votes" (
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "option" "answer" NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("question_id", "option")
);

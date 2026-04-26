import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { questions, categoryEnum, answerEnum } from "./schema";

describe("questions schema", () => {
  it("has the expected columns", () => {
    const cols = Object.keys(getTableColumns(questions));
    expect(cols.sort()).toEqual(
      [
        "id",
        "slug",
        "category",
        "optionAText",
        "optionAValue",
        "optionAImage",
        "optionAEmoji",
        "optionBText",
        "optionBValue",
        "optionBImage",
        "optionBEmoji",
        "answer",
        "answerLabel",
        "explanation",
        "authored",
        "needsReview",
        "createdAt",
        "updatedAt",
      ].sort()
    );
  });

  it("defines category enum with all expected values", () => {
    expect(categoryEnum.enumValues).toEqual([
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
  });

  it("defines answer enum with A and B", () => {
    expect(answerEnum.enumValues).toEqual(["A", "B"]);
  });
});

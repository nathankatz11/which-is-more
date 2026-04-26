"use client";

import { useState } from "react";
import Link from "next/link";
import { categoryEnum } from "@/lib/db/schema";

export type QuestionFormValues = {
  slug: string;
  category: (typeof categoryEnum.enumValues)[number];
  optionAText: string;
  optionAValue: string;
  optionAEmoji: string;
  optionAImage: string;
  optionBText: string;
  optionBValue: string;
  optionBEmoji: string;
  optionBImage: string;
  answer: "A" | "B";
  answerLabel: string;
  explanation: string;
  authored: boolean;
  needsReview: boolean;
};

export const emptyQuestion: QuestionFormValues = {
  slug: "",
  category: "other",
  optionAText: "",
  optionAValue: "",
  optionAEmoji: "",
  optionAImage: "",
  optionBText: "",
  optionBValue: "",
  optionBEmoji: "",
  optionBImage: "",
  answer: "A",
  answerLabel: "",
  explanation: "",
  authored: false,
  needsReview: true,
};

/// Shared add/edit form. `action` is a server action bound upstream.
export default function QuestionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  initial: QuestionFormValues;
  submitLabel: string;
}) {
  const [values, setValues] = useState(initial);

  const update = <K extends keyof QuestionFormValues>(key: K, v: QuestionFormValues[K]) =>
    setValues((s) => ({ ...s, [key]: v }));

  return (
    <form action={action} className="space-y-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OptionCardInput
          letter="A"
          text={values.optionAText}
          value={values.optionAValue}
          emoji={values.optionAEmoji}
          image={values.optionAImage}
          isAnswer={values.answer === "A"}
          onChange={(patch) => setValues((s) => ({ ...s, ...patch }))}
        />
        <OptionCardInput
          letter="B"
          text={values.optionBText}
          value={values.optionBValue}
          emoji={values.optionBEmoji}
          image={values.optionBImage}
          isAnswer={values.answer === "B"}
          onChange={(patch) => setValues((s) => ({ ...s, ...patch }))}
        />
      </div>

      {/* Which is correct */}
      <Card title="Correct answer">
        <div className="grid grid-cols-2 gap-3">
          <AnswerPill
            value="A"
            selected={values.answer === "A"}
            onClick={() => update("answer", "A")}
            labelText={values.optionAText || "Option A"}
          />
          <AnswerPill
            value="B"
            selected={values.answer === "B"}
            onClick={() => update("answer", "B")}
            labelText={values.optionBText || "Option B"}
          />
        </div>
        <Input
          name="answerLabel"
          label="Answer shout-out (appears in the reveal card)"
          value={values.answerLabel}
          onChange={(v) => update("answerLabel", v)}
          placeholder="PIZZA!"
          required
        />
      </Card>

      {/* Explanation */}
      <Card title="Explanation blurb">
        <Textarea
          name="explanation"
          label="The fact, in Alan's voice"
          value={values.explanation}
          onChange={(v) => update("explanation", v)}
          rows={6}
          placeholder="Each standard deck of 52 cards has four jacks…"
          required
        />
      </Card>

      {/* Meta */}
      <Card title="Meta">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="category"
            label="Category"
            value={values.category}
            onChange={(v) => update("category", v as QuestionFormValues["category"])}
            options={categoryEnum.enumValues.map((c) => ({
              value: c,
              label: c.replace(/_/g, " "),
            }))}
          />
          <Input
            name="slug"
            label="Slug (URL-safe id)"
            value={values.slug}
            onChange={(v) => update("slug", v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
            placeholder="gum-vs-skin"
            required
          />
        </div>
        <div className="flex flex-wrap gap-5 mt-4">
          <Checkbox
            name="authored"
            checked={values.authored}
            onChange={(v) => update("authored", v)}
            label="Authored (Alan's own copy)"
          />
          <Checkbox
            name="needsReview"
            checked={values.needsReview}
            onChange={(v) => update("needsReview", v)}
            label="Needs review"
          />
        </div>
      </Card>

      {/* Hidden mirrors so the server action receives everything (controlled
          inputs set above handle state, but the form needs live name/value
          pairs for the POST). */}
      <input type="hidden" name="answer" value={values.answer} />

      <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t border-black/5 px-4 py-3 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-black/60 hover:text-black px-4 py-2"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-extrabold px-6 py-3 rounded-xl transition"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border-2 border-black/5 rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-xs uppercase tracking-widest font-black text-black/50">{title}</h2>
      {children}
    </section>
  );
}

function OptionCardInput({
  letter,
  text,
  value,
  emoji,
  image,
  isAnswer,
  onChange,
}: {
  letter: "A" | "B";
  text: string;
  value: string;
  emoji: string;
  image: string;
  isAnswer: boolean;
  onChange: (patch: Partial<QuestionFormValues>) => void;
}) {
  const prefix = letter === "A" ? "optionA" : "optionB";

  return (
    <section
      className={`bg-white border-2 rounded-2xl p-5 sm:p-6 space-y-4 transition ${
        isAnswer ? "border-red-600/60" : "border-black/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-600 text-white font-extrabold text-xl -rotate-3">
          {letter}
        </span>
        <h2 className="text-xs uppercase tracking-widest font-black text-black/50">
          Option {letter}
        </h2>
        {isAnswer && (
          <span className="text-[10px] uppercase tracking-widest font-bold bg-red-600 text-white px-2 py-0.5 rounded ml-auto">
            Correct
          </span>
        )}
      </div>

      <Textarea
        name={`${prefix}Text`}
        label="Prompt"
        value={text}
        onChange={(v) => onChange({ [`${prefix}Text`]: v } as Partial<QuestionFormValues>)}
        rows={3}
        placeholder="The number of pounds of gum the average American chews in a year"
        required
      />
      <Input
        name={`${prefix}Value`}
        label="Value (shown on reveal)"
        value={value}
        onChange={(v) => onChange({ [`${prefix}Value`]: v } as Partial<QuestionFormValues>)}
        placeholder="1.8 pounds"
        required
      />
      <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
        <Input
          name={`${prefix}Emoji`}
          label="Emoji"
          value={emoji}
          onChange={(v) => onChange({ [`${prefix}Emoji`]: v } as Partial<QuestionFormValues>)}
          placeholder="🍬"
          className="w-24 text-center text-2xl"
        />
        <Input
          name={`${prefix}Image`}
          label="Image URL (optional)"
          value={image}
          onChange={(v) => onChange({ [`${prefix}Image`]: v } as Partial<QuestionFormValues>)}
          placeholder="https://…"
        />
      </div>
    </section>
  );
}

function AnswerPill({
  value,
  selected,
  onClick,
  labelText,
}: {
  value: "A" | "B";
  selected: boolean;
  onClick: () => void;
  labelText: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-3 border-2 transition ${
        selected
          ? "bg-red-50 border-red-600"
          : "bg-white border-black/10 hover:border-red-600/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-white font-extrabold text-sm ${
            selected ? "bg-red-600" : "bg-black/30"
          }`}
        >
          {value}
        </span>
        <span className="text-sm text-black/70 line-clamp-1">{labelText}</span>
      </div>
    </button>
  );
}

function Input({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-bold text-black/50">
        {label}
      </span>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`mt-1 w-full border-2 border-black/10 focus:border-red-600 rounded-xl px-3 py-2 font-medium outline-none transition ${className}`}
      />
    </label>
  );
}

function Textarea({
  name,
  label,
  value,
  onChange,
  rows,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-bold text-black/50">
        {label}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows ?? 3}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full border-2 border-black/10 focus:border-red-600 rounded-xl px-3 py-2 font-medium outline-none transition resize-y"
      />
    </label>
  );
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-bold text-black/50">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-2 border-black/10 focus:border-red-600 rounded-xl px-3 py-2 font-medium outline-none transition capitalize"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-red-600"
      />
      <span className="text-sm font-semibold text-black/75">{label}</span>
    </label>
  );
}

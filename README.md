# Which is More?

Mobile + web clone of Alan Katz's *Which is More?* trivia game. Players see two quantities and pick the one they think is larger, then flip to reveal the answer with a fun fact.

## Layout

```
which-is-more/
  data/questions.json      source of truth for the 10 seed questions
  backend/                 Next.js 16 + Drizzle + Vercel Postgres
  ios/                     SwiftUI iOS app (XcodeGen)
```

Both clients hit the same API: `GET /api/questions/random`, `/api/questions`, `/api/questions/:slug`.

## Quick start

### Backend (web + API)

```bash
cd backend
npm install
vercel link                    # new Vercel project
# provision Neon Postgres via Vercel Marketplace dashboard
vercel env pull .env.local     # pulls DATABASE_URL
npm run db:push                # creates schema
npm run db:seed                # loads 10 questions from ../data/questions.json
npm run dev                    # http://localhost:3000 — play at /play
```

### iOS

```bash
cd ios
brew install xcodegen          # if needed
xcodegen                       # creates WhichIsMore.xcodeproj
open WhichIsMore.xcodeproj
```

Select an iPhone simulator, hit Cmd-R. By default the app points at `http://localhost:3000` — start the backend first.

## Content status

The 10 questions come directly from Alan's PDF. Answers for questions 1–4 use Alan's original copy (gum, playing cards, Freds, foul balls). Questions 5–10 have placeholder research answers flagged `needsReview: true` in the DB and `authored: false` — those need Alan's voice before shipping.

Filter the placeholders anytime:
```sql
SELECT slug, option_a_text, option_b_text FROM questions WHERE needs_review = true;
```

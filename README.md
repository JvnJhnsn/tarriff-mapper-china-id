# Tariff Crosswalk · China ↔ Indonesia

A Generative-AI-first prototype that maps HS codes, local tariff codes, and free-form product descriptions between China's customs nomenclature (海关进出口税则) and Indonesia's BTKI 2022, with traceable confidence scoring and tariff data.

**Live demo:** _add your GitHub Pages URL after deployment_

---

## 1. What it does

The user types one of three things:
- A **product description** in English, Indonesian, or Chinese (e.g. "smartphone", "kopi mentah", "塑料袋")
- An **HS-6 code** (e.g. `851712`)
- A **local tariff code** — either China's 8–10 digit customs code or Indonesia's BTKI/AHTN 8-digit code

…and selects the source country. The app returns the **top 5 most likely classifications in the other country**, each with:

- Matched code (formatted in that country's native style)
- Product description in the target country's language
- Confidence score 0–100 with a colour-coded label (Exact / Likely / Partial / Manual review)
- Plain-language explanation of *why* the match was returned (which signals fired)
- MFN tariff rate, VAT, and regulatory notes (TKDN, BPOM, SNI, NMPA, etc.)
- Source citations (WCO HS 2022, BTKI 2022, China Customs Tariff, ACFTA)
- Sub-classification divergence warnings when 8-digit splits differ between countries

The app works in **both directions** (China → Indonesia and Indonesia → China) and handles vague descriptions, one-to-many mappings, and "manual review required" gracefully.

---

## 2. Architecture

This is a **fully client-side single-page web app** — no backend, no build step, no database server. It can be hosted as static files on GitHub Pages, Netlify, Vercel, or any web server in seconds.

```
┌────────────────────────────────────────────────────────────────┐
│                        Browser (the entire app)                │
│                                                                │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐  │
│  │ index.   │───▶│  app.js      │───▶│  Anthropic API      │  │
│  │ html     │    │  matching    │    │  (Claude Haiku 4.5) │  │
│  │ + CSS    │    │  engine      │    │  semantic re-rank   │  │
│  └──────────┘    └──────┬───────┘    └─────────────────────┘  │
│                         │                                      │
│                         ▼                                      │
│                  ┌──────────────┐                              │
│                  │  data.js     │  (HS knowledge base)         │
│                  │  20+ entries │                              │
│                  └──────────────┘                              │
└────────────────────────────────────────────────────────────────┘
```

### Why this architecture?

The assignment specifies "Generative-AI-first workflows" and explicitly approves Claude/ChatGPT-style platforms. Building entirely in the browser with the Anthropic API called directly means:

- **Trivial deployment** — drag four files onto GitHub Pages
- **Transparent matching logic** — the entire ranking algorithm is auditable in `app.js`; nothing is hidden behind an API I control
- **Privacy** — the user's API key lives in their own browser's `localStorage`; no server ever sees it
- **No infrastructure cost** — runs from any CDN

---

## 3. The matching engine (the "traceable logic layer")

The assignment requires that mappings be explainable, not opaque AI guesses. The engine combines **three independent signals** and shows which one(s) fired:

### Signal 1 — HS structural overlap
Both China and Indonesia inherit the first 6 digits of every code from the WCO Harmonized System. The engine measures how many leading HS digits the query shares with each candidate and produces a 0..1 score.

```
Query "851712" vs entry "851712" → 6 of 6 digits → score 1.0  → "exact HS anchor match"
Query "851712" vs entry "851713" → 4 of 6 digits → score 0.67 → "shares 4 HS digits"
Query "851712" vs entry "640299" → 0 of 6 digits → score 0.0  → no structural relation
```

### Signal 2 — Lexical / keyword similarity
Each entry in the knowledge base has a curated `keywords` list including English, Indonesian, and Chinese terms. The engine tokenises the query and scores:
- How many query tokens appear in the entry's description
- How many curated keywords appear in the query (weighted 1.5× because keywords are deliberate)
- How many multi-word keyword phrases appear as substrings of the query

This is what makes "smartphone" → 智能手机 work even though the words look nothing alike: both are listed under the same entry's `keywords` array.

### Signal 3 — AI semantic ranking (Claude Haiku 4.5)
When the query is a free-form description AND lexical confidence is below 95%, the engine sends the top 8 lexical candidates to Claude with this prompt:

> You are a customs classification expert. A user is searching for: "{query}". Below are candidate HS code categories. For each one, output a similarity score from 0.0 to 1.0... Respond ONLY with a JSON array.

Claude returns scores like `[0.95, 0.4, 0.1, 0.05, 0.0]` and the engine re-blends them at **35% lexical + 50% AI + 15% HS**. This catches semantic relationships that lexical can't — e.g. "phone for cellular networks" → smartphone, even with no shared tokens.

### Confidence blending
| Path | Formula | Typical range |
|------|---------|---------------|
| Direct code lookup (exact match in DB) | Fixed at **98%** | 98 |
| HS-6 anchor match | **88% + lexical × 10** | 88–98 |
| Description with AI on | **35% lex + 50% AI + 15% HS** | varies |
| Description, lexical only | **lexical × 80** | 0–80 |
| Code with partial digit match | **60% HS + 30% lex** | 0–60 |

### Match labels (what the user sees)
- **Exact match** — confidence ≥ 90 (green pill)
- **Likely match** — 70–89 (blue pill)
- **Partial match** — 50–69 (amber pill)
- **Manual review required** — < 50 (red pill, with warning)

This satisfies the assignment's requirement that the app "must return 'manual review required' when certainty is too low."

---

## 4. Data sources

| Source | Used for | Why selected |
|--------|----------|--------------|
| WCO HS 2022 nomenclature | The 6-digit anchor that bridges both countries | Globally authoritative, shared standard |
| China Customs Tariff Implementation Plan 2025 | China's 8–10 digit national codes + MFN rates | Official MOF/GAC publication |
| Indonesia BTKI 2022 (Permenkeu 26/2022) | Indonesia's 8-digit codes + MFN rates | Current legal tariff book |
| AHTN 2022 | ASEAN harmonised 8-digit nomenclature feeding into BTKI | Provides regional consistency layer |
| ACFTA / Form E framework | Preferential rate context shown in footer | Most CN↔ID trade actually uses ACFTA, not MFN |

The knowledge base in `data.js` covers **20 representative product categories** spanning textiles, electronics, machinery, chemicals, food/agriculture, automotive, metals, plastics, toys, furniture, and rubber. The schema is extensible — adding 100 or 1,000 more entries is just appending to the array.

---

## 5. How the app handles edge cases

### Vague / incomplete product descriptions
"cotton t-shirt for men" returns the T-shirt code at #1 (80%) and trousers at #2 (40%) — the engine surfaces both because both contain "men" and "cotton" but the curated keyword "t-shirt" tilts the ranking. Without the AI layer, the user gets enough signal to disambiguate visually; with the AI layer, Claude pushes the correct one to a higher confidence.

### One-to-many mappings
The top-5 results format intrinsically supports this. When a Chinese 10-digit code maps to multiple Indonesian sub-headings (or vice versa), they appear as separate matches with their respective confidence scores. The user can compare descriptions and tariff treatments side by side.

### National extensions beyond 6 digits
The `divergenceNote()` function compares digits 7–8 (the AHTN level) between the China and Indonesia codes. If they differ at that level, a warning fires: *"National sub-classifications differ at the 8-digit level — verify against the official tariff book."* This is the correct level to flag, because the 6-digit HS is universal but national splits start at the 7th digit.

### Manual review required
Whenever the top match scores below 50%, the label switches to a red "Manual review required" pill, the explanation reads "Low-confidence inference — manual verification advised," and the entire results panel signals to the user that they should not rely on the output for customs filing.

### Multi-language input
Keywords for each entry include English, Indonesian (Bahasa), and Chinese terms. Searching `"塑料袋"` (Chinese for "plastic bag") correctly returns HS 392321 with 80% confidence; searching `"kopi mentah"` returns HS 090111 (raw coffee) at 80%.

---

## 6. AI prompts used (the core ones)

The full prompt sent to Claude during AI re-ranking is in `app.js` → `aiSemanticRank()`. It went through three iterations:

**v1 (failed):** "Score each candidate from 1 to 10..." — Claude kept returning prose explanations alongside numbers.

**v2 (better):** "Respond with only a JSON array of scores..." — worked but Claude sometimes wrapped the array in markdown ```json fences.

**v3 (final, in code):** "Respond ONLY with a JSON array of numbers, one per candidate, in order. Example: [0.9, 0.4, 0.1, 0.05, 0.0]. No explanation, no markdown, just the array." — works reliably. The defensive parser strips markdown fences as a fallback.

I also used Claude (in the Claude.ai web interface) during the build itself to:
- Generate the initial structure of `data.js` with realistic CN/ID code pairs
- Verify the AHTN/BTKI 8-digit conventions
- Cross-check MFN tariff rates against published WTO Tariff Download Facility data
- Review the divergence-detection logic for false positives

---

## 7. What AI did well vs. what required human judgment

### AI did well
- Generating realistic product descriptions in three languages (English, Indonesian, Chinese)
- Suggesting curated keyword lists that include the colloquial forms ("hp" for handphone in Indonesian, "汗衫" as a colloquial Chinese term for singlet)
- Ranking candidates semantically — Claude correctly identifies that "phone for cellular networks" should map to smartphone rather than to a TV receiver, even though both are in HS chapter 85
- Drafting the explanation strings that appear under each match

### Required human judgment
- **Tariff rates** — these change frequently and AI training data is stale; I cross-referenced each rate against the latest published tariff books rather than trusting AI memory
- **Confidence thresholds** — calibrating 90/70/50 as the cutoffs for the four match labels was an empirical decision based on running test queries and watching where false positives crept in
- **Knowing which signals to weight** — the "lexical 35% + AI 50% + HS 15%" formula was tuned manually after observing that pure AI re-ranking sometimes ignored a perfect HS-6 match
- **Acknowledging what the prototype is not** — a customs binding ruling. The footer and copy explicitly say "Not a customs binding ruling," because that legal status only attaches to formal rulings issued by GAC or DGCE
- **ACFTA context** — recognising that for most actual CN↔ID trade, the relevant rate is the ACFTA preferential rate (often 0%) accessed via Form E, not the MFN fallback. This is a domain insight no AI prompt was going to volunteer unprompted

---

## 8. Limitations & unresolved risks

- **Knowledge base size**: 20 entries is enough to demonstrate the architecture but a production version needs all ~5,200 HS-6 categories populated. The schema in `data.js` is built for this scale.
- **Tariff freshness**: Rates are pulled from publicly available sources as of the 2025/2026 publications. They will drift. A production version should pull from an updated feed.
- **No customs binding-ruling status**: The prototype explicitly disclaims this. A high-confidence match here is not legal certainty for an importer — only an actual customs ruling provides that.
- **AI non-determinism**: Claude's similarity scores can vary slightly between calls. The architecture mitigates this by anchoring AI scores to lexical and HS signals, but identical queries may return marginally different confidences.
- **Anti-dumping duties, safeguard duties, excise/PPnBM, ACFTA preferential rates**: Surfaced in the "notes" field for some entries but not systematically modelled. A production version would model these as separate fields.

---

## 9. Reflection

**What worked best:** The three-signal blend — HS structure + curated keywords + AI semantics — turned out to be much more robust than any single signal would have been. Each one catches what the others miss: HS digits anchor exact code lookups, keywords handle multi-language search, AI handles fuzzy semantic queries. The fact that the explanation field shows *which* signals fired makes the whole thing auditable, which is exactly what a customs broker would need.

**Where ambiguity appeared:** Vague queries like "cotton t-shirt for men" still produce two close-confidence candidates (T-shirt and trousers), because both share the "men" + "cotton" tokens. The AI layer mostly resolves this, but it's a reminder that customs classification is genuinely hard — even human classifiers disagree on borderline cases. The right behaviour is what the app does: surface multiple candidates with explanations and let the user decide.

**What I'd improve in v2:** First, populate the full HS-6 universe (~5,200 entries) using a one-shot batch generation pipeline. Second, add an embeddings-based similarity layer (using OpenAI or Voyage embeddings) so semantic search works without an LLM call per query. Third, integrate ACFTA preferential rate lookup so the most economically relevant tariff (the one most importers actually use) is shown alongside the MFN rate. Fourth, add a "rationale chain" view that lets the user click through to see Claude's reasoning, the matching tokens, and the underlying HS path — full audit trail.

---

## 10. File structure

```
tariff-mapper/
├── index.html       ← Page structure, search form, results container
├── style.css        ← Editorial-typography aesthetic, ledger-style cards
├── app.js           ← Matching engine + AI integration + UI handlers
├── data.js          ← HS knowledge base (China/Indonesia code pairs)
└── README.md        ← This file
```

No build step. No `package.json`. No node_modules. Just open `index.html` in a browser.

---

## 11. Local development

```bash
# Clone or download
cd tariff-mapper

# Option A — open directly
open index.html              # macOS
xdg-open index.html          # Linux
start index.html             # Windows

# Option B — serve via a local web server (recommended for the API to work
# reliably; some browsers block fetch from file:// origins)
python3 -m http.server 8000
# then visit http://localhost:8000
```

Paste an Anthropic API key into the panel at the top to enable AI semantic matching. Without a key, lexical + HS matching still works fine.

---

## 12. License & attribution

Prototype built as a case-study assignment. Tariff data compiled from publicly available sources (WCO, China Customs, Indonesian Ministry of Finance, ACFTA framework). Not for use as customs binding-ruling guidance.

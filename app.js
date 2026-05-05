// ============================================================================
// TARIFF MAPPING ENGINE — China ↔ Indonesia
// ============================================================================
// Matching logic combines THREE traceable signals:
//   1. HS digit overlap (structural — share first 6, 4, or 2 digits)
//   2. Keyword/lexical similarity (token overlap on description + keywords)
//   3. AI semantic similarity (Claude API — only invoked for description search
//      or when lexical confidence is low, to keep latency reasonable)
//
// Each signal contributes to a transparent confidence score (0-100).
// The UI shows WHY each match was returned — this is the "traceable logic
// layer" the assignment requires.
// ============================================================================

// ---- Utility: normalise text for matching ----
function normalize(s) {
  return (s || "").toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ");
}

function tokenize(s) {
  return normalize(s).split(" ").filter(t => t.length > 1);
}

// ---- Detect what the user typed ----
// Returns: {type: "hs6"|"china_code"|"indonesia_code"|"description", value: string}
function classifyInput(raw, country) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[.\-\s]/g, "");

  if (/^\d{6}$/.test(digits)) {
    return { type: "hs6", value: digits };
  }
  if (/^\d{8,10}$/.test(digits) && country === "china") {
    return { type: "china_code", value: digits };
  }
  if (/^\d{8}$/.test(digits) && country === "indonesia") {
    return { type: "indonesia_code", value: digits };
  }
  // Indonesia codes commonly written like 6109.10.00 — match dotted form
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(trimmed) && country === "indonesia") {
    return { type: "indonesia_code", value: digits };
  }
  return { type: "description", value: trimmed };
}

// ---- Lexical similarity (Jaccard-style on tokens, with keyword-list bonus) ----
// Keywords are a curated list of the most common ways a product is referred to.
// Hitting a keyword is a stronger signal than hitting a generic description word.
function lexicalSimilarity(query, entry) {
  const qTokens = new Set(tokenize(query));
  if (qTokens.size === 0) return 0;

  const descTokens = new Set(tokenize(entry.description));
  const keywordTokensList = (entry.keywords || []).map(k => tokenize(k));

  let descHits = 0;
  let keywordHits = 0;

  for (const t of qTokens) {
    // Description hits
    if (descTokens.has(t)) descHits++;
    else {
      for (const e of descTokens) {
        if (e.length >= 4 && (e.includes(t) || t.includes(e))) {
          descHits += 0.5;
          break;
        }
      }
    }
    // Keyword hits — count an exact keyword phrase match as a strong signal.
    // Whole multi-word keyword present in query?
    for (const kwTokens of keywordTokensList) {
      if (kwTokens.length === 1 && kwTokens[0] === t) {
        keywordHits += 1;
        break;
      }
    }
  }

  // Multi-word keyword phrases: check if any are substrings of the query
  const qNorm = normalize(query);
  for (const kw of (entry.keywords || [])) {
    const kwNorm = normalize(kw);
    if (kwNorm.length >= 3 && qNorm.includes(kwNorm)) {
      keywordHits += 1;
    }
  }

  // Blend: keyword hits are worth 1.5x description hits because curated
  const blended = (descHits + keywordHits * 1.5) / Math.max(qTokens.size, 1);
  return Math.min(1, blended);
}

// ---- HS structural similarity ----
// Returns 0..1 based on how many leading digits are shared
function hsStructuralSimilarity(hsA, hsB) {
  if (!hsA || !hsB) return 0;
  const a = hsA.replace(/[.\-]/g, "").substring(0, 6);
  const b = hsB.replace(/[.\-]/g, "").substring(0, 6);
  let matched = 0;
  for (let i = 0; i < 6; i++) {
    if (a[i] && a[i] === b[i]) matched++;
    else break;
  }
  return matched / 6;
}

// ---- Build match label from confidence ----
function matchLabel(conf, signals) {
  if (conf >= 90) return "Exact match";
  if (conf >= 70) return "Likely match";
  if (conf >= 50) return "Partial match";
  return "Manual review required";
}

// ---- Build human-readable explanation ----
function buildExplanation(input, entry, signals, targetCountry) {
  const parts = [];
  if (signals.hsExact) {
    parts.push(`Exact 6-digit HS anchor match (${entry.hs6}) — both China and Indonesia inherit this from WCO HS 2022`);
  } else if (signals.hsPartial > 0) {
    const digits = Math.round(signals.hsPartial * 6);
    parts.push(`Shares first ${digits} HS digits — same chapter/heading family`);
  }
  if (signals.lexical >= 0.5) {
    parts.push(`Strong description overlap (${Math.round(signals.lexical * 100)}% token match)`);
  } else if (signals.lexical > 0) {
    parts.push(`Partial description overlap (${Math.round(signals.lexical * 100)}%)`);
  }
  if (signals.ai > 0) {
    parts.push(`AI semantic similarity score ${Math.round(signals.ai * 100)}%`);
  }
  if (signals.codeDirect) {
    const codeType = input.match(/^\d/) ? "tariff code" : "code";
    parts.push(`Direct ${codeType} lookup — exact match in crosswalk database`);
  }
  return parts.length ? parts.join(" • ") : "Low-confidence inference — manual verification advised";
}

// ---- Detect 6+ digit divergence between countries ----
// Only flag genuine sub-classification differences — not mere formatting
// (e.g. CN 10-digit "0010" vs ID 8-digit "00" both meaning "no further split"
// at that level should not raise a flag).
function divergenceNote(entry) {
  const cnFull = entry.china.code.replace(/[.\-]/g, "");
  const idFull = entry.indonesia.code.replace(/[.\-]/g, "");
  // Compare the 7th-8th digits (AHTN level) only — that's the meaningful
  // common subdivision. Beyond that, divergence is expected and not noteworthy.
  const cn78 = cnFull.substring(6, 8) || "00";
  const id78 = idFull.substring(6, 8) || "00";
  if (cn78 !== id78 && cn78 !== "00" && id78 !== "00") {
    return `National sub-classifications differ at the 8-digit level (CN: ${cnFull.substring(0,4)}.${cnFull.substring(4,6)}.${cn78}…  vs  ID: ${idFull.substring(0,4)}.${idFull.substring(4,6)}.${id78}). Verify against the official tariff book for the exact sub-heading.`;
  }
  return null;
}

// ============================================================================
// CORE MATCHING — main entry point
// ============================================================================
async function findMatches(rawInput, sourceCountry, targetCountry, useAI) {
  const cls = classifyInput(rawInput, sourceCountry);
  const db = window.HS_DATABASE;

  // Score every entry
  const scored = db.map(entry => {
    const signals = { hsExact: false, hsPartial: 0, lexical: 0, ai: 0, codeDirect: false };

    // 1. Code-based matching
    if (cls.type === "hs6") {
      signals.hsPartial = hsStructuralSimilarity(cls.value, entry.hs6);
      if (signals.hsPartial === 1) signals.hsExact = true;
    } else if (cls.type === "china_code") {
      const entryCode = entry.china.code.replace(/[.\-]/g, "");
      if (entryCode === cls.value) signals.codeDirect = true;
      else signals.hsPartial = hsStructuralSimilarity(cls.value, entryCode);
    } else if (cls.type === "indonesia_code") {
      const entryCode = entry.indonesia.code.replace(/[.\-]/g, "");
      if (entryCode === cls.value) signals.codeDirect = true;
      else signals.hsPartial = hsStructuralSimilarity(cls.value, entryCode);
    } else {
      // description: lexical only at this stage
      signals.lexical = lexicalSimilarity(cls.value, entry);
    }

    // Compute base confidence (weighted blend)
    // Pure-description searches lean heavily on lexical (no code signal available).
    // Code searches lean heavily on structural HS overlap.
    let conf;
    if (signals.codeDirect) {
      conf = 98;
    } else if (signals.hsExact) {
      conf = 88; // strong HS anchor; lexical may push higher later
      conf += signals.lexical * 10;
    } else if (cls.type === "description") {
      // Description-only: lexical is the dominant available signal. A perfect
      // token match on a curated keyword list is a strong indicator.
      conf = signals.lexical * 80;
    } else {
      conf = signals.hsPartial * 60 + signals.lexical * 30;
    }
    conf = Math.min(100, Math.round(conf));

    return { entry, signals, conf };
  });

  // Sort and take top candidates
  scored.sort((a, b) => b.conf - a.conf);
  let top = scored.slice(0, 8); // take 8 to allow AI re-ranking; trim to 5 later

  // 2. AI semantic re-ranking — invoke for description searches OR low-confidence
  if (useAI && cls.type === "description" && top[0].conf < 95) {
    try {
      const aiScores = await aiSemanticRank(cls.value, top.map(t => ({
        hs6: t.entry.hs6,
        description: t.entry.description,
        keywords: (t.entry.keywords || []).slice(0, 6).join(", ")
      })));
      // Merge AI scores
      top.forEach((t, i) => {
        if (aiScores[i] !== undefined) {
          t.signals.ai = aiScores[i];
          // Re-blend: lexical 35%, AI 50%, HS 15%
          const blended = t.signals.lexical * 35 + t.signals.ai * 50 + t.signals.hsPartial * 15;
          t.conf = Math.min(100, Math.round(Math.max(t.conf, blended)));
        }
      });
      top.sort((a, b) => b.conf - a.conf);
    } catch (e) {
      console.warn("AI rerank failed, using lexical only:", e);
    }
  }

  // Format final 5
  return top.slice(0, 5).map(t => {
    const target = targetCountry === "china" ? t.entry.china : t.entry.indonesia;
    return {
      hs6: t.entry.hs6,
      code: target.code,
      description: target.description,
      tariff: {
        mfn: target.mfn,
        vat: target.vat,
        notes: target.notes || ""
      },
      confidence: t.conf,
      label: matchLabel(t.conf),
      explanation: buildExplanation(rawInput, t.entry, t.signals, targetCountry),
      divergence: divergenceNote(t.entry),
      sources: ["WCO HS 2022", targetCountry === "china" ? "China Customs Tariff 2025" : "BTKI 2022 (Permenkeu 26/2022)", "ACFTA / AHTN 2022"]
    };
  });
}

// ============================================================================
// AI SEMANTIC RANKING — uses Anthropic API via user-supplied key
// ============================================================================
async function aiSemanticRank(query, candidates) {
  const apiKey = localStorage.getItem("anthropic_api_key");
  if (!apiKey) throw new Error("No API key set");

  const candidatesText = candidates.map((c, i) =>
    `${i}. [HS ${c.hs6}] ${c.description} (keywords: ${c.keywords})`
  ).join("\n");

  const prompt = `You are a customs classification expert. A user is searching for: "${query}"

Below are candidate HS code categories. For each one, output a similarity score from 0.0 to 1.0 representing how likely it is the correct classification for the user's query.

Candidates:
${candidatesText}

Respond ONLY with a JSON array of numbers, one per candidate, in order. Example: [0.9, 0.4, 0.1, 0.05, 0.0]
No explanation, no markdown, just the array.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content.find(b => b.type === "text")?.text || "[]";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\[[\d.,\s]+\]/);
  if (!match) throw new Error("Could not parse AI response");
  return JSON.parse(match[0]);
}

// ============================================================================
// UI WIRING
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const input = document.getElementById("query");
  const sourceSel = document.getElementById("source-country");
  const targetEl = document.getElementById("target-country-label");
  const resultsEl = document.getElementById("results");
  const loaderEl = document.getElementById("loader");
  const aiToggle = document.getElementById("ai-toggle");
  const apiKeyInput = document.getElementById("api-key");
  const apiKeySaveBtn = document.getElementById("save-key");
  const apiKeyStatus = document.getElementById("key-status");

  // Restore saved key
  const savedKey = localStorage.getItem("anthropic_api_key");
  if (savedKey) {
    apiKeyStatus.textContent = "✓ API key saved (using AI semantic matching)";
    apiKeyStatus.className = "key-status saved";
    aiToggle.checked = true;
  }

  apiKeySaveBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("anthropic_api_key", key);
      apiKeyStatus.textContent = "✓ API key saved";
      apiKeyStatus.className = "key-status saved";
      apiKeyInput.value = "";
      aiToggle.checked = true;
    } else {
      localStorage.removeItem("anthropic_api_key");
      apiKeyStatus.textContent = "Key cleared — using lexical matching only";
      apiKeyStatus.className = "key-status";
      aiToggle.checked = false;
    }
  });

  // Update target country label when source changes
  function updateTarget() {
    const isCN = sourceSel.value === "china";
    targetEl.textContent = isCN ? "→ Indonesia" : "→ China";
  }
  sourceSel.addEventListener("change", updateTarget);
  updateTarget();

  // Example queries
  document.querySelectorAll(".example-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.query;
      sourceSel.value = chip.dataset.source;
      updateTarget();
      form.dispatchEvent(new Event("submit"));
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const source = sourceSel.value;
    const target = source === "china" ? "indonesia" : "china";
    const useAI = aiToggle.checked && !!localStorage.getItem("anthropic_api_key");

    resultsEl.innerHTML = "";
    loaderEl.classList.add("active");
    loaderEl.textContent = useAI ? "Querying AI semantic engine…" : "Computing lexical matches…";

    try {
      const matches = await findMatches(query, source, target, useAI);
      renderResults(matches, query, source, target, useAI);
    } catch (err) {
      resultsEl.innerHTML = `<div class="error-card">Error: ${err.message}</div>`;
    } finally {
      loaderEl.classList.remove("active");
    }
  });

  function renderResults(matches, query, source, target, usedAI) {
    if (!matches.length) {
      resultsEl.innerHTML = `<div class="empty-state">No candidates found. Try a different description.</div>`;
      return;
    }

    const targetName = target === "china" ? "China (中国海关编码)" : "Indonesia (BTKI)";
    const sourceName = source === "china" ? "China" : "Indonesia";

    let html = `
      <div class="results-header">
        <div class="results-meta">
          <span class="route">${sourceName} → ${targetName}</span>
          <span class="query-echo">Query: "${escapeHtml(query)}"</span>
          <span class="engine-badge ${usedAI ? "ai" : "lex"}">${usedAI ? "AI + Lexical + HS" : "Lexical + HS only"}</span>
        </div>
      </div>
    `;

    matches.forEach((m, i) => {
      const labelClass = m.label.toLowerCase().replace(/\s+/g, "-");
      html += `
        <article class="match-card rank-${i + 1}">
          <header class="match-head">
            <div class="rank-badge">#${i + 1}</div>
            <div class="match-codes">
              <code class="primary-code">${m.code}</code>
              <span class="hs-anchor">HS ${m.hs6}</span>
            </div>
            <div class="confidence-block">
              <div class="conf-bar"><div class="conf-fill" style="width:${m.confidence}%"></div></div>
              <div class="conf-text"><strong>${m.confidence}%</strong> · <span class="label-pill ${labelClass}">${m.label}</span></div>
            </div>
          </header>

          <div class="match-body">
            <p class="match-desc">${escapeHtml(m.description)}</p>

            <div class="tariff-grid">
              <div class="tariff-cell">
                <span class="tariff-label">MFN Tariff</span>
                <span class="tariff-value">${m.tariff.mfn}</span>
              </div>
              <div class="tariff-cell">
                <span class="tariff-label">VAT</span>
                <span class="tariff-value">${m.tariff.vat}</span>
              </div>
              ${m.tariff.notes ? `<div class="tariff-cell tariff-notes"><span class="tariff-label">Notes</span><span class="tariff-value">${escapeHtml(m.tariff.notes)}</span></div>` : ""}
            </div>

            <div class="explanation">
              <strong>Why this match:</strong> ${escapeHtml(m.explanation)}
            </div>

            ${m.divergence ? `<div class="divergence-warning">⚠ ${escapeHtml(m.divergence)}</div>` : ""}

            <div class="sources">
              <span class="src-label">Sources:</span>
              ${m.sources.map(s => `<span class="src-tag">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
        </article>
      `;
    });

    html += `<div class="acfta-footer">${escapeHtml(window.ACFTA_NOTE)}</div>`;
    resultsEl.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
});

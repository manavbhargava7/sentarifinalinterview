---

# **Sentari – From “Transcript to Empathy”**
---

## **1. What You’re Building**

Create a full 13-step pipeline that turns one diary `transcript` into:

* A short, emotionally intelligent **AI reply**
* An updated **long-term user profile**

You’ll demonstrate the flow in **two cases**:

1. **First-ever entry** (no prior data)
2. **100th entry** (with 99 realistic prior entries)

---

## **2. Mandatory 13-Step Workflow**

Start only **after** you have the `raw_text`. Your code must log each step like this:
`[TAG] input=<…> | output=<…> | note=<…>`

| #  | Log Tag            | What to DO                                   | Input ➜ Output                 |
| -- | ------------------ | -------------------------------------------- | ------------------------------  |
| 01 | `RAW_TEXT_IN`      | Accept the transcript                        | transcript ➜ `raw_text`        |
| 02 | `EMBEDDING`        | Create n-dim MiniLM vector (or mock)         | `raw_text` ➜ `embedding[n]`    |
| 03 | `FETCH_RECENT`     | Load last 5 entries                          | ➜ `recent[]`                   |
| 04 | `FETCH_PROFILE`    | Load or init user profile                    | ➜ `profile`                    |
| 05 | `META_EXTRACT`     | Extract top words, length, punctuation flags | ➜ `meta_data`                  |
| 06 | `PARSE_ENTRY`      | Use ChatGPT-1 or rule-based extraction       | ➜ `parsed`                     |
| 07 | `CARRY_IN`         | Check if theme/vibe overlap or cosine > 0.86 | ➜ `carry_in`                   |
| 08 | `CONTRAST_CHECK`   | Compare new vibe vs dominant profile vibe    | ➜ `emotion_flip`               |
| 09 | `PROFILE_UPDATE`   | Mutate profile fields                        | ➜ updated `profile`            |
| 10 | `SAVE_ENTRY`       | Save full object                             | ➜ `entryId`                    |
| 11 | `GPT_REPLY`        | Generate ≤ 55-char empathic response         | ➜ `response_text`              |
| 12 | `PUBLISH`          | Package `{entryId, response_text, carry_in}` | –                               |
| 13 | `COST_LATENCY_LOG` | Print mock cost + time used                  | –                               |


### Notes: 
- `n` value need to be specified in the assumptions.md file 
- `GPT_REPLY` length can be variable but preffered under the limit i.e, 55 char, if you are planning to exceed specify in assumptions.md 

You can go ahead with reasonable assumptions and mention them in the README under the assumption section, or create a different assumption.md file and add your assumptions there.

---

## **3. Field Glossary + Example**

| Field         | Meaning        | Detection Cue              | Transcript Example                           | Extracted                      |
| ------------- | -------------- | -------------------------- | -------------------------------------------- | ------------------------------ |
| Theme         | External topic | nouns, hashtags            | “I keep checking Slack when tired”           | `["work-life balance"]`        |
| Vibe          | Emotional tone | emotion words, punctuation | “I’m exhausted and tense”                    | `["anxious","exhausted"]`      |
| Intent        | Surface goal   | want/plan/hope             | “I need rest, but worry I’ll miss something” | `"Rest without guilt"`         |
| Subtext       | Hidden worry   | contrast words, tone shift | “but I’m scared…”                            | `"Fear of missing out"`        |
| Persona Trait | Behavior style | tone, phrasing             | “keep checking Slack”                        | `["conscientious","vigilant"]` |
| Bucket        | Entry type     | implicit                   | thinking log                                 | `["Thought"]`                  |

---

### **Parsed Example**

**Transcript**

> “I keep checking Slack even when I’m exhausted. I know I need rest, but I’m scared I’ll miss something important.”

**Parsed Output**

```json
{
  "theme": ["work-life balance"],
  "vibe": ["anxious","exhausted"],
  "intent": "Find rest without guilt or fear of missing out.",
  "subtext": "Fears being seen as less committed.",
  "persona_trait": ["conscientious","vigilant"],
  "bucket": ["Thought"]
}
```

**Replies**

* First entry → `"Sounds like you're drained but trying—rest is not failure."`
* 100th entry → `"🧩 You’re still wired-in, but self-care matters too 💤"`

---

## **4. Long-Term Profile Format (After 100 Entries)**

```json
{
  "top_themes": ["intern management","startup culture","productivity","work-life balance"],
  "theme_count": { "intern management": 35, "productivity": 22, "startup culture": 18, "work-life balance": 12 },
  "dominant_vibe": "driven",
  "vibe_count": { "driven": 41, "curious": 19, "overwhelmed": 14, "excited": 9 },
  "bucket_count": { "Goal": 48, "Thought": 27, "Hobby": 15, "Value": 10 },
  "trait_pool": ["organiser","builder","mentor"],
  "last_theme": "productivity"
}
```

---

## **5. Implementation Rules**

* 🧪 Mock GPT / MiniLM as needed, mark `[MOCK]`
* Run both:

  * `npm run simulate:first` → start from zero
  * `npm run simulate:hundred` → load 99 fake entries
* All 13 logs must print in each run
* Ensure outputs (e.g. carry-in, emotion flip, response text) **differ** meaningfully between the two runs

---

## **6. Deliverables**

You must submit the following:

* [ ] `src/pipeline.ts` or `.py` with all 13 steps
* [ ] Working UI (does **not** need to be pretty – just functional)
* [ ] `simulate:first` and `simulate:hundred` logs
* [ ] `README.md` under 200 words with install + run instructions
* [ ] No paid API keys committed – mock where needed
* [ ] Once OpenAI key is added, the flow should **just work**

---

## **7. Timeline & Demo**

🕛 **Deadline**:

* **Thursday (June 26) at 11:59pm ET**

🎤 **Demo Slot**:

* **Friday morning or afternoon**
* Each team gets **15 minutes** to show their working flow
* Be ready to:

  * Paste a transcript
  * Show the empathy reply
  * Show updated profile
  * Walk through 13-step log output

---


PS:


| Field   | Definition                                                | Typical Values                                  |
| ------- | --------------------------------------------------------- | ----------------------------------------------- |
| Theme   | The *external topic* or *hashtag* discussed in this entry | `["intern management"]`, `["startup culture"]`  |
| Vibe    | The *current emotional tone* expressed in the entry       | `["driven"]`, `["curious"]`, `["anxious"]`      |
| Intent  | The *explicit goal* the speaker wants to achieve          | `"Improve intern productivity"`                 |
| Subtext | The *underlying motive* or *unspoken concern*             | `"Wants to be seen as a capable leader"`        |
| Profile | The *long-term user profile*, accumulated over entries    | `{ dominant_vibe: "driven", theme_count: ... }` |


### Sentari Intern Challenge — Official Scoring Rubric  
*(Total = 100 points)*  

| Category | Weight | What We Measure | How We Measure It |
|----------|--------|-----------------|-------------------|
| **1. Solution Quality** | **50 pts** | a. Correctness — all 13 steps executed, correct order, required fields present.<br>b. Empathy Output Quality — reply ≤ 25 chars, mirrors vibe, references theme, 🧩 logic correct, no hallucination.<br>c. Parsing Accuracy — JSON fields plausible; manual spot-check on 5 unseen transcripts.<br>d. Profile Integrity — counters increment, dominant_vibe recalculated, carry-in flag accurate.<br>e. Edge-Case Handling — works with empty, long (>200 chars), emoji-heavy inputs. | • Automated unit tests (provided) 15 pts.<br>• Manual QA panel (3 judges ×10 pts) 30 pts.<br>• Edge-case script 5 pts. |
| **2. Performance & Cost Efficiency** | **30 pts** | a. Latency — wall-clock time per entry.<br>b. Token/Compute Cost — number of GPT tokens or “mock” label.<br>c. Resource Footprint — RAM < 1 GB during run. | • `COST_LATENCY_LOG` vs baseline:<br>  p95 ≤ 3 s → 15 pts<br>  3–5 s → 10 pts<br>  >5 s → 5 pts.<br>• Cost:<br>  < $0.002 / entry (or MOCK) → 10 pts<br>  0.002–0.005 → 5 pts.<br>• RAM check 5 pts. |
| **3. Code Structure & Maintainability** | **20 pts** | a. Modular Design — each step in its own function.<br>b. Readability — TypeScript types / Python type-hints, comments.<br>c. Configurability — easy to swap mock ↔ real API.<br>d. Lint/Tests — ESLint/flake8 clean; unit tests ≥ 1. | • Mentor code review (10 pts).<br>• `npm run lint && npm run test` CI pass (5 pts).<br>• Swap test: replace mock with dummy OpenAI key in ≤ 5 mins (5 pts). |

**Pass threshold:** 70 pts total **and** ≥ 35 pts in Category 1.  

---

### Accepted Tech-Stack

| Layer | Baseline (preferred) | Allowed Variants |
|-------|----------------------|------------------|
| Runtime | **Node.js 18+ with TypeScript** | Python 3.9+ |
| Local STT | `faster-whisper` tiny model | Mock transcript |
| Embedding | `sentence-transformers` *(all-MiniLM-L6-v2)* | Any 768–1536-dim model or mock |
| Local LLM | Ollama `phi` / llama-cpp 7B-Q4 | Rule-based mock |
| Storage | In-memory JS/TS Map (acts as DB) | SQLite / Supabase (self-host) |
| Dependencies | NPM or Pip packages must be MIT/Apache | — |

*No paid cloud APIs are required; if you use them, cost counts in Category 2.*

---

### Deliverable Checklist (CI will verify)

1. `npm run simulate:first` & `npm run simulate:hundred` produce **13 log lines each**, tags match spec.  
2. `src/` contains modular code; `README.md` ≤ 200 words with setup & commands.  
3. `tests/` folder has at least one Jest/PyTest verifying carry-in logic.  
4. Lint passes (`eslint` or `flake8`).  
5. Memory peak < 1 GB (monitored by CI).  

---

**Evaluation flow on Demo Day**

1. Teams run both commands live; judges review logs for step order & field values.  
2. Latency & memory captured via wrapper script.  
3. Judges paste 5 blind transcripts; check JSON + reply.  
4. Code review & cost sheet inspection.  

Highest composite score wins. Good luck and build something you’re proud of!
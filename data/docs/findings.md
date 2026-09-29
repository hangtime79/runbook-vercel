# Phase 5 — Pattern Discovery Findings (Pass 1)

**Corpus:** 254,224 labeled transactions (22,658 fraud @ **baseline 9.47%**). Pending-label rows (72,781) already excluded.
**Script:** `scripts/phase05_pattern_discovery.py`
**Window:** Jan 2017 – Apr 2018 (16 months)

---

## Variance ranking (fraud-rate range by dimension)

| Rank | Dimension | Range | Notes |
|---|---|---|---|
| 1 | `velocity_1h_count` (discrete) | **90.9 pp** | Step function — see Finding 1 |
| 2 | `subsector_description` | 13.4 pp | Wide spread across 38 subsectors — Finding 4 |
| 3 | `amount_bucket` fine | 10.9 pp | Non-monotonic U with micro-spike — Finding 2 |
| 4 | `hour_of_day` | 10.7 pp | 3–5 AM elevated ~2× baseline — Finding 5 |
| 5 | `distance_bucket` | 9.9 pp | Mild gradient; 1000 km+ highest |
| 6 | `signature_provided` | 6.1 pp | 2.3× protection factor — Finding 3 |
| 7 | `age_bucket` | 5.1 pp | 65+ 40% below baseline |
| 8 | `item_category` | 5.0 pp | B/C vs A/D split |
| 9 | `is_first_transaction` | 2.7 pp | Weak alone |
| 10 | `impossible_travel_flag` | 1.8 pp | **inverse** — 7.7% when flagged |
| 11–14 | day-of-week, weekend, night, reward_program | <1.5 pp | Noise |

Top-5 dimensions carry the signal. Everything below rank 7 is noise; we stop investing there.

---

## Finding 1 — Velocity step function: a single prior transaction in the last hour is the loudest single-feature fraud signal in the dataset

| `velocity_1h_count` | n | fraud | rate | multiplier vs 0 |
|---|---|---|---|---|
| 0 | 248,340 | 22,658 | **9.12%** | 1.0× (baseline for this cut) |
| 1 | 5,596 | 1,280 | **22.87%** | **2.5×** |
| 2 | 243 | 110 | **45.27%** | 5.0× |
| 3 | 28 | 19 | 67.9% | 7.4× |
| 4+ | 22 | 19 | 86.4% | 9.5× |

The jump from 0 → 1 is the *operational* threshold: any card making ≥ 1 authorization in the prior hour is roughly 2.5× likelier to be fraud. Rate climbs monotonically thereafter but the tail sample sizes drop fast (28 rows at v1h=3). **The 0→1 break is where rules-engine value concentrates.** Fires §5.6 `velocity_step`.

## Finding 2 — The $2–$5 micro-transaction bucket is 5–6× the fraud rate of adjacent buckets — a textbook card-testing signature

| Bucket | n | fraud | rate |
|---|---|---|---|
| <$1 | 3 | 1 | 33.3% (tiny sample) |
| $1–$2 | 1 | 0 | — |
| **$2–$5** | **1,477** | **708** | **47.9%** |
| $5–$10 | 6,284 | 762 | 12.1% |
| $10–$20 | 23,492 | 1,906 | 8.1% |
| $20–$50 | 54,214 | 4,122 | 7.6% |
| $50–$100 | 49,593 | 4,041 | 8.1% |
| $100–$250 | 52,029 | 4,697 | 9.0% |
| $250–$500 | 33,401 | 3,425 | 10.3% |
| $500–$1k | 22,404 | 2,515 | 11.2% |
| $1k+ | 11,060 | 1,874 | 16.9% |

Classic non-linear U. The $2–$5 spike (**47.9%**) dwarfs both its neighbors and the general micro bucket. $1k+ escalation (**16.9%**) is the other arm — high-value extraction after testing. Fires §5.6 `amount_spike`.

## Finding 3 — Signature capture is a 2.3× protective factor, and it's concentrated: only 19% of transactions have a signature

| signature_provided | n | fraud | rate |
|---|---|---|---|
| 1 (signed) | 47,995 | 2,178 | **4.54%** |
| 0 (no sig) | 206,229 | 21,902 | **10.62%** |

This is the highest-leverage single binary flag in the feature set. Likely mechanism: chip/PIN and signature-required channels carry intrinsic verification friction that raises the attacker's cost. Worth surfacing to investigators as an explanatory axis.

## Finding 4 — Subsector fraud rates split cleanly into a "high-risk 5" and a "low-risk tail"

Top fraud subsectors (n ≥ 500):

| Subsector | n | rate |
|---|---|---|
| luxury goods | 35,946 | **14.03%** |
| consumer electronics | 39,851 | 12.19% |
| internet | 39,198 | 11.95% |
| insurance | 37,594 | 11.16% |
| gas | 41,388 | 10.73% |

Low-risk tail:

| Subsector | n | rate |
|---|---|---|
| advertising services | 975 | 0.62% |
| flights | 655 | 0.76% |
| semiconductors | 881 | 0.91% |
| beauty & personal care | 3,614 | 0.91% |
| restaurant/dining | 12,024 | 1.01% |

High-risk subsectors are fungible-goods / online-deliverable (luxury, electronics, internet) — the economically rational targets for card-not-present fraud. Low-risk subsectors are either B2B (advertising, semiconductors) or identity-friction heavy (flights require travel docs). `subsector_freq` already encodes this as the strongest univariate linear feature (corr −0.145).

## Finding 5 — Fraud concentrates at overnight hours (2–6 AM), with hour 3 running at 18.6%, 2× baseline

| Hour | n | fraud | rate |
|---|---|---|---|
| 3 | 1,202 | 224 | **18.64%** |
| 4 | 900 | 166 | 18.44% |
| 2 | 1,982 | 253 | 12.76% |
| 5 | 844 | 124 | 14.69% |
| 6 | 1,496 | 187 | 12.50% |
| 1 | 2,993 | 369 | 12.33% |
| 0 | 13,106 | 1,036 | 7.90% |

The sharpest spike is 3 AM at 18.6% (just under the formal §5.6 temporal trigger of 2× = 18.94%). Treating 2–6 AM as a single "overnight window" yields 12.5–18.6% across five hours against a baseline of 9.5%. Note hour 0 (midnight) is *low* (7.9%) — the spike is in the small hours, not "any time that's dark".

## Finding 6 — 46 merchants carry fraud rates > 3× baseline; the top 10 concentrate 30–82% fraud and account for ~5,500 transactions

Top 10 merchants with n ≥ 50:

| merchant_id | n | fraud | rate |
|---|---|---|---|
| M_ID_d8ccfbe91b | 83 | 68 | **81.93%** |
| M_ID_318c1d6957 | 51 | 25 | 49.02% |
| M_ID_e93df2c7cc | 79 | 38 | 48.10% |
| M_ID_629e6f07c9 | 50 | 24 | 48.00% |
| M_ID_9e84cda3b1 | 393 | 161 | 40.97% |
| M_ID_3111c6df35 | 626 | 254 | 40.58% |
| M_ID_445742726b | 790 | 306 | 38.73% |
| M_ID_52d3026407 | 55 | 21 | 38.18% |
| M_ID_6f274b9340 | 824 | 301 | 36.53% |
| M_ID_fc7d7969c3 | 2,114 | 765 | 36.19% |

Across merchants with n ≥ 20, **46 carry fraud rates > 3× baseline**; together they hold 6,784 transactions and 2,650 fraud cases — **11% of all fraud concentrated in 0.07% of the merchant base.** These aren't just model features; they're **investigation leads.** Fires §5.6 `merchant_concentration`.

## Finding 7 — The distance-velocity interaction is sample-thin but dramatic: 284 transactions at >200 km + ≥2/h show 50% fraud

| Scenario | n | rate |
|---|---|---|
| distance > 200km only | 250,510 | 9.49% |
| velocity ≥ 2/h only | 283 | 49.31% |
| **both** | **284** | **50.00%** |

The interaction doesn't multiply — velocity alone already dominates. Classic confounding: high-velocity transactions tend to already span geography (travel or bot testing). The `impossible_travel_flag` (>800 km/h) on its own shows *inverse* signal (7.7% when flagged) — the most likely reading is that very-fast-travel flags fire on ordinary CNP transactions between separated card/merchant registrations, not on ground-truth geographic impossibility. **Keep distance, but don't expect it to be a standalone lead.**

## Finding 8 — The 65+ age bucket is protected (5.8% fraud vs 9.5% baseline); 18–24 runs the hottest (10.9%)

| age_bucket | n | rate |
|---|---|---|
| 0 (<25) | 37,499 | 10.90% |
| 1 (25–34) | 55,387 | 10.40% |
| 2 (35–49) | 67,298 | 10.25% |
| 3 (50–64) | 44,598 | 9.98% |
| 4 (65+) | 49,442 | **5.82%** |

Monotone decline except for the sharp drop at 65+. Likely driven by spending mix (elders make fewer online / high-risk-subsector purchases) rather than any intrinsic fraud resistance — useful model feature, not a stand-alone story.

---

## Typology inventory

| Typology | Present? | Evidence |
|---|---|---|
| **Card testing** | **Yes** | $2–$5 bucket @ 47.9% fraud; v1h ≥ 3 & amt < $10 → 60% on 10 rows |
| **Merchant compromise** | **Yes** | 40 merchants with fraud ≥ 30% (n ≥ 20); 6,283 transactions |
| **Account takeover** | Weak | tenure > 180 & dev > 5× & v ≥ 2/h → 33% on 6 rows. Signal exists but sample thin |
| **Impossible travel** | No (spurious) | Flag fires on 4,306 rows at 7.7% fraud — below baseline. Mechanism is data join, not fraud |
| **Bust-out** | No | tenure > 365 & amt > $1k & prior > 20 → 10.5% on 237 rows, at baseline |

---

## TRIGGERS

```
TRIGGERS:
  - merchant_concentration  → add merchant_fraud_rate (training-only)   [46 merchants > 3x baseline]
  - amount_spike            → add is_micro_transaction (amount < $5)    [$2–$5 bucket @ 47.9% vs adjacent ~12%]
  - velocity_step           → add velocity_above_1_per_hour              [v1h=1 is 22.9% vs v1h=0 9.1% — 2.5x step]
```

**Decision:** all three triggers will be addressed in **Loop 1** (single incremental feature-engineering pass adds three features), then Phase 5 re-runs to verify. This stays within the §5.6 two-loop budget and the §5.6 feature-build guardrails (merchant_fraud_rate must be training-only to avoid leakage).

---

## Pass 1 Verification (post Loop 1)

Three features added to `features.parquet` (now 32 features + label + key). Signals verified:

| Feature | Flagged n | Fraud rate (flagged) | Fraud rate (unflagged) | Multiplier | Univariate corr |
|---|---|---|---|---|---|
| `is_micro_transaction` | 1,481 | **47.87%** | 9.25% | 5.17× | −0.100 |
| `velocity_above_1_per_hour` | 5,884 | **24.17%** | 9.12% | 2.65× | −0.077 |
| `merchant_fraud_rate` (continuous) | — | monotone: <5% bucket 1.2%, 50%+ bucket **65.6%** | — | 55× spread | **−0.279** (new strongest linear predictor) |

**Interaction:** `is_micro_transaction=1 AND velocity_above_1_per_hour=1` → 127 rows at **77.95% fraud** — the cleanest card-testing fingerprint in the dataset.

**Leakage escalation for Phase 6.** Orientation confirmed all labeled rows are Jan–Dec 2017 and all unlabeled (pending) rows are Jan–Apr 2018. The "`purchase_date < 2018-01-01`" training cutoff used by the incremental build therefore degenerates to "all labeled rows." `merchant_fraud_rate` in the matrix is computed on the full labeled set; using it in random-CV evaluation would leak the target. **Phase 6 must recompute `merchant_fraud_rate` per fold on the fold's training subset only.** No §5.6 loop budget is consumed by this — it's a modeling discipline note, not a feature redesign.

**No additional triggers fire on Pass 1 verification.** Loop count: **1 / 2** consumed. Proceeding to Phase 6.

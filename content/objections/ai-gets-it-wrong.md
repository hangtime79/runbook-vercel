---
id: ai-gets-it-wrong
title: What if the AI writes the wrong SQL and an investigator acts on it?
who: Head of Fraud
theme: ai-risk
anchor: ask-button
---

## They say
"Text-to-SQL makes things up. If it gets a number wrong in a case, that's on my team."

## Why they ask
Investigators act on what they see. A confident wrong answer is worse than no answer.

## Answer
It can be wrong, and published research agrees that accuracy drops on real enterprise databases. So the design doesn't ask you to trust it. Every answer shows the SQL it ran, the rows it got, and that the database was opened read-only. An investigator can accept it or hand it to an analyst to check, and the AI never acts on an account. We also test it: on our question set, all three allowlisted models got 5 of 5 correct against an oracle. That is a small set, so treat it as evidence of the method, not a guarantee.

## Show
Click the Ask button, then the Evidence card: SQL, rows, "opened read-only".

## Don't say
Don't say the AI is accurate. Say the evidence is checkable.

## Sources
- demo-script.md, Beat 1.2 and Beat 4.4 (model table, "The AI proposes; the evidence card shows its work")
- objections-research.md R-34

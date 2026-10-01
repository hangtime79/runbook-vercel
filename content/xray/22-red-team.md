---
id: red-team
title: "I tried to break it."
act: Act 4
beat: Beat 4.1
route: /governance
fast: keep
---

## What
The header of the Ask the data panel. Act 4 is about AI in usage: the tool does one job, and a second model makes sure.

## Tell
Tell the story straight, in about 60 seconds. It happened. Act 4 depends on the scope gate being built and promoted; until then, tell this beat as a story and skip the live blocked question.

## Say
When I first put this in production I red-teamed it myself. I asked it about a named person. It said the data has no names, which is right. I told it to go to the internet; it said it couldn't. Then I asked if it could write Python for that. It offered to, and offered to show me *how to query public sources* about that person. Then I asked for a geometry script and it wrote forty lines of Python. Nothing unsafe touched your data; the database lock held. But your fraud tool had just offered to help research a private individual. That's the failure mode nobody writes a test for: **not the AI doing something wrong with your data, the AI quietly becoming a different tool.**

## Craft
Lead with your own failure. Tell it plainly, name the failure mode, and only then show the fix.

## Watch out
In the fast run, tell one line of this story.

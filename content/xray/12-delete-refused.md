---
id: delete-refused
title: "Delete all the fraud rows."
act: Act 1
beat: Beat 1.2
route: /story
fast: keep
---

## What
The question box in the Ask panel. This is where you type the destructive request on purpose.

## Tell
Turn to the CIO and say the first line, then type the question. The model declines ("I can't delete or modify data."). With the scope gate in place, the refusal comes from the checker instead: a SCOPE CHECK card, *write_request*.

## Say
And it can only read. Watch.

That's the AI behaving. You shouldn't have to rely on that, so there are two locks that don't: the database file is opened read-only, and every statement must parse as a single SELECT before it runs. A prompt is not a permission. You'll see those locks tested on every change in a minute.

Blocked before the AI even saw it. I'll show you how in a few minutes.

## CIO
Two locks that do not depend on what the model was told: a read-only database file, and a single-SELECT parse.

## Show
Type *Delete all the fraud rows.* and press Enter.

## Craft
Plant and pay off. Promise the tests here, then point back to this moment in Act 3 (stop 20) and show the second lock in Act 4 (stops 22 to 24). Trying the worst case live also raises the CIO's fear before they do.

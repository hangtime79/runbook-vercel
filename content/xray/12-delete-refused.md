---
id: delete-refused
title: "Delete all the fraud rows."
act: Act 1
beat: Beat 1.2
route: /story
fast: keep
panel: yes
---

## What
The question box in the Ask panel. This is where you type the destructive request on purpose.

## Tell
Turn to the CIO and say the first line, then type the question. The SCOPE CHECK card appears (*write_request*): the checker blocks it before the answering model sees it.


## On Vercel
The checker model runs through the same AI Gateway, with the same OIDC identity: no new key and no new vendor contract. The two locks are in the app (read-only file, single-SELECT parse) and do not depend on any model. For the bank: a prompt is not a permission. *Source: demo-script.md, Beat 1.2 and Act 4, "Vercel underneath".*

## Say
And it can only read. Watch.

Blocked before the AI even saw it. I'll show you how in a few minutes. But you shouldn't have to rely on any model behaving, so there are two locks that don't: the database file is opened read-only, and every statement must parse as a single SELECT before it runs. A prompt is not a permission. You'll see those locks tested on every change in a minute.

## CIO
Two locks that do not depend on what the model was told: a read-only database file, and a single-SELECT parse.

## Show
Type *Delete all the fraud rows.* and press Enter.

## Craft
Plant and pay off. Promise the tests here, then point back to this moment in Act 3 (stop 20) and show the second lock in Act 4 (stops 22 to 24). Trying the worst case live also raises the CIO's fear before they do.

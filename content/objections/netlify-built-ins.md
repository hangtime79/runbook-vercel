---
id: netlify-built-ins
title: Netlify has forms, A/B tests and a database built in. Why not that?
who: Either
theme: competitor
anchor: tension
---

## They say
"A colleague uses Netlify. It has forms, split testing and a Postgres database out of the box."

## Why they ask
Built-in features look cheaper than assembling parts, and a team that is not committed to Next.js sees little reason to pick Vercel.

## Answer
For those features, Netlify does win, and Vercel's own comparison page says so: Netlify has split testing, form handling with no backend, native serverless Postgres, and commercial use on its free plan. Netlify's docs confirm built-in forms. If your tool needs forms or A/B tests, that is a fair reason to pick it. This app does not: it is a read-only analytics app with an AI question box. The governance question is the same on both. Netlify Enterprise lists SSO and SCIM, log drains, a 99.99% SLA and 24/7 support, so the controls also sit on the top tier. Whether you can run it in a bank depends on the contract terms, not the feature list.

## Show
The thesis slide.

## Don't say
Don't say Vercel has built-in forms or A/B testing. Don't say Netlify lacks governance features. I did not check Netlify Identity.

## Sources
- objections-research.md R-04, R-50
- verification-2026-10.md V-101

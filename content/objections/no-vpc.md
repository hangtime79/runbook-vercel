---
id: no-vpc
title: Can it sit inside our private network, or does it need a public path?
who: CIO
theme: sovereignty
anchor: where-runs
---

## They say
"Our data sits in a VPC. I was told Vercel can't deploy into one."

## Why they ask
A bank wants backends reachable only from known addresses, and wants private links rather than the public internet.

## Answer
By default Vercel deployments can come from any IP address, so there is nothing to allowlist. Secure Compute is the answer, and it is an Enterprise feature with custom pricing. It gives a dedicated network in its own VPC with static IPs, VPC peering to an AWS VPC, and a site-to-site VPN to Azure, Google Cloud or an on-premises network. Pro has a lighter option, Static IPs from a shared pool at $100 per month per project, with no peering. AWS PrivateLink needs Advanced Networking on the team. Limits to know: the Edge runtime and Routing Middleware do not use the dedicated addresses; the large-functions beta and the 1,800-second duration beta are not supported; traffic that leaves the private network over the public internet is billed at $0.15 per GB; and self-service setup is not open to every Enterprise team. What you saw today runs on Hobby, so none of this is on screen.

## Show
Nothing live. Say which tier it belongs to.

## Don't say
Don't say Vercel deploys into your own cloud account; Bring Your Own Cloud on AWS is private beta. Don't say Static IPs give peering.

## Sources
- objections-research.md R-46
- governance-research.md §2 (Network)
- verification-2026-10.md V-73, V-74

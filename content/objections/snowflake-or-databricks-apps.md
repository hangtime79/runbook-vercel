---
id: snowflake-or-databricks-apps
title: Why not Streamlit in Snowflake or Databricks Apps, next to the data?
who: Either
theme: competitor
anchor: connect
---

## They say
"The data lives in the warehouse. A warehouse-native app keeps it there and uses the warehouse's access controls."

## Why they ask
Data gravity, one access model, no new credential path.

## Answer
For a Python dashboard on warehouse data, that is a strong option, and I'd say so. Snowflake describes building apps that use data in Snowflake without moving data or code to an external system, with access through its role-based controls. Databricks Apps ties into Unity Catalog and runs Streamlit, Dash, React and Node frameworks too. Where this approach differs: the app, its AI tool loop and its change control live on one platform whatever the data source is, and Connect is how it would reach your Snowflake with a short-lived token instead of a stored one. That part needs a dry run before I promise scopes. If your whole estate is in one warehouse and your tools are dashboards, stay there.

## Show
The warehouse card: what Connect would do, and that it's the next step.

## Don't say
Don't promise which Snowflake scopes or token subjects Connect supports. Don't state Streamlit limits; they weren't verified.

## Sources
- demo-script.md, Act 5 (placeholder) and "Do not claim"
- vercel-positioning.md §3 (Vercel Connect + Snowflake) and §5 (Streamlit)
- objections-research.md R-08, R-09

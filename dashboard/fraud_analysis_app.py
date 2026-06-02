"""
Fraud Analysis Dashboard — skeleton.

Dataset-agnostic view layer. Reads everything from artifacts/. Never trains,
joins, or recomputes. Four tabs: Key Findings, Fraud Patterns, Detection
Model, Data Explorer.
"""

from pathlib import Path
import os
import pickle

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

ARTIFACTS = Path(__file__).parent.parent / "artifacts"
REPO_ROOT = Path(__file__).parent.parent


def _load_dotenv():
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()

st.set_page_config(page_title="Fraud Analysis", layout="wide")


@st.cache_data
def load_golden_record():
    return pd.read_parquet(ARTIFACTS / "golden_record.parquet")


@st.cache_data
def load_features():
    return pd.read_parquet(ARTIFACTS / "features.parquet")


@st.cache_resource
def load_model():
    with open(ARTIFACTS / "model.pkl", "rb") as f:
        return pickle.load(f)


@st.cache_data
def load_shap_values():
    data = np.load(ARTIFACTS / "shap_values.npz", allow_pickle=True)
    return (
        data["values"],
        data["expected_value"],
        data["feature_names"],
        data["sample_indices"],
    )


@st.cache_data
def load_markdown(name: str) -> str:
    path = ARTIFACTS / name
    if not path.exists():
        return f"*Missing artifact: `{name}`*"
    return path.read_text()


@st.cache_data
def load_qa_context() -> str:
    parts = []
    narrative_path = REPO_ROOT / "NARRATIVE.md"
    if narrative_path.exists():
        parts.append(f"# NARRATIVE.md\n\n{narrative_path.read_text()}")
    for name in ("findings.md", "metrics.md", "shap.md", "orientation.md", "quality.md", "features_schema.md"):
        path = ARTIFACTS / name
        if path.exists():
            parts.append(f"# artifacts/{name}\n\n{path.read_text()}")
    return "\n\n---\n\n".join(parts)


def _col_present(df: pd.DataFrame, name: str) -> bool:
    return name in df.columns


st.title("Fraud Analysis")

tab0, tab1, tab2, tab3, tab4 = st.tabs(
    ["Narrative", "Key Findings", "Fraud Patterns", "Detection Model", "Data Explorer"]
)


with tab0:
    st.subheader("Ask the analysis")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        st.info("Set ANTHROPIC_API_KEY in .env to enable Q&A.")
    else:
        question = st.text_input(
            "Question",
            placeholder="e.g. What drives fraud at night? Why is AUC 0.68?",
            key="qa_question",
        )
        if question:
            try:
                from anthropic import Anthropic

                client = Anthropic(api_key=api_key)
                context = load_qa_context()
                system = [
                    {
                        "type": "text",
                        "text": (
                            "You are a fraud analytics assistant answering questions about a "
                            "completed card-fraud analysis. Answer only from the supplied context "
                            "(narrative, findings, metrics, SHAP, orientation, quality, feature schema). "
                            "If the answer isn't in the context, say so. Cite numbers verbatim. Keep "
                            "responses tight — 3-6 sentences unless the user asks for detail."
                        ),
                    },
                    {
                        "type": "text",
                        "text": f"<analysis_context>\n{context}\n</analysis_context>",
                        "cache_control": {"type": "ephemeral"},
                    },
                ]
                placeholder = st.empty()
                answer = ""
                with client.messages.stream(
                    model="claude-sonnet-4-6",
                    max_tokens=1024,
                    system=system,
                    messages=[{"role": "user", "content": question}],
                ) as stream:
                    for chunk in stream.text_stream:
                        answer += chunk
                        placeholder.markdown(answer)
            except Exception as e:
                st.error(f"Q&A failed: {e}")

    st.divider()
    narrative_path = REPO_ROOT / "NARRATIVE.md"
    if narrative_path.exists():
        st.markdown(narrative_path.read_text())
    else:
        st.info("NARRATIVE.md not found at repo root.")


with tab1:
    st.markdown(load_markdown("findings.md"))


with tab2:
    st.subheader("Fraud Patterns")
    gr = load_golden_record()

    labeled = gr[gr["authorized_flag"].notna()].copy() if _col_present(gr, "authorized_flag") else gr
    if _col_present(labeled, "authorized_flag"):
        labeled["is_fraud"] = (labeled["authorized_flag"] == 0).astype(int)
    else:
        labeled["is_fraud"] = 0

    if _col_present(labeled, "purchase_date") and not _col_present(labeled, "hour_of_day"):
        purchase_dt = pd.to_datetime(labeled["purchase_date"])
        labeled["hour_of_day"] = purchase_dt.dt.hour
        labeled["day_of_week"] = purchase_dt.dt.dayofweek

    if _col_present(labeled, "hour_of_day"):
        rate_by_hour = (
            labeled.groupby("hour_of_day")["is_fraud"].mean().reset_index(name="fraud_rate")
        )
        fig = px.bar(rate_by_hour, x="hour_of_day", y="fraud_rate", title="Fraud rate by hour")
        fig.update_xaxes(tickmode="linear", tick0=0, dtick=1, range=[-0.5, 23.5])
        fig.update_yaxes(tickformat=".1%")
        st.plotly_chart(fig, use_container_width=True)

    category_col = next(
        (c for c in ("merchant_category_code", "merchant_category", "category", "subsector_description", "item_category") if _col_present(labeled, c)),
        None,
    )
    if category_col:
        rate_by_cat = (
            labeled.groupby(category_col)["is_fraud"]
            .agg(["mean", "size"])
            .reset_index()
            .rename(columns={"mean": "fraud_rate", "size": "n"})
            .sort_values("fraud_rate", ascending=False)
            .head(25)
        )
        fig = px.bar(rate_by_cat, x=category_col, y="fraud_rate", title="Fraud rate by merchant category (top 25)")
        fig.update_yaxes(tickformat=".1%")
        st.plotly_chart(fig, use_container_width=True)

    amount_col = next(
        (c for c in ("purchase_amount", "amount", "transaction_amount") if _col_present(labeled, c)),
        None,
    )
    if amount_col:
        fig = px.histogram(
            labeled,
            x=amount_col,
            color=labeled["is_fraud"].map({0: "legit", 1: "fraud"}),
            nbins=60,
            barmode="overlay",
            opacity=0.6,
            title="Amount distribution by outcome",
        )
        st.plotly_chart(fig, use_container_width=True)

    if _col_present(labeled, "hour_of_day") and _col_present(labeled, "day_of_week"):
        heat = (
            labeled.groupby(["day_of_week", "hour_of_day"])["is_fraud"]
            .mean()
            .reset_index(name="fraud_rate")
            .pivot(index="day_of_week", columns="hour_of_day", values="fraud_rate")
            .reindex(index=range(7), columns=range(24))
        )
        fig = px.imshow(
            heat,
            labels={"x": "hour_of_day", "y": "day_of_week", "color": "fraud_rate"},
            x=list(range(24)),
            y=list(range(7)),
            aspect="auto",
            color_continuous_scale="Reds",
            title="Fraud rate heatmap — hour × day-of-week",
        )
        fig.update_xaxes(tickmode="linear", tick0=0, dtick=1)
        fig.update_yaxes(tickmode="linear", tick0=0, dtick=1)
        fig.update_coloraxes(colorbar_tickformat=".1%")
        st.plotly_chart(fig, use_container_width=True)


with tab3:
    st.subheader("Detection Model")
    st.markdown(load_markdown("metrics.md"))

    try:
        vals, expected, names, sample_idx = load_shap_values()
    except FileNotFoundError:
        st.info("SHAP values not yet computed.")
        vals = None

    if vals is not None:
        mean_abs = np.abs(vals).mean(axis=0)
        order = np.argsort(mean_abs)[::-1][:15]
        shap_df = pd.DataFrame(
            {"feature": [str(names[i]) for i in order], "mean_abs_shap": mean_abs[order]}
        )
        fig = px.bar(
            shap_df.sort_values("mean_abs_shap"),
            x="mean_abs_shap",
            y="feature",
            orientation="h",
            title="Global feature importance (mean |SHAP|)",
        )
        st.plotly_chart(fig, use_container_width=True)

    st.markdown(load_markdown("shap.md"))


with tab4:
    st.subheader("Data Explorer")
    features = load_features()
    amount_col = next(
        (c for c in ("purchase_amount", "amount", "transaction_amount") if _col_present(features, c)),
        None,
    )
    column_config = {}
    if amount_col:
        column_config[amount_col] = st.column_config.NumberColumn(format="$%.2f")
    for rate_col in [c for c in features.columns if "rate" in c.lower() or c.startswith("is_")]:
        if pd.api.types.is_numeric_dtype(features[rate_col]):
            column_config[rate_col] = st.column_config.NumberColumn(format="%.3f")

    st.dataframe(
        features.head(500),
        use_container_width=True,
        column_config=column_config,
    )

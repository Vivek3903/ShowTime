import pandas as pd

INPUT_CSV = "telugu_movies.csv"
OUTPUT_CSV = "telugu_movies_2011.csv"

df = pd.read_csv(INPUT_CSV)

df["Year"] = pd.to_numeric(
    df["Year"],
    errors="coerce"
)

filtered_df = df[
    df["Year"] > 2010
].copy()

filtered_df = filtered_df.sort_values(
    by="Year"
)

filtered_df.to_csv(
    OUTPUT_CSV,
    index=False
)

print(f"Saved: {OUTPUT_CSV}")

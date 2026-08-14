import os
import time
import requests
import pandas as pd


INPUT_CSV = "movies.csv"
OUTPUT_CSV = "telugu_movies.csv"

TMDB_ACCESS_TOKEN = os.getenv("TMDB_ACCESS_TOKEN")

REQUEST_DELAY = 0.25


# ============================================================
# CHECK TOKEN
# ============================================================

if not TMDB_ACCESS_TOKEN:

    print("❌ TMDB_ACCESS_TOKEN is not set.")
    print()
    print('Run:')
    print('export TMDB_ACCESS_TOKEN="YOUR_TOKEN_HERE"')
    exit(1)


# ============================================================
# SEARCH TMDB
# ============================================================

def search_movie(movie_name, year):

    url = "https://api.themoviedb.org/3/search/movie"

    headers = {
        "Authorization": f"Bearer {TMDB_ACCESS_TOKEN}",
        "accept": "application/json"
    }

    params = {
        "query": movie_name,
        "year": int(year)
    }

    try:

        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=15
        )

        response.raise_for_status()

        results = response.json().get(
            "results",
            []
        )

        if not results:
            return None

        movie_name_lower = (
            movie_name.lower().strip()
        )

        # Prefer exact title match
        for result in results:

            title = result.get(
                "title",
                ""
            ).lower().strip()

            original_title = result.get(
                "original_title",
                ""
            ).lower().strip()

            if (
                movie_name_lower == title
                or
                movie_name_lower == original_title
            ):
                return result

        # Otherwise use first result
        return results[0]

    except requests.RequestException as e:

        print(
            f"   ❌ TMDB request failed: {e}"
        )

        return None


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("======================================")
    print("       TELUGU MOVIE FILTER")
    print("======================================")
    print()

    df = pd.read_csv(INPUT_CSV)

    # --------------------------------------------------------
    # TEST ONLY
    # Remove .head(10) after successful test
    # --------------------------------------------------------

   # df = df.head(10)

    print(
        f"Movies to test: {len(df)}"
    )

    print()

    telugu_movies = []

    not_found = []

    not_telugu = []


    # ========================================================
    # PROCESS MOVIES
    # ========================================================

    for index, row in df.iterrows():

        movie_name = str(
            row["Movie"]
        )

        year = row["Year"]

        print(
            f"[{index + 1}/{len(df)}] "
            f"{movie_name} ({year})"
        )

        if pd.isna(year):

            print(
                "   ⚠️ Missing year → skipped"
            )

            not_found.append(movie_name)

            continue


        result = search_movie(
            movie_name,
            year
        )


        if not result:

            print(
                "   ❌ TMDB match not found"
            )

            not_found.append(movie_name)

            continue


        original_language = result.get(
            "original_language",
            ""
        )

        tmdb_title = result.get(
            "title",
            ""
        )

        tmdb_id = result.get(
            "id",
            ""
        )


        print(
            f"   TMDB: {tmdb_title}"
        )

        print(
            f"   Language: {original_language}"
        )


        # ====================================================
        # ONLY TELUGU
        # ====================================================

        if original_language == "te":

            print(
                "   ✅ TELUGU → KEEP"
            )

            movie_data = row.to_dict()

            # Add useful TMDB information
            movie_data["tmdb_id"] = tmdb_id
            movie_data["tmdb_title"] = tmdb_title
            movie_data["language"] = "Telugu"

            telugu_movies.append(
                movie_data
            )

        else:

            print(
                "   ❌ NOT TELUGU → SKIP"
            )

            not_telugu.append(
                movie_name
            )


        time.sleep(
            REQUEST_DELAY
        )


    # ========================================================
    # SAVE
    # ========================================================

    telugu_df = pd.DataFrame(
        telugu_movies
    )

    telugu_df.to_csv(
        OUTPUT_CSV,
        index=False
    )


    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print("======================================")
    print("              COMPLETE")
    print("======================================")
    print()

    print(
        f"Movies checked: {len(df)}"
    )

    print(
        f"Telugu movies kept: "
        f"{len(telugu_df)}"
    )

    print(
        f"Non-Telugu skipped: "
        f"{len(not_telugu)}"
    )

    print(
        f"TMDB matches not found: "
        f"{len(not_found)}"
    )

    print()

    print(
        f"Saved: {OUTPUT_CSV}"
    )


if __name__ == "__main__":
    main()

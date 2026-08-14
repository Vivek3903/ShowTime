import subprocess
import json
import pandas as pd
import cv2
import re
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

MOVIES_CSV = "telugu_movies.csv"

VIDEO_DIR = Path("videos")
FRAME_DIR = Path("frames")

OUTPUT_CSV = "frames.csv"

# Number of YouTube results to search
MAX_SEARCH_RESULTS = 8

# Maximum allowed trailer size
MAX_VIDEO_SIZE_MB = 60

# TEST MODE
# Keep 5 for testing.
# Change to None for the complete dataset.
START_MOVIE = 108
MAX_MOVIES = None


# ============================================================
# YOUTUBE TITLE FILTER
# ============================================================

# A video must contain one of these words
TRAILER_WORDS = [
    "trailer",
    "teaser"
]


# Only these six are blocked
BLOCKED_WORDS = [
    "full movie",
    "full film",
    "complete movie",
    "complete film",
    "movie full",
    "full hd movie"
]


# ============================================================
# CLEAN FILE/FOLDER NAME
# ============================================================

def clean_name(name):
    name = re.sub(
        r'[\\/*?:"<>|]',
        "",
        str(name)
    )

    name = name.strip()

    return name[:150]


# ============================================================
# SEARCH YOUTUBE
# ============================================================

def search_youtube(movie_name):

    query = f"{movie_name} official trailer"

    print()
    print(f"Searching YouTube: {query}")

    command = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        f"ytsearch{MAX_SEARCH_RESULTS}:{query}"
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("YouTube search failed.")
        return []

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Could not read YouTube search results.")
        return []

    entries = data.get("entries", [])

    results = []

    for entry in entries:

        if not entry:
            continue

        video_id = entry.get("id")
        title = entry.get("title", "")

        if not video_id:
            continue

        title_lower = title.lower()

        # ----------------------------------------------------
        # Block unwanted results
        # ----------------------------------------------------

        blocked = False

        for word in BLOCKED_WORDS:

            if word in title_lower:
                print(f"Blocked: {title}")
                blocked = True
                break

        if blocked:
            continue

        # ----------------------------------------------------
        # Require trailer or teaser
        # ----------------------------------------------------

        is_trailer = any(
            word in title_lower
            for word in TRAILER_WORDS
        )

        if not is_trailer:
            print(f"Not a trailer: {title}")
            continue

        # ----------------------------------------------------
        # Create YouTube URL
        # ----------------------------------------------------

        url = (
            "https://www.youtube.com/watch?v="
            + video_id
        )

        results.append({
            "url": url,
            "title": title
        })

    print(
        f"Valid trailer candidates: {len(results)}"
    )

    return results


# ============================================================
# GET VIDEO SIZE
# ============================================================

def get_video_size(url):

    print("Checking video size...")

    command = [
        "yt-dlp",
        "--print",
        "%(filesize,filesize_approx)s",
        "--skip-download",
        "-f",
        "best[ext=mp4]",
        url
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return None

    try:

        size_text = result.stdout.strip()

        if not size_text:
            return None

        size_text = size_text.splitlines()[-1].strip()

        if size_text in ["NA", "None"]:
            return None

        size_bytes = int(size_text)

        size_mb = size_bytes / (1024 * 1024)

        return size_mb

    except (ValueError, TypeError):

        return None


# ============================================================
# DOWNLOAD TRAILER
# ============================================================

def download_video(url, movie_name):

    clean_movie = clean_name(movie_name)

    # --------------------------------------------------------
    # Check estimated size
    # --------------------------------------------------------

    size_mb = get_video_size(url)

    if size_mb is None:

        print("Could not determine video size.")
        print("Skipping candidate.")

        return None

    print(
        f"Estimated size: {size_mb:.2f} MB"
    )

    if size_mb > MAX_VIDEO_SIZE_MB:

        print(
            f"Too large: {size_mb:.2f} MB"
        )

        print(
            f"Maximum allowed: "
            f"{MAX_VIDEO_SIZE_MB} MB"
        )

        return None

    # --------------------------------------------------------
    # Download
    # --------------------------------------------------------

    output_template = str(
        VIDEO_DIR / f"{clean_movie}.%(ext)s"
    )

    command = [
        "yt-dlp",
        "-f",
        "best[ext=mp4]",
        "-o",
        output_template,
        url
    ]

    print("Downloading...")

    result = subprocess.run(command)

    if result.returncode != 0:

        print("Download failed.")

        return None

    # --------------------------------------------------------
    # Find downloaded file
    # --------------------------------------------------------

    mp4_files = list(
        VIDEO_DIR.glob(
            f"{clean_movie}.mp4"
        )
    )

    if not mp4_files:

        print("Downloaded file not found.")

        return None

    return mp4_files[0]


# ============================================================
# EXTRACT THREE FRAMES
# ============================================================

def extract_frames(video_path, movie_name):

    cap = cv2.VideoCapture(
        str(video_path)
    )

    if not cap.isOpened():

        print("Could not open video.")

        return False

    total_frames = int(
        cap.get(cv2.CAP_PROP_FRAME_COUNT)
    )

    if total_frames <= 0:

        cap.release()

        print("Video contains no frames.")

        return False

    # --------------------------------------------------------
    # Create movie folder
    # --------------------------------------------------------

    movie_folder = (
        FRAME_DIR / clean_name(movie_name)
    )

    movie_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Three timeline positions
    # --------------------------------------------------------

    positions = {
        "25": 0.25,
        "50": 0.50,
        "75": 0.75
    }

    extracted = 0

    for label, percentage in positions.items():

        frame_number = int(
            total_frames * percentage
        )

        cap.set(
            cv2.CAP_PROP_POS_FRAMES,
            frame_number
        )

        success, frame = cap.read()

        if not success:

            print(
                f"Failed to extract {label}% frame."
            )

            continue

        filename = (
            f"frame_{label}percent.jpg"
        )

        output_path = (
            movie_folder / filename
        )

        cv2.imwrite(
            str(output_path),
            frame,
            [
                cv2.IMWRITE_JPEG_QUALITY,
                95
            ]
        )

        extracted += 1

        print(
            f"Frame {label}% saved."
        )

    cap.release()

    print(
        f"Extracted {extracted}/3 frames."
    )

    return extracted == 3


# ============================================================
# MAIN
# ============================================================

def main():

    # --------------------------------------------------------
    # Create directories
    # --------------------------------------------------------

    VIDEO_DIR.mkdir(
        exist_ok=True
    )

    FRAME_DIR.mkdir(
        exist_ok=True
    )

    # --------------------------------------------------------
    # Load Telugu + post-2010 dataset
    # --------------------------------------------------------

    df = pd.read_csv(
        MOVIES_CSV
    )
    df = df.iloc[START_MOVIE - 1:]
    if MAX_MOVIES is not None:

        df = df.head(
            MAX_MOVIES
        )

    # --------------------------------------------------------
    # Existing records
    #
    # If frames.csv already exists, load it so successful
    # movies don't need to be processed again.
    # --------------------------------------------------------

    if Path(OUTPUT_CSV).exists():

        existing_df = pd.read_csv(
            OUTPUT_CSV
        )

    else:

        existing_df = pd.DataFrame(
            columns=[
                "movie",
                "year",
                "genre",
                "youtube_title",
                "youtube_url"
            ]
        )

    all_records = existing_df.to_dict(
        "records"
    )

    processed_movies = set(
        existing_df["movie"].astype(str)
    )


    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    print()
    print("====================================")
    print("       SHOWTIME DATASET BUILDER")
    print("====================================")
    print()

    print(
        f"Movies to process: {len(df)}"
    )

    print(
        f"Maximum trailer size: "
        f"{MAX_VIDEO_SIZE_MB} MB"
    )

    print()

    # ========================================================
    # PROCESS MOVIES
    # ========================================================

    for index, row in df.iterrows():

        movie_name = str(
            row["Movie"]
        )

        print()
        print("------------------------------------")
        print(
            f"[{index + 1}/{len(df)}] "
            f"{movie_name}"
        )
        print("------------------------------------")

        # ----------------------------------------------------
        # Skip already processed movies
        # ----------------------------------------------------

        if movie_name in processed_movies:

            print(
                "Already processed. Skipping."
            )

            continue

        # ----------------------------------------------------
        # Search YouTube
        # ----------------------------------------------------

        search_results = search_youtube(
            movie_name
        )

        if not search_results:

            print(
                "No suitable trailer found."
            )

            continue

        successful_video = None

        # ====================================================
        # TRY TRAILER CANDIDATES
        # ====================================================

        for attempt, trailer in enumerate(
            search_results,
            start=1
        ):

            print()
            print(
                f"Candidate "
                f"{attempt}/"
                f"{len(search_results)}"
            )

            print(
                f"Title: "
                f"{trailer['title']}"
            )

            print(
                f"URL: "
                f"{trailer['url']}"
            )

            video_path = download_video(
                trailer["url"],
                movie_name
            )

            if video_path:

                print(
                    "Download successful."
                )

                successful_video = {
                    "path": video_path,
                    "url": trailer["url"],
                    "title": trailer["title"]
                }

                break

            print(
                "Trying next candidate..."
            )

        # ----------------------------------------------------
        # No trailer worked
        # ----------------------------------------------------

        if not successful_video:

            print(
                "All trailer candidates failed."
            )

            continue

        # ====================================================
        # EXTRACT THREE FRAMES
        # ====================================================

        success = extract_frames(
            successful_video["path"],
            movie_name
        )

        # ----------------------------------------------------
        # Delete video
        # ----------------------------------------------------

        try:

            successful_video["path"].unlink()

            print(
                "Temporary video deleted."
            )

        except Exception:

            print(
                "Could not delete temporary video."
            )

        # ----------------------------------------------------
        # Only save metadata if all 3 frames succeeded
        # ----------------------------------------------------

        if not success:

            print(
                "Movie skipped because "
                "all 3 frames were not extracted."
            )

            continue

        # ----------------------------------------------------
        # ONE CSV ROW PER MOVIE
        # ----------------------------------------------------

        record = {
            "movie": movie_name,
            "year": row["Year"],
            "genre": row["Genre"],
            "youtube_title":
                successful_video["title"],
            "youtube_url":
                successful_video["url"]
        }

        all_records.append(
            record
        )

        processed_movies.add(
            movie_name
        )

        # ----------------------------------------------------
        # Save after every successful movie
        # ----------------------------------------------------

        output_df = pd.DataFrame(
            all_records
        )

        output_df.to_csv(
            OUTPUT_CSV,
            index=False
        )

        print(
            "Metadata saved to frames.csv."
        )

    # ========================================================
    # FINAL OUTPUT
    # ========================================================

    output_df = pd.DataFrame(
        all_records
    )

    output_df.to_csv(
        OUTPUT_CSV,
        index=False
    )

    print()
    print("====================================")
    print("🎉 DATASET CREATION COMPLETE")
    print("====================================")

    print(
        f"Movies recorded: "
        f"{len(output_df)}"
    )

    print(
        f"CSV saved: "
        f"{OUTPUT_CSV}"
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()

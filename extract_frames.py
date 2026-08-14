import cv2
from pathlib import Path

VIDEO_DIR = Path("videos")
FRAME_DIR = Path("frames")

FRAME_DIR.mkdir(exist_ok=True)


def extract_three_frames(video_path):
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print(f"❌ Could not open: {video_path.name}")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    if total_frames <= 0:
        print(f"❌ No frames found: {video_path.name}")
        cap.release()
        return

    movie_name = video_path.stem
    output_dir = FRAME_DIR / movie_name
    output_dir.mkdir(parents=True, exist_ok=True)

    # 3 different points in the video
    positions = {
        "25": int(total_frames * 0.25),
        "50": int(total_frames * 0.50),
        "75": int(total_frames * 0.75),
    }

    print(f"\n🎬 {video_path.name}")
    print(f"Total frames: {total_frames}")
    print(f"FPS: {fps:.2f}")

    for percentage, frame_number in positions.items():

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

        success, frame = cap.read()

        if not success:
            print(f"⚠️ Failed at {percentage}%")
            continue

        output_file = output_dir / f"frame_{percentage}percent.jpg"

        cv2.imwrite(
            str(output_file),
            frame,
            [cv2.IMWRITE_JPEG_QUALITY, 95]
        )

        timestamp = frame_number / fps if fps > 0 else 0

        print(
            f"✅ {percentage}% → "
            f"{timestamp:.2f}s → {output_file.name}"
        )

    cap.release()


def main():

    videos = list(VIDEO_DIR.glob("*.mp4"))

    if not videos:
        print("❌ No MP4 videos found in videos/")
        return

    for video in videos:
        extract_three_frames(video)

    print("\n🎉 Extraction completed!")


if __name__ == "__main__":
    main()

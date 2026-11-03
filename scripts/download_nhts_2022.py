"""Download and extract the official 2022 NHTS CSV archive.
Run: python scripts/download_nhts_2022.py
Official source: https://nhts.ornl.gov/downloads
"""
from pathlib import Path
from urllib.request import urlopen, Request
from zipfile import ZipFile, BadZipFile
from io import BytesIO
import shutil

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
URL = "https://nhts.ornl.gov/assets/2022/download/csv.zip"

print("Downloading official 2022 NHTS CSV archive from nhts.ornl.gov …")
request = Request(URL, headers={"User-Agent": "MoveSense student research project"})
try:
    with urlopen(request, timeout=90) as response:
        payload = response.read()
except Exception as exc:
    raise SystemExit(f"Download failed: {exc}\nOpen {URL} in your browser and download the CSV ZIP manually.")

try:
    archive = ZipFile(BytesIO(payload))
except BadZipFile:
    raise SystemExit("The downloaded response was not a ZIP file. Download the CSV ZIP manually from https://nhts.ornl.gov/downloads")

members = [n for n in archive.namelist() if n.lower().endswith(".csv") and "trip" in Path(n).name.lower()]
if not members:
    print("No trip-named CSV found. Archive CSV files:")
    print("\n".join(n for n in archive.namelist() if n.lower().endswith(".csv")))
    raise SystemExit("Could not identify the trip CSV automatically; inspect the archive and extract the trip-level CSV to data/nhts_2022_trip.csv.")
# Prefer canonical public-use trip file names if present.
chosen = next((n for n in members if Path(n).name.lower() in {"trippub.csv", "trip.csv", "trip_public.csv"}), members[0])
out = DATA_DIR / "nhts_2022_trip.csv"
with archive.open(chosen) as src, out.open("wb") as dst:
    shutil.copyfileobj(src, dst)
print(f"Extracted {chosen} to {out}")
print("Use the Dataset and Features page to upload this file, then verify TRIPMODE codes 01/02 against the 2022 NHTS V2.1 codebook.")

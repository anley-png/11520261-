#!/usr/bin/env python3
"""Generate every Arabic Letter Island clip with SILMA TTS V1.

Reads the ids and Arabic text from src/data/manifestWords.ts (the same ids the
app plays from /audio/<id>.mp3) and writes one MP3 per entry.

    pip install silma-tts            # needs ffmpeg on PATH
    python tools/generate_audio.py                      # bundled SILMA voice
    python tools/generate_audio.py --ref ref/voice.wav --ref-text "words spoken"
    python tools/generate_audio.py --ids w001 s02_01    # only some clips
    python tools/generate_audio.py --out public/audio --force

SILMA TTS clones the voice of a reference recording. If --ref is omitted, the
reference sample that ships inside the silma-tts package is used.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "src" / "data" / "manifestWords.ts"

# Text spoken in the reference clip that is bundled with silma-tts.
DEFAULT_REF_TEXT = (
    "ويدقق النظر في القرآن الكريم وسائر الكتب السماوية "
    "ويتبع مسالك الرسل العظام عليهم الصلاة والسلام."
)

HARAKAT = re.compile(r"[\u064B-\u0652\u0670]")
TATWEEL = "\u0640"

# A bare letter is read as its name ("ب" -> baa), not as a lone consonant.
LETTER_NAMES = {
    "أ": "أَلِف", "ا": "أَلِف", "ب": "بَاء", "ت": "تَاء", "ث": "ثَاء",
    "ج": "جِيم", "ح": "حَاء", "خ": "خَاء", "د": "دَال", "ذ": "ذَال",
    "ر": "رَاء", "ز": "زَاي", "س": "سِين", "ش": "شِين", "ص": "صَاد",
    "ض": "ضَاد", "ط": "طَاء", "ظ": "ظَاء", "ع": "عَيْن", "غ": "غَيْن",
    "ف": "فَاء", "ق": "قَاف", "ك": "كَاف", "ل": "لَام", "م": "مِيم",
    "ن": "نُون", "ه": "هَاء", "و": "وَاو", "ي": "يَاء",
}


def _load_array(src: str, name: str) -> list:
    start = src.index(f"export const {name}")
    open_at = src.index("= [", start) + 2
    close_at = src.index("\n];", open_at) + 2
    return json.loads(src[open_at:close_at])


def load_entries() -> list:
    src = MANIFEST.read_text(encoding="utf-8")
    return _load_array(src, "MANIFEST_LETTERS") + _load_array(src, "MANIFEST_WORDS")


def spoken_text(arabic: str) -> str:
    """Turn a manifest 'arabic' field into text SILMA should speak."""
    first = arabic.split("/")[0].strip()  # "أَ / اَ" -> "أَ"
    first = first.replace(TATWEEL, "")  # drop joining strokes of positional forms
    if not HARAKAT.search(first) and first in LETTER_NAMES:
        return LETTER_NAMES[first]
    return first


def to_mp3(wav_path: Path, mp3_path: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
         "-ac", "1", "-ar", "24000", "-b:a", "48k", str(mp3_path)],
        check=True,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ref", help="reference recording to clone (default: sample bundled with silma-tts)")
    ap.add_argument("--ref-text", default=None, help="exact words spoken in --ref")
    ap.add_argument("--out", default="audio", help="output folder (default: audio)")
    ap.add_argument("--ids", nargs="*", help="only generate these ids, e.g. w001 s02_01")
    ap.add_argument("--speed", type=float, default=0.85, help="1.0 = normal; lower is slower (default 0.85, good for learners)")
    ap.add_argument("--seed", type=int, default=1234, help="fixed seed so reruns sound the same")
    ap.add_argument("--force", action="store_true", help="overwrite clips that already exist")
    args = ap.parse_args()

    from silma_tts.api import SilmaTTS  # imported late so --help works without the model installed

    if args.ref:
        ref_file = args.ref
        if not args.ref_text:
            print("--ref-text is required with --ref (exact words spoken in the recording)", file=sys.stderr)
            return 2
        ref_text = args.ref_text
    else:
        from importlib.resources import files
        ref_file = str(files("silma_tts").joinpath("infer/ref_audio_samples/ar.ref.24k.wav"))
        ref_text = args.ref_text or DEFAULT_REF_TEXT

    entries = load_entries()
    if args.ids:
        wanted = set(args.ids)
        entries = [e for e in entries if e["id"] in wanted]
        missing = wanted - {e["id"] for e in entries}
        if missing:
            print("Unknown ids:", ", ".join(sorted(missing)), file=sys.stderr)
            return 2

    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True, exist_ok=True)

    # Diacritics are already in the manifest, so skip the extra tashkeel/normalizer models.
    tts = SilmaTTS(enable_normalizer=False, force_tashkeel=False)

    done = skipped = 0
    failed = []
    with tempfile.TemporaryDirectory() as tmp:
        for n, e in enumerate(entries, 1):
            mp3 = out / f"{e['id']}.mp3"
            if mp3.exists() and not args.force:
                skipped += 1
                continue
            text = spoken_text(e["arabic"])
            wav = Path(tmp) / f"{e['id']}.wav"
            try:
                tts.infer(
                    ref_file=ref_file,
                    ref_text=ref_text,
                    gen_text=text,
                    file_wave=str(wav),
                    seed=args.seed,
                    speed=args.speed,
                    remove_silence=True,
                    normalize_numbers=False,
                    force_tashkeel=False,
                )
                to_mp3(wav, mp3)
                done += 1
                print(f"[{n}/{len(entries)}] {e['id']}  {text}")
            except Exception as exc:  # keep going; report at the end
                failed.append(e["id"])
                print(f"[{n}/{len(entries)}] {e['id']} FAILED: {exc}", file=sys.stderr)

    print(f"\nGenerated {done}, skipped {skipped} existing, failed {len(failed)} -> {out}")
    if failed:
        print("Failed ids:", " ".join(failed), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

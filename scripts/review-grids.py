# Review helper: 6-up grids (960x540 tiles) of the per-shot stills, labelled by shot id.
import json, subprocess, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Advisory folder: EP=0002 (or EP=advisories/0002-slug), else the newest one.
_eps = sorted(d for d in os.listdir(f"{root}/advisories") if d[:4].isdigit())
_want = os.environ.get("EP", _eps[-1]).replace("advisories/", "").strip("/")
ep = "advisories/" + next(d for d in _eps if d == _want or d.startswith(_want + "-"))
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
ids = list(json.load(open(f"{root}/{ep}/scenes.json"))["shots"])
if len(sys.argv) > 2:
    ids = [i for i in ids if i in sys.argv[2:]]
font = f"{root}/video/public/fonts/IBMPlexMono-SemiBold.ttf"
for g in range(0, len(ids), 6):
    chunk = ids[g:g + 6]
    inputs, filt = [], []
    for i, sid in enumerate(chunk):
        inputs += ["-i", f"{root}/{ep}/out/review/{sid}.png"]
        filt.append(f"[{i}]scale=960:540,drawtext=fontfile={font}:text='{sid}':x=10:y=8:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.8[v{i}]")
    n = len(chunk)
    while n < 6:
        inputs += ["-f", "lavfi", "-i", "color=c=black:s=960x540:d=1"]
        filt.append(f"[{n}]null[v{n}]")
        n += 1
    filt.append("".join(f"[v{i}]" for i in range(6)) + "xstack=inputs=6:layout=0_0|960_0|0_540|960_540|0_1080|960_1080")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-frames:v", "1", f"{out}/g{g // 6:02d}.png"], check=True)
print(len(ids), "shots")

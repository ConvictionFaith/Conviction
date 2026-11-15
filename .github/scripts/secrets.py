"""Fail if anything that looks like a key, token or password is committed."""
import re, subprocess, sys

PATTERNS = {
    "Shopify access token": r"shp(at|ca|pa|ss)_[0-9a-fA-F]{32}",
    "GitHub token": r"gh[pousr]_[A-Za-z0-9]{36,}",
    "AWS key": r"AKIA[0-9A-Z]{16}",
    "Stripe key": r"(sk|rk)_live_[0-9a-zA-Z]{20,}",
    "Google API key": r"AIza[0-9A-Za-z\-_]{35}",
    "Private key": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "Slack token": r"xox[baprs]-[0-9A-Za-z-]{10,}",
    "Password in config": r"(?i)(password|passwd|secret)\s*[:=]\s*['\"][^'\"\s]{8,}['\"]",
}
files = subprocess.run(["git", "ls-files"], capture_output=True, text=True).stdout.split()
hits = []
for f in files:
    if f.endswith((".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff", ".woff2")) or f.startswith(".github/scripts/"):
        continue
    try:
        text = open(f, encoding="utf-8", errors="ignore").read()
    except OSError:
        continue
    for name, pat in PATTERNS.items():
        for m in re.finditer(pat, text):
            line = text.count("\n", 0, m.start()) + 1
            hits.append(f"{f}:{line}: possible {name}")
for h in hits:
    print("::error::" + h)
print(f"{len(hits)} possible secret(s)")
sys.exit(1 if hits else 0)

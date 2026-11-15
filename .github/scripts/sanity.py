"""Fail if any JSON file is invalid, a section schema is broken, a template
uses a setting that doesn't exist, or a Liquid block tag is left unclosed."""
import glob, json, re, sys

bad = []

def load_json(path):
    text = open(path, encoding="utf-8").read()
    text = re.sub(r"^\s*/\*.*?\*/", "", text, flags=re.S)  # Shopify's header comment
    return json.loads(text)

for f in glob.glob("**/*.json", recursive=True):
    if f.startswith(".github"):
        continue
    try:
        load_json(f)
    except Exception as e:
        bad.append(f"{f}: invalid JSON ({e})")

schemas = {}
for f in glob.glob("sections/*.liquid"):
    m = re.search(r"{%-?\s*schema\s*-?%}(.*?){%-?\s*endschema\s*-?%}", open(f, encoding="utf-8").read(), re.S)
    if not m:
        continue
    try:
        schemas[f[9:-7]] = json.loads(m.group(1))
    except Exception as e:
        bad.append(f"{f}: invalid schema JSON ({e})")

for f in glob.glob("templates/*.json") + glob.glob("sections/*-group.json"):
    try:
        data = load_json(f)
    except Exception:
        continue
    for key, sec in data.get("sections", {}).items():
        sch = schemas.get(sec.get("type"))
        if sch is None:
            if not str(sec.get("type", "")).startswith("_"):
                bad.append(f"{f}: section '{key}' uses missing type '{sec.get('type')}'")
            continue
        ids = {s["id"] for s in sch.get("settings", []) if "id" in s}
        for sk in sec.get("settings", {}):
            if sk not in ids:
                bad.append(f"{f}: section '{key}' has unknown setting '{sk}'")
        btypes = {b["type"]: {s["id"] for s in b.get("settings", []) if "id" in s} for b in sch.get("blocks", [])}
        for bk, b in sec.get("blocks", {}).items():
            if b["type"] not in btypes and "@app" not in btypes:
                bad.append(f"{f}: block '{bk}' uses missing type '{b['type']}'")

PAIRS = {"if": "endif", "unless": "endunless", "for": "endfor", "case": "endcase",
         "capture": "endcapture", "form": "endform", "paginate": "endpaginate"}
ENDS = {v: k for k, v in PAIRS.items()}
for f in glob.glob("**/*.liquid", recursive=True):
    src = open(f, encoding="utf-8").read()
    src = re.sub(r"{%-?\s*comment\s*-?%}.*?{%-?\s*endcomment\s*-?%}", "", src, flags=re.S)
    src = re.sub(r"{%-?\s*schema\s*-?%}.*?{%-?\s*endschema\s*-?%}", "", src, flags=re.S)
    stack = []
    for m in re.finditer(r"{%-?\s*(.*?)\s*-?%}", src, re.S):
        body = m.group(1)
        lines = [l.strip() for l in body[6:].split("\n")] if body.startswith("liquid") else [body]
        for line in lines:
            if not line:
                continue
            name = line.split()[0]
            if name in PAIRS:
                stack.append(name)
            elif name in ENDS:
                if not stack or stack[-1] != ENDS[name]:
                    bad.append(f"{f}: unexpected {name}")
                else:
                    stack.pop()
    if stack:
        bad.append(f"{f}: unclosed {stack}")

for b in bad:
    print("::error::" + b)
print(f"{len(bad)} problem(s)")
sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""
#479b CRITICAL — scan frontend bundle/src for sk_live_ secret key exposure.
Run: python3 scripts/scanSecretKeyExposure.py
"""
import os, re, sys

DANGER_PATTERNS = [
    r"sk_live_[a-zA-Z0-9]{20,}",
    r"sk_test_[a-zA-Z0-9]{20,}",
    r"rk_live_[a-zA-Z0-9]{20,}",
    r"whsec_[a-zA-Z0-9+/=]{20,}",
    r"RESEND_API_KEY\s*=\s*["']re_[a-zA-Z0-9]{20,}",
    r"TWILIO_AUTH_TOKEN\s*=\s*["'][a-zA-Z0-9]{30,}",
    r"OPENAI_API_KEY\s*=\s*["']sk-[a-zA-Z0-9]{20,}",
]

SCAN_DIRS = ["src", "public", "dist"]
SKIP_DIRS = {"node_modules", ".git", "__pycache__"}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2"}

found = []

for scan_dir in SCAN_DIRS:
    if not os.path.exists(scan_dir):
        continue
    for root, dirs, files in os.walk(scan_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if any(fname.endswith(e) for e in SKIP_EXTS):
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", errors="ignore") as f:
                    content = f.read()
                for pattern in DANGER_PATTERNS:
                    matches = re.findall(pattern, content)
                    if matches:
                        found.append({"file": fpath, "pattern": pattern, "count": len(matches)})
            except Exception:
                pass

if found:
    print(f"🚨 SECRET KEY EXPOSURE DETECTED — {len(found)} file(s):")
    for item in found:
        print(f"  {item['file']} — {item['count']} match(es) for pattern: {item['pattern'][:40]}")
    sys.exit(1)
else:
    print("✅ No secret key exposure detected in frontend source.")
    sys.exit(0)

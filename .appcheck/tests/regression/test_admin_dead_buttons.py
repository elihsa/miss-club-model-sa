#!/usr/bin/env python3
"""
REGRESSION TEST (appcheck, static dead-button guard for web apps):
Scans admin.html for inline onclick="fn(...)" handlers and verifies each
referenced function is exported to window.

Root cause caught: admin.html is loaded as type="module", so inline
onclick="deleteEvent(...)" threw "deleteEvent is not defined" because the
function was never exported to window. This test FAILS if any inline handler
references a function missing from the window.<fn> = ... export block.
"""
import re, sys

HTML = "admin.html"
BASE_URL = "https://missclubmodel.vercel.app"

def main():
    src = open(HTML, encoding="utf-8").read()

    # Collect function names referenced by inline onclick (or onchange) handlers.
    handlers = set()
    for m in re.finditer(r'\bon(?:click|change|input|submit|load)="\s*([A-Za-z_$][\w$]*)\s*\(', src):
        handlers.add(m.group(1))

    # Collect names exported to window (window.fn = ... and window.fn = () => ...).
    exports = set()
    for m in re.finditer(r'window\.([A-Za-z_$][\w$]*)\s*=', src):
        exports.add(m.group(1))

    # Functions defined at top level (const/function) are also global in non-module,
    # but since this is type="module", ONLY window exports are reachable from inline HTML.
    dead = sorted(handlers - exports)

    if not handlers:
        print("SKIP: no inline onclick handlers found in admin.html")
        return 0

    if dead:
        print(f"FAIL: inline handlers reference functions not exposed to window: {dead}")
        print("  admin.html is type='module'; every inline onclick must have a window.<fn> = <fn>; export.")
        return 1

    print(f"PASS: all {len(handlers)} inline handlers are exposed to window.")
    print("  handlers checked: " + ", ".join(sorted(handlers)))
    return 0

if __name__ == "__main__":
    sys.exit(main())
import os
import re

FONT_DIR = "public/fonts"

# Helper to clean up font family names
def clean_family(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

# Try to extract family, style, weight from filename
def parse_font_filename(filename):
    base = filename.replace('.woff2', '')
    # Try to match known patterns
    # e.g. roboto-KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA
    m = re.match(r'([a-z0-9-]+)[-_](italic|normal)?[-_]?(\d{3})?', base)
    if m:
        family = m.group(1)
        style = m.group(2) if m.group(2) else 'normal'
        weight = m.group(3) if m.group(3) else '400'
        return family, style, weight
    # Try to match e.g. lato-S6uyw4BMUTPHjxAwXjeu
    m = re.match(r'([a-z0-9-]+)[-_]', base)
    if m:
        family = m.group(1)
        style = 'normal'
        weight = '400'
        return family, style, weight
    # Fallback: use the whole base as family
    return base, 'normal', '400'

def main():
    seen = {}
    for fname in os.listdir(FONT_DIR):
        if not fname.endswith('.woff2'):
            continue
        old_path = os.path.join(FONT_DIR, fname)
        family, style, weight = parse_font_filename(fname)
        base_new_fname = f"{clean_family(family)}-{style}-{weight}"
        new_fname = f"{base_new_fname}.woff2"
        counter = 1
        while new_fname in seen or os.path.exists(os.path.join(FONT_DIR, new_fname)):
            new_fname = f"{base_new_fname}-{counter}.woff2"
            counter += 1
        seen[new_fname] = True
        new_path = os.path.join(FONT_DIR, new_fname)
        if old_path != new_path:
            print(f"Renaming: {fname} -> {new_fname}")
            os.rename(old_path, new_path)

if __name__ == "__main__":
    main() 
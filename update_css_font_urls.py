import os
import re

FONT_DIR = "public/fonts"
CSS_FILE = "generated_font_faces.css"
OUTPUT_CSS_FILE = "generated_font_faces_updated.css"

# Build a lookup of (family, style, weight) -> filename
def build_font_lookup():
    lookup = {}
    for fname in os.listdir(FONT_DIR):
        if not fname.endswith('.woff2'):
            continue
        m = re.match(r'([a-z0-9-]+)-(italic|normal)-(\d{3})(?:-(\d+))?\.woff2', fname)
        if m:
            family, style, weight, counter = m.groups()
            key = (family, style, weight)
            # If there are duplicates, prefer the one without a counter, else pick the first
            if key not in lookup or not counter:
                lookup[key] = fname
    return lookup

def clean_family(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def find_font_file(lookup, family, style, weight):
    # Try exact match
    key = (family, style, weight)
    if key in lookup:
        return lookup[key]
    # Try with extra 'normal' in style
    key2 = (family, style + '-normal', weight)
    if key2 in lookup:
        return lookup[key2]
    # Try with extra 'normal' in family
    key3 = (family + '-normal', style, weight)
    if key3 in lookup:
        return lookup[key3]
    # Try with both
    key4 = (family + '-normal', style + '-normal', weight)
    if key4 in lookup:
        return lookup[key4]
    return None

def update_css():
    lookup = build_font_lookup()
    with open(CSS_FILE, "r", encoding="utf-8") as f:
        css = f.read()

    def fontface_replacer(block):
        family = re.search(r"font-family:\s*'([^']+)'", block)
        style = re.search(r"font-style:\s*(\w+)", block)
        weight = re.search(r"font-weight:\s*(\d+)", block)
        if not (family and style and weight):
            return block
        family_clean = clean_family(family.group(1))
        style_val = style.group(1)
        weight_val = weight.group(1)
        fname = find_font_file(lookup, family_clean, style_val, weight_val)
        if not fname:
            print(f"Warning: No font file found for ({family_clean}, {style_val}, {weight_val})")
            return block
        # Replace the src line
        block = re.sub(
            r"src:\s*url\([^)]+\)\s*format\('woff2'\);",
            f"src: url('/fonts/{fname}') format('woff2');",
            block
        )
        return block

    # Replace all @font-face blocks
    css_updated = re.sub(
        r"(@font-face\s*\{[^}]+\})",
        lambda m: fontface_replacer(m.group(1)),
        css
    )

    with open(OUTPUT_CSS_FILE, "w", encoding="utf-8") as f:
        f.write(css_updated)
    print(f"Updated CSS written to {OUTPUT_CSS_FILE}")

if __name__ == "__main__":
    update_css() 
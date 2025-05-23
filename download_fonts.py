import requests
import re
import os
from pathlib import Path
import urllib.parse

# List of font families from FONT_PAIRINGS (deduplicated, Bebas corrected to Bebas Neue)
FONT_FAMILIES = sorted(list(set([
    "DM Serif Display", "DM Sans", "Ultra", "PT Serif", "Oswald", "Source Sans 3", 
    "Big Shoulders Display", "Inter", "Stint Ultra Expanded", "Pontano Sans", 
    "Fjalla One", "Cantarell", "Syne", "Yellowtail", "Lato", "Rubik", "Roboto Mono", 
    "League Spartan", "Work Sans", "Anton", "Roboto", "Teko", "Ubuntu", 
    "Philosopher", "Mulish", "Alfa Slab One", "Gentium Plus", "Archivo Black", 
    "Archivo", "Della Respira", "Open Sans", "Rozha One", "Questrial", "Bangers", 
    "Bebas Neue", "League Gothic", "Poppins", "Space Mono", "Lora", "Montserrat", 
    "Playfair Display", "Chivo", "Bricolage Grotesque"
])))

# List of fallback queries to try for fonts that fail the full axes query
AXES_QUERIES = [
    "ital,wght@0,100..900;1,100..900",  # Full axes
    "wght@400;700",                    # Regular and Bold
    ""                                  # No axes, just the family
]
FONT_DISPLAY_PARAM = "swap"  # Or "block"

OUTPUT_FONT_DIR = Path("public/fonts")
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def sanitize_filename(name):
    return re.sub(r'[^a-z0-9_.-]+', '-', name.lower())

def fetch_font_css(session, family_name):
    for axes in AXES_QUERIES:
        encoded_family_name = urllib.parse.quote_plus(family_name)
        if axes:
            font_api_url = f"https://fonts.googleapis.com/css2?family={encoded_family_name}:{axes}&display={FONT_DISPLAY_PARAM}"
        else:
            font_api_url = f"https://fonts.googleapis.com/css2?family={encoded_family_name}&display={FONT_DISPLAY_PARAM}"
        try:
            response = session.get(font_api_url)
            response.raise_for_status()
            return response.text, axes
        except requests.exceptions.RequestException as e:
            # Only print error for the last attempt
            if axes == AXES_QUERIES[-1]:
                print(f"  Error fetching CSS for {family_name}: {e}")
    return None, None

def download_fonts():
    OUTPUT_FONT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Font files will be saved to: {OUTPUT_FONT_DIR.resolve()}")
    all_css_rules = []
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    for family_name in FONT_FAMILIES:
        print(f"\nProcessing font family: {family_name}")
        css_content, used_axes = fetch_font_css(session, family_name)
        if not css_content:
            print(f"  All attempts failed for {family_name}. Skipping.")
            continue
        font_face_blocks = re.findall(r"(@font-face\s*\{.+?\})", css_content, re.DOTALL)
        if not font_face_blocks:
            print(f"  No @font-face blocks found for {family_name}. Skipping.")
            continue
        for block in font_face_blocks:
            ff_match = re.search(r"font-family:\s*['\"](.+?)['\"]", block, re.IGNORECASE)
            fs_match = re.search(r"font-style:\s*(\w+)", block, re.IGNORECASE)
            fw_match = re.search(r"font-weight:\s*(\d+)", block, re.IGNORECASE)
            src_match = re.search(r"src:\s*url\((https://fonts.gstatic.com/s/.*?\.woff2)\)", block, re.IGNORECASE)
            ur_match = re.search(r"unicode-range:\s*(.+?);", block, re.IGNORECASE)
            if not (ff_match and fs_match and fw_match and src_match):
                print(f"  Could not parse all required fields from a @font-face block for {family_name}. Skipping block.")
                continue
            actual_family = ff_match.group(1)
            style = fs_match.group(1)
            weight = fw_match.group(1)
            woff2_url = src_match.group(1)
            unicode_range = ur_match.group(1) if ur_match else None
            local_file_name_base = sanitize_filename(f"{actual_family}-{style}-{weight}")
            url_path_parts = Path(urllib.parse.urlparse(woff2_url).path).name
            potential_unique_part = Path(url_path_parts).stem
            if len(potential_unique_part) > 10 and potential_unique_part.isalnum():
                 local_file_name = f"{sanitize_filename(actual_family)}-{potential_unique_part}.woff2"
            else:
                 local_file_name = f"{local_file_name_base}.woff2"
            font_file_path = OUTPUT_FONT_DIR / local_file_name
            if not font_file_path.exists():
                try:
                    print(f"  Downloading: {actual_family} {style} {weight} -> {local_file_name}")
                    font_response = session.get(woff2_url)
                    font_response.raise_for_status()
                    with open(font_file_path, "wb") as f:
                        f.write(font_response.content)
                except requests.exceptions.RequestException as e:
                    print(f"    Error downloading {woff2_url}: {e}")
                    continue
            else:
                print(f"  Exists: {local_file_name}")
            css_rule = "@font-face {\n"
            css_rule += f"  font-family: '{actual_family}';\n"
            css_rule += f"  font-style: {style};\n"
            css_rule += f"  font-weight: {weight};\n"
            css_rule += f"  font-display: {FONT_DISPLAY_PARAM};\n"
            css_rule += f"  src: url('/fonts/{local_file_name}') format('woff2');\n"
            if unicode_range:
                css_rule += f"  unicode-range: {unicode_range};\n"
            css_rule += "}\n"
            all_css_rules.append(css_rule)
    if all_css_rules:
        print("\n\n--- Generated CSS @font-face rules ---")
        print("--- Copy the rules below into your styles/globals.css file ---")
        for rule in all_css_rules:
            print(rule)
        css_output_file = Path("generated_font_faces.css")
        with open(css_output_file, "w", encoding="utf-8") as f:
            for rule in all_css_rules:
                f.write(rule)
        print(f"\n--- CSS rules also saved to: {css_output_file.resolve()} ---")
    else:
        print("\nNo CSS rules generated. Check for errors above.")

if __name__ == "__main__":
    download_fonts() 
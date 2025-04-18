import os
import requests
import time
import sys
from dotenv import load_dotenv
import json # Import json for error parsing

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# API Key is now loaded from the .env file (BANNERBEAR_API_KEY=...)
BANNERBEAR_API_KEY = os.environ.get("BANNERBEAR_API_KEY")
BASE_URL = "https://api.bannerbear.com/v2"

# Range of Template Sets to process
START_SET_NUMBER = 12 # Start from 12 now
END_SET_NUMBER = 50 # Inclusive - Process up to 50

# Number of design/story templates per set (adjust if needed)
NUM_DESIGN_TEMPLATES = 10
NUM_STORY_TEMPLATES = 3

# --- Helper Functions ---

def make_request(method, endpoint, json_data=None):
    """Makes a request to the Bannerbear API and handles basic errors."""
    if not BANNERBEAR_API_KEY:
        print("Error: BANNERBEAR_API_KEY environment variable not set.", file=sys.stderr)
        sys.exit(1)

    headers = {"Authorization": f"Bearer {BANNERBEAR_API_KEY}", "Content-Type": "application/json"}
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.request(method, url, headers=headers, json=json_data)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        # Handle potential empty response body for successful PUT/DELETE etc.
        if response.status_code == 204: # No Content
            return True
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Request Error ({method} {url}): {e}", file=sys.stderr)
        error_message = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_body = e.response.json()
                error_message = error_body.get('message', e.response.text) 
            except json.JSONDecodeError:
                error_message = e.response.text
            print(f"Response Body: {error_message}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        return None

def list_all_paginated(endpoint):
    """Fetches all items from a paginated Bannerbear API endpoint."""
    results = []
    page = 1
    while True:
        print(f"Fetching page {page} for {endpoint}...")
        paginated_endpoint = f"{endpoint}?page={page}"
        data = make_request("GET", paginated_endpoint)
        if data is None:
            return None
        if not isinstance(data, list):
            print(f"Error: Expected a list from {paginated_endpoint}, but got {type(data)}.", file=sys.stderr)
            return None
        if not data:
            break
        results.extend(data)
        page += 1
        time.sleep(0.5)
    return results

def get_all_templates():
    """Gets a map of all template names to UIDs."""
    print("Fetching all templates from Bannerbear...")
    templates = list_all_paginated("/templates")
    if templates is None:
        print("Error: Failed to fetch templates.", file=sys.stderr)
        return None
    print(f"Successfully fetched {len(templates)} templates.")
    return {t['name']: t['uid'] for t in templates if 'name' in t and 'uid' in t}

def get_all_template_sets():
    """Gets a map of all template set names to their data (uid, template_uids)."""
    print("Fetching all template sets from Bannerbear...")
    template_sets = list_all_paginated("/template_sets")
    if template_sets is None:
        print("Error: Failed to fetch template sets.", file=sys.stderr)
        return None
    print(f"Successfully fetched {len(template_sets)} template sets.")
    return {
        ts['name']: {
            'uid': ts['uid'],
            'templates': [t['uid'] for t in ts.get('templates', []) if 'uid' in t]
         }
        for ts in template_sets if 'name' in ts and 'uid' in ts
    }

def update_template_set(template_set_uid, template_uids_to_add):
    """Updates an existing template set using the PUT endpoint."""
    endpoint = f"/template_sets/{template_set_uid}"
    payload = {"templates": template_uids_to_add}
    print(f"Updating template set {template_set_uid} with {len(template_uids_to_add)} templates...")
    result = make_request("PUT", endpoint, json_data=payload)
    if result:
        print(f"Successfully updated template set {template_set_uid}")
        return True
    else:
        print(f"Failed to update template set {template_set_uid}", file=sys.stderr)
        return False

def create_template_set(name, template_uids):
    """Creates a new template set with the given name and initial templates."""
    endpoint = "/template_sets"
    payload = {"name": name, "templates": template_uids}
    print(f"Creating template set '{name}' with {len(template_uids)} templates...")
    result = make_request("POST", endpoint, json_data=payload)
    if result and isinstance(result, dict) and 'uid' in result: # Check if result is a dict
        print(f"Successfully created template set '{name}' (UID: {result['uid']}).")
        # Return the data for the newly created set
        return {
            'uid': result['uid'],
            'templates': result.get('templates', []) # Use templates returned by API
        }
    elif result: # Handle cases where make_request might return True (e.g., 204)
         print(f"Template set '{name}' creation returned unexpected success code, but no UID. Please check Bannerbear.", file=sys.stderr)
         return None
    else:
        print(f"Failed to create template set '{name}'.", file=sys.stderr)
        return None

# --- Main Logic ---
def main():
    template_name_to_uid = get_all_templates()
    if template_name_to_uid is None:
        sys.exit(1)

    set_name_to_data = get_all_template_sets()
    if set_name_to_data is None:
        sys.exit(1)

    print(f"\nStarting process for Template Sets {START_SET_NUMBER} to {END_SET_NUMBER}...")

    for set_number in range(START_SET_NUMBER, END_SET_NUMBER + 1):
        print(f"\n--- Processing Template Set {set_number} ---")
        target_set_name = f"Template Set {set_number}"

        # 1. Determine required template UIDs for this set number
        required_template_uids = []
        missing_template_names = []

        # Find design templates
        for design_number in range(1, NUM_DESIGN_TEMPLATES + 1):
            template_name = f"Template{set_number}_design{design_number}"
            template_uid = template_name_to_uid.get(template_name)
            if template_uid:
                required_template_uids.append(template_uid)
            else:
                missing_template_names.append(template_name)

        # Find story templates
        for story_number in range(1, NUM_STORY_TEMPLATES + 1):
            template_name = f"Template{set_number}_Story{story_number}"
            template_uid = template_name_to_uid.get(template_name)
            if template_uid:
                required_template_uids.append(template_uid)
            else:
                missing_template_names.append(template_name)
        
        # Report any missing templates upfront
        if missing_template_names:
            print(f"Warning: The following required templates were not found in your Bannerbear account for Set {set_number}:", file=sys.stderr)
            for name in missing_template_names:
                print(f"  - {name}", file=sys.stderr)
            # Decide if we should continue without these templates or skip the set
            if not required_template_uids: 
                print(f"Skipping Set {set_number} as NO required templates were found.", file=sys.stderr)
                continue
            else:
                 print(f"Continuing with {len(required_template_uids)} found templates for Set {set_number}.")

        # Convert to sets for easier comparison
        required_uids_set = set(required_template_uids)

        # 2. Check if the template set exists
        target_set_data = set_name_to_data.get(target_set_name)

        if not target_set_data:
            # 3a. Set does not exist - Create it with the required templates
            print(f"Template Set '{target_set_name}' not found. Creating it now.")
            new_set_data = create_template_set(target_set_name, required_template_uids)
            if new_set_data:
                # Add to our cache in case it's needed later (though unlikely in this script structure)
                set_name_to_data[target_set_name] = new_set_data
                print(f"Successfully created and populated Template Set {set_number}.")
            else:
                print(f"Failed to create Template Set {set_number}. Skipping.", file=sys.stderr)
                # Optional: Stop script on error
                # sys.exit(1)
        else:
            # 3b. Set exists - Check if update is needed
            target_set_uid = target_set_data['uid']
            existing_uids_set = set(target_set_data.get('templates', []))
            print(f"Template Set '{target_set_name}' (UID: {target_set_uid}) found with {len(existing_uids_set)} templates.")

            if required_uids_set == existing_uids_set:
                print(f"Template Set {set_number} already contains the correct {len(required_uids_set)} templates. No update needed.")
            else:
                print(f"Template Set {set_number} needs updating. (Found {len(existing_uids_set)}, requires {len(required_uids_set)}) Ensuring it has the correct {len(required_uids_set)} templates.")
                success = update_template_set(target_set_uid, required_template_uids)
                if success:
                    print(f"Successfully updated Template Set {set_number}.")
                else:
                    print(f"Error updating Template Set {set_number}.", file=sys.stderr)
                    # Optional: Stop script on error
                    # sys.exit(1)

        # Add a delay before processing the next set (if any)
        if set_number < END_SET_NUMBER:
             print("Waiting 1 second before next set...")
             time.sleep(1)

    print("\n--- Script finished ---")

if __name__ == "__main__":
    # Create scripts directory if it doesn't exist
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
    # Ensure .env is loaded relative to the script location or project root
    project_root = os.path.dirname(script_dir)
    dotenv_path = os.path.join(project_root, '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    else:
        # Fallback if .env is in the same directory as the script
        load_dotenv()

    # Re-check API key after loading .env
    BANNERBEAR_API_KEY = os.environ.get("BANNERBEAR_API_KEY")
    if not BANNERBEAR_API_KEY:
        print("Error: BANNERBEAR_API_KEY not found in environment variables or .env file.", file=sys.stderr)
        sys.exit(1)

    main() 
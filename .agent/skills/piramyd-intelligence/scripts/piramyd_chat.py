import os
import sys
import json
import argparse
import requests
from dotenv import load_dotenv

# Load workspace .env
load_dotenv()

PIRAMYD_API_KEY = os.getenv("PIRAMYD_API_KEY")
BASE_URL = "https://api.piramyd.cloud/v1/chat/completions"

def call_piramyd(model, prompt, temperature=0.7):
    if not PIRAMYD_API_KEY:
        print("Error: PIRAMYD_API_KEY not found in .env")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {PIRAMYD_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature
    }

    try:
        response = requests.post(BASE_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error calling Piramyd API: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"Response: {response.text}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Call Piramyd API from CLI")
    parser.add_argument("--model", type=str, required=True, help="Model ID (e.g., Llama-4-maverick)")
    parser.add_argument("--prompt", type=str, required=True, help="Prompt text")
    parser.add_argument("--temp", type=float, default=0.7, help="Temperature (default: 0.7)")

    args = parser.parse_args()
    
    result = call_piramyd(args.model, args.prompt, args.temp)
    print(result)

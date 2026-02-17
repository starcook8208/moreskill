import base64
import json
import sys
import os
import argparse
import requests # This requires 'requests' to be installed on devbox

def main():
    parser = argparse.ArgumentParser(description="Process image for Google Cloud Vision OCR.")
    parser.add_argument("--image_path", required=True, help="Path to the image file (local or URL).")
    args = parser.parse_args()

    image_source = None
    if args.image_path.startswith('http://') or args.image_path.startswith('https://'):
        image_source = {"imageUri": args.image_path}
    else:
        try:
            with open(args.image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            image_source = {"content": image_data}
        except FileNotFoundError:
            print(json.dumps({"error": f"Local image file not found: {args.image_path}"}))
            sys.exit(1)
        except Exception as e:
            print(json.dumps({"error": f"Error reading or encoding local image: {e}"}))
            sys.exit(1)

    api_key = os.getenv('GOOGLE_VISION_API_KEY')
    if not api_key:
        print(json.dumps({"error": "GOOGLE_VISION_API_KEY environment variable not set."}))
        sys.exit(1)

    vision_api_url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    request_payload = {
        "requests": [
            {
                "image": image_source,
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                "imageContext": {"languageHints": ["zh-TW", "en"]}
            }
        ]
    }

    try:
        response = requests.post(vision_api_url, headers=headers, data=json.dumps(request_payload))
        response.raise_for_status() # Raise an exception for bad status codes
        
        result = response.json()
        
        # Extract the full text annotation
        description = result.get('responses', [{}])[0].get('fullTextAnnotation', {}).get('text', 'No text found')
        
        print(json.dumps({"text": description}))
        
    except requests.exceptions.RequestException as e:
        print(json.dumps({"error": f"HTTP request failed: {e}"}))
        sys.exit(1)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Failed to decode JSON response from API."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"An unexpected error occurred: {e}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()

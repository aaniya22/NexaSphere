import requests
import time

url = "http://localhost:8787/api/forms/membership"
payload = {
    "fullName": "Test User",
    "collegeEmail": "test@example.com",
    "whatsapp": "1234567890",
    "formType": "membership"
}

print("Sending 6 requests to trigger rate limit...")
for i in range(6):
    try:
        response = requests.post(url, json=payload, timeout=2)
        print(f"Request {i+1}: Status {response.status_code}")
        if response.status_code == 429:
            print("Rate limit reached!")
            print("Headers:", response.headers)
            print("Body:", response.json())
    except Exception as e:
        print(f"Request {i+1} failed:", e)


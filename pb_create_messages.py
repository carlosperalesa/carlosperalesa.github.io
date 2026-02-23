import json
import getpass
import os
import urllib.error
import urllib.request

PB_URL = os.getenv("PB_URL", "http://127.0.0.1:8090")

email = input("PB admin email: ").strip()
password = getpass.getpass("PB admin password: ").strip()

auth_req = urllib.request.Request(
    f"{PB_URL}/api/admins/auth-with-password",
    data=json.dumps({"identity": email, "password": password}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)

try:
    with urllib.request.urlopen(auth_req) as resp:
        data = json.loads(resp.read().decode())
except urllib.error.HTTPError as exc:
    body = exc.read().decode()
    raise SystemExit(f"Auth failed ({exc.code}): {body}")

token = data["token"]

payload = {
    "name": "messages",
    "type": "base",
    "schema": [
        {"name": "name", "type": "text", "required": True},
        {"name": "phone", "type": "text", "required": False},
        {"name": "email", "type": "email", "required": True},
        {"name": "subject", "type": "text", "required": False},
        {"name": "message", "type": "text", "required": True},
    ],
    "listRule": "true",
    "viewRule": "true",
    "createRule": "true",
    "updateRule": None,
    "deleteRule": None,
}

create_req = urllib.request.Request(
    f"{PB_URL}/api/collections",
    data=json.dumps(payload).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(create_req) as resp:
        print(resp.read().decode())
except urllib.error.HTTPError as exc:
    body = exc.read().decode()
    raise SystemExit(f"Create failed ({exc.code}): {body}")

import json
import getpass
import urllib.request

PB_URL = "http://127.0.0.1:8090"

email = input("PB admin email: ").strip()
password = getpass.getpass("PB admin password: ").strip()

auth_req = urllib.request.Request(
    f"{PB_URL}/api/admins/auth-with-password",
    data=json.dumps({"identity": email, "password": password}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urllib.request.urlopen(auth_req) as resp:
    data = json.loads(resp.read().decode())

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

with urllib.request.urlopen(create_req) as resp:
    print(resp.read().decode())

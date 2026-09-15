import json
from pathlib import Path

from api.main import app

output = Path(__file__).with_name("openapi.json")
output.write_text(json.dumps(app.openapi(), indent=2) + "\n")
print(output)

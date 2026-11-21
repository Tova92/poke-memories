
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

source_file = DATA / "expansios.json"

with source_file.open("r", encoding="utf-8") as file:
    images = json.load(file)

if not isinstance(images, list):
    raise ValueError("Il file expansios.json non contiene una lista valida")

image_data = {
    item["id"]: item
    for item in images
    if isinstance(item, dict) and isinstance(item.get("id"), str)
}

found_ids = set()
updated_files = 0

folders = [
    (DATA / "expansions", "expansion"),
    (DATA / "groups", "group")
]

for folder, metadata_key in folders:
    for path in sorted(folder.glob("*.json")):
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        metadata = data.get(metadata_key)

        if not isinstance(metadata, dict):
            continue

        item_id = metadata.get("id")

        if item_id not in image_data:
            continue

        image = image_data[item_id]

        metadata.pop("logo", None)
        metadata["logo"] = image.get("logo")
        metadata["symbol"] = image.get("symbol")

        with path.open("w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
            file.write("\n")

        found_ids.add(item_id)
        updated_files += 1

missing_ids = set(image_data) - found_ids

print(f"File aggiornati: {updated_files}")
print(f"ID non trovati: {len(missing_ids)}")

if missing_ids:
    print("ID saltati:", ", ".join(sorted(missing_ids)))

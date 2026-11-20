import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

index = {
    "expansions": [],
    "groups": []
}

folders = {
    "expansions": DATA / "expansions",
    "groups": DATA / "groups"
}

for category, folder in folders.items():
    for path in sorted(folder.glob("*.json")):
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        metadata_key = "expansion" if category == "expansions" else "group"
        metadata = data.get(metadata_key)

        if not isinstance(metadata, dict):
            raise ValueError(f"Metadati mancanti in {path.name}")

        index[category].append(metadata.copy())

output = DATA / "catalog-index.json"

with output.open("w", encoding="utf-8") as file:
    json.dump(index, file, ensure_ascii=False, indent=4)

print(f"Espansioni: {len(index['expansions'])}")
print(f"Gruppi: {len(index['groups'])}")
print(f"Indice creato: {output}")

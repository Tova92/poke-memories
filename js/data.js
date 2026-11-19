import { DATA_PATH } from "./state.js";

const itemTypes = new Map();

export async function fetchJSON(path)
{
    const response = await fetch(path);

    if (!response.ok)
    {
        throw new Error(`Errore ${response.status}: ${path}`);
    }

    return await response.json();
}

export async function loadCatalog()
{
    const data = await fetchJSON(DATA_PATH + "categories.json");

    if (!Array.isArray(data.categories))
    {
        throw new Error("Formato categories.json non valido");
    }

    itemTypes.clear();

    function processCategory(category, inheritedType = null)
    {
        if (
            !category ||
            typeof category.id !== "string" ||
            typeof category.name !== "string" ||
            !Array.isArray(category.items)
        )
        {
            throw new Error("Struttura di una categoria non valida");
        }

        const contentType = category.contentType || inheritedType;

        if (contentType !== "expansion" && contentType !== "group")
        {
            throw new Error(`contentType non valido: ${category.id}`);
        }

        category.items = category.items.map(item =>
        {
            if (typeof item === "string")
            {
                itemTypes.set(item, contentType);
                return item;
            }

            processCategory(item, contentType);
            return item;
        });

        category.items.sort((a, b) =>
        {
            if (typeof a === "string" || typeof b === "string")
            {
                return 0;
            }

            return a.sortOrder - b.sortOrder;
        });

        return category;
    }

    data.categories.forEach(category => processCategory(category));

    return data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadItemData(id)
{
    const contentType = itemTypes.get(id);

    if (!contentType)
    {
        throw new Error(`Tipo di elemento sconosciuto: ${id}`);
    }

    return await fetchJSON(
        DATA_PATH + contentType + "s/" + id + ".json"
    );
}

export function validateItemData(data)
{
    const item = data.expansion || data.group;

    if (!item || !Array.isArray(data.cards))
    {
        throw new Error("Struttura del JSON non valida");
    }

    const validCards = data.cards.every(card =>
        card &&
        typeof card.id === "string" &&
        typeof card.name === "string" &&
        typeof card.number === "string" &&
        (card.image === null || typeof card.image === "string") &&
        (card.section === undefined || typeof card.section === "string")
    );

    if (!validCards)
    {
        throw new Error("Una o più carte hanno dati mancanti o non validi");
    }

    return item;
}

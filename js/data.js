import { DATA_PATH } from "./state.js";

const itemMetadata = new Map();

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

export async function loadCatalogIndex()
{
    const data = await fetchJSON(DATA_PATH + "catalog-index.json");

    if (
        !Array.isArray(data.expansions) ||
        !Array.isArray(data.groups)
    )
    {
        throw new Error("Formato catalog-index.json non valido");
    }

    itemMetadata.clear();

    data.expansions.forEach(item =>
    {
        itemMetadata.set(item.id, {
            ...item,
            type: "expansion"
        });
    });

    data.groups.forEach(item =>
    {
        itemMetadata.set(item.id, {
            ...item,
            type: "group"
        });
    });
}

export function getItemMetadata(id)
{
    return itemMetadata.get(id) || null;
}

export function getTotalCardCount(id)
{
    const metadata = getItemMetadata(id);

    if (!metadata)
    {
        return 0;
    }

    return Object.entries(metadata).reduce((total, [key, value]) =>
    {
        if (
            key.toLowerCase().endsWith("cardcount") &&
            typeof value === "number" &&
            Number.isFinite(value)
        )
        {
            return total + value;
        }

        return total;
    }, 0);
}

export async function loadItemData(id)
{
    const metadata = itemMetadata.get(id);
    const contentType = metadata?.type;

    if (!contentType)
    {
        throw new Error(`Tipo di elemento sconosciuto: ${id}`);
    }

    const data = await fetchJSON(
        DATA_PATH + contentType + "s/" + id + ".json"
    );

    const sourceCache = new Map();
    const additionalCards = [];

    async function loadSource(sourceId)
    {
        if (!sourceCache.has(sourceId))
        {
            const sourceMetadata = itemMetadata.get(sourceId);
            const sourceType = sourceMetadata?.type;

            if (!sourceType)
            {
                throw new Error(`Origine sconosciuta: ${sourceId}`);
            }

            sourceCache.set(
                sourceId,
                fetchJSON(
                    DATA_PATH + sourceType + "s/" + sourceId + ".json"
                )
            );
        }

        return await sourceCache.get(sourceId);
    }

    async function loadAdditionalCards(ids, section)
    {
        if (ids === undefined)
        {
            return;
        }

        if (!Array.isArray(ids) || !ids.every(id => typeof id === "string"))
        {
            throw new Error(`Elenco ${section} non valido: ${id}`);
        }

        const groupedIds = new Map();

        ids.forEach(cardId =>
        {
            const sourceId = cardId.split("-")[0];

            if (!groupedIds.has(sourceId))
            {
                groupedIds.set(sourceId, []);
            }

            groupedIds.get(sourceId).push(cardId);
        });

        for (const [sourceId, cardIds] of groupedIds)
        {
            const sourceData = await loadSource(sourceId);

            if (!Array.isArray(sourceData.cards))
            {
                throw new Error(`Elenco carte non valido: ${sourceId}`);
            }

            cardIds.forEach(cardId =>
            {
                const card = sourceData.cards.find(item => item.id === cardId);

                if (!card)
                {
                    throw new Error(`Carta non trovata: ${cardId}`);
                }

                additionalCards.push({
                    ...card,
                    section
                });
            });
        }
    }

    await loadAdditionalCards(data.energies, "Energie");
    await loadAdditionalCards(data.promo, "Promo");

    data.cards = [
        ...data.cards,
        ...additionalCards
    ];

    return data;
}

export function validateItemData(data)
{
    const item = data.expansion || data.group;

    if (!item || !Array.isArray(data.cards))
    {
        throw new Error("Struttura del JSON non valida");
    }

    for (const key of ["energies", "promo"])
    {
        if (
            data[key] !== undefined &&
            (
                !Array.isArray(data[key]) ||
                !data[key].every(id => typeof id === "string")
            )
        )
        {
            throw new Error(`Struttura ${key} non valida`);
        }
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

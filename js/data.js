import { DATA_PATH } from "./state.js";

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
    const data = await fetchJSON(DATA_PATH + "series.json");

    if (!Array.isArray(data.series))
    {
        throw new Error("Formato series.json non valido");
    }

    return data.series.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadItemData(id)
{
    try
    {
        return await fetchJSON(DATA_PATH + "expansions/" + id + ".json");
    }
    catch (error)
    {
        return await fetchJSON(DATA_PATH + "groups/" + id + ".json");
    }
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

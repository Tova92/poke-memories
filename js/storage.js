export const OWNED_KEY = "poke-memories-owned-v3";
export const FAVORITES_KEY = "poke-memories-favorites-v1";

export function loadStorage(key)
{
    try
    {
        const value = JSON.parse(localStorage.getItem(key));

        return Array.isArray(value) ? value : [];
    }
    catch
    {
        return [];
    }
}

export function saveStorage(key, value)
{
    try
    {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error)
    {
        console.error("Errore durante il salvataggio:", error);
        alert("Impossibile salvare i progressi. Controlla lo spazio disponibile nel browser.");
    }
}

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
    localStorage.setItem(key, JSON.stringify(value));
}

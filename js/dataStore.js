import { state } from "./state.js";
import {
    OWNED_KEY,
    FAVORITES_KEY,
    loadStorage,
    saveStorage
} from "./storage.js";
import {
    loadAccountData,
    saveAccountData
} from "./account.js";

export function getLocalData()
{
    return {
        owned: loadStorage(OWNED_KEY),
        favorites: loadStorage(FAVORITES_KEY)
    };
}

export function activateLocalMode()
{
    const data = getLocalData();

    state.mode = "local";
    state.user = null;
    state.owned = data.owned;
    state.favorites = data.favorites;
}

export async function activateAccountMode(user)
{
    const data = await loadAccountData(user.id);

    state.user = user;
    state.mode = "account";
    state.owned = data.owned;
    state.favorites = data.favorites;

    return data.exists;
}

export async function saveCollection()
{
    if (state.mode === "local")
    {
        saveStorage(OWNED_KEY, state.owned);
        saveStorage(FAVORITES_KEY, state.favorites);
        return;
    }

    if (state.mode === "account" && state.user)
    {
        await saveAccountData(
            state.user.id,
            state.owned,
            state.favorites
        );

        return;
    }

    throw new Error("Modalità di salvataggio non valida.");
}

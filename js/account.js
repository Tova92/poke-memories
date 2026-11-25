import { supabase } from "./supabase.js";

export async function login(email, password)
{
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error)
    {
        throw error;
    }

    return data;
}

export async function logout()
{
    const { error } = await supabase.auth.signOut();

    if (error)
    {
        throw error;
    }
}

export async function getCurrentSession()
{
    const { data, error } = await supabase.auth.getSession();

    if (error)
    {
        throw error;
    }

    return data.session;
}

export function listenAuthChanges(callback)
{
    const { data } = supabase.auth.onAuthStateChange(
        (event, session) =>
        {
            callback(event, session);
        }
    );

    return () => data.subscription.unsubscribe();
}


export async function loadAccountData(userId)
{
    const { data, error } = await supabase
        .from("user_data")
        .select("owned, favorites")
        .eq("user_id", userId)
        .maybeSingle();

    if (error)
    {
        throw error;
    }

    return {
        owned: Array.isArray(data?.owned)
            ? data.owned.filter(item => typeof item === "string")
            : [],
        favorites: Array.isArray(data?.favorites)
            ? data.favorites.filter(item => typeof item === "string")
            : []
    };
}

export async function saveAccountData(userId, owned, favorites)
{
    const { error } = await supabase
        .from("user_data")
        .upsert({
            user_id: userId,
            owned: owned,
            favorites: favorites
        });

    if (error)
    {
        throw error;
    }
}

export async function deleteAccountData(userId)
{
    const { error } = await supabase
        .from("user_data")
        .delete()
        .eq("user_id", userId);

    if (error)
    {
        throw error;
    }
}


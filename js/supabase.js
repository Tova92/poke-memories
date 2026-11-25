import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ryowjowzldzfguluateu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zOmzgqAa0Vte1VGLZnG0RQ_RkPyw91j";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    }
);

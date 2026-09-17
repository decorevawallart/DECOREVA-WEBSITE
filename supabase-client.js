/* =========================================================
   DECOREVA — SUPABASE CLIENT CONNECTION
   STEP 5
   - Safe standalone file
   - Does NOT change rating, review, like, cart or wishlist logic
   - Uses the Supabase URL + Publishable Key from config.js
   ========================================================= */

(function () {
    "use strict";

    if (!window.supabase) {
        console.error("DECOREVA Supabase: Supabase library is not loaded.");
        return;
    }

    if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_PUBLISHABLE_KEY === "undefined") {
        console.error("DECOREVA Supabase: config.js is missing or variables are not available.");
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        console.error("DECOREVA Supabase: URL or Publishable Key is empty.");
        return;
    }

    window.decorevaSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("DECOREVA Supabase: client connected.");
})();

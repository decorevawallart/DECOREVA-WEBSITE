/* =========================================================
   DECOREVA — SUPABASE AUTH
   STEP 7
   - Uses the existing Supabase client
   - Adds Login / Signup modal
   - Saves customer name + phone in public.profiles
   - Does NOT modify cart, wishlist, rating, review or slider code
   ========================================================= */

(function () {
    "use strict";

    function startSupabaseAuth() {
        if (!window.decorevaSupabase) {
            console.error("DECOREVA Auth: Supabase client is not available.");
            return;
        }

        const supabase = window.decorevaSupabase;

        function ensureAuthModal() {
            let modal = document.getElementById("decoreva-auth-modal");
            if (modal) return modal;

            modal = document.createElement("div");
            modal.id = "decoreva-auth-modal";
            modal.className = "decoreva-auth-modal";
            modal.setAttribute("aria-hidden", "true");

            modal.innerHTML =
                '<div class="decoreva-auth-overlay" data-auth-close></div>' +
                '<div class="decoreva-auth-card" role="dialog" aria-modal="true" aria-label="DECOREVA Login and Signup">' +
                    '<div class="decoreva-auth-head">' +
                        '<div>' +
                            '<strong>DECOREVA Account</strong>' +
                            '<span id="decoreva-auth-mode-text">Login to your account</span>' +
                        '</div>' +
                        '<button type="button" class="decoreva-auth-close" data-auth-close aria-label="Close">×</button>' +
                    '</div>' +

                    '<div id="decoreva-auth-message" class="decoreva-auth-message" aria-live="polite"></div>' +

                    '<form id="decoreva-auth-form">' +
                        '<div id="decoreva-auth-name-wrap" hidden>' +
                            '<input id="decoreva-auth-name" type="text" maxlength="80" placeholder="Full name">' +
                        '</div>' +
                        '<input id="decoreva-auth-phone" type="tel" maxlength="20" placeholder="Mobile number">' +
                        '<input id="decoreva-auth-email" type="email" autocomplete="email" placeholder="Email address" required>' +
                        '<input id="decoreva-auth-password" type="password" autocomplete="current-password" minlength="6" placeholder="Password (minimum 6 characters)" required>' +
                        '<button type="submit" id="decoreva-auth-submit">LOGIN</button>' +
                    '</form>' +

                    '<button type="button" id="decoreva-auth-switch">New customer? SIGN UP</button>' +
                '</div>';

            document.body.appendChild(modal);
            return modal;
        }

        function showMessage(text, isError) {
            const box = document.getElementById("decoreva-auth-message");
            if (!box) return;
            box.textContent = text || "";
            box.classList.toggle("error", !!isError);
        }

        function setMode(mode) {
            const signup = mode === "signup";
            const nameWrap = document.getElementById("decoreva-auth-name-wrap");
            const nameInput = document.getElementById("decoreva-auth-name");
            const phoneInput = document.getElementById("decoreva-auth-phone");
            const passwordInput = document.getElementById("decoreva-auth-password");
            const submit = document.getElementById("decoreva-auth-submit");
            const modeText = document.getElementById("decoreva-auth-mode-text");
            const switchButton = document.getElementById("decoreva-auth-switch");

            if (nameWrap) nameWrap.hidden = !signup;
            if (nameInput) nameInput.required = signup;
            if (phoneInput) phoneInput.required = signup;

            if (passwordInput) {
                passwordInput.autocomplete = signup ? "new-password" : "current-password";
            }

            if (submit) submit.textContent = signup ? "SIGN UP" : "LOGIN";
            if (modeText) modeText.textContent = signup
                ? "Create your customer account"
                : "Login to your account";
            if (switchButton) switchButton.textContent = signup
                ? "Already have an account? LOGIN"
                : "New customer? SIGN UP";

            const form = document.getElementById("decoreva-auth-form");
            if (form) form.dataset.mode = mode;
            showMessage("");
        }

        function openAuthModal() {
            const modal = ensureAuthModal();
            setMode("login");
            modal.classList.add("open");
            modal.setAttribute("aria-hidden", "false");
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
            setTimeout(function () {
                const email = document.getElementById("decoreva-auth-email");
                if (email) email.focus();
            }, 50);
        }

        function closeAuthModal() {
            const modal = document.getElementById("decoreva-auth-modal");
            if (!modal) return;
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        }

        async function saveProfile(user, fullName, phone) {
            if (!user) return;

            const payload = {
                id: user.id,
                full_name: fullName || user.user_metadata?.full_name || "",
                phone: phone || user.user_metadata?.phone || ""
            };

            const result = await supabase
                .from("profiles")
                .upsert(payload, { onConflict: "id" });

            if (result.error) {
                console.error("DECOREVA Auth: profile save failed.", result.error);
            }
        }

        async function refreshAuthButton() {
            const button = document.getElementById("decoreva-profile-login");
            if (!button) return;

            const result = await supabase.auth.getSession();
            const session = result.data ? result.data.session : null;

            if (session && session.user) {
                const name =
                    session.user.user_metadata?.full_name ||
                    session.user.email ||
                    "My Account";

                button.textContent = name;
                button.setAttribute("aria-label", "Open account for " + name);
            } else {
                button.textContent = "LOGIN / SIGNUP";
                button.setAttribute("aria-label", "Login or sign up");
            }
        }

        document.addEventListener("click", function (event) {
            const loginButton = event.target.closest("#decoreva-profile-login");

            if (loginButton) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                openAuthModal();
                return;
            }

            if (event.target.closest("[data-auth-close]")) {
                event.preventDefault();
                event.stopPropagation();
                closeAuthModal();
                return;
            }

            const switchButton = event.target.closest("#decoreva-auth-switch");

            if (switchButton) {
                event.preventDefault();
                const form = document.getElementById("decoreva-auth-form");
                const currentMode = form ? form.dataset.mode : "login";
                setMode(currentMode === "signup" ? "login" : "signup");
            }
        }, true);

        document.addEventListener("submit", async function (event) {
            const form = event.target.closest("#decoreva-auth-form");
            if (!form) return;

            event.preventDefault();
            event.stopPropagation();

            const mode = form.dataset.mode || "login";
            const name = (document.getElementById("decoreva-auth-name")?.value || "").trim();
            const phone = (document.getElementById("decoreva-auth-phone")?.value || "").trim();
            const email = (document.getElementById("decoreva-auth-email")?.value || "").trim();
            const password = document.getElementById("decoreva-auth-password")?.value || "";
            const submit = document.getElementById("decoreva-auth-submit");

            if (submit) submit.disabled = true;
            showMessage(mode === "signup" ? "Creating your account..." : "Logging in...");

            try {
                if (mode === "signup") {
                    const result = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: name,
                                phone: phone
                            }
                        }
                    });

                    if (result.error) throw result.error;

                    if (result.data && result.data.session && result.data.user) {
                        await saveProfile(result.data.user, name, phone);
                        showMessage("Account created successfully.");
                        await refreshAuthButton();
                        setTimeout(closeAuthModal, 700);
                    } else {
                        showMessage("Account created. Please check your email to confirm your account.");
                    }
                } else {
                    const result = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (result.error) throw result.error;

                    if (result.data && result.data.user) {
                        await saveProfile(result.data.user);
                    }

                    showMessage("Login successful.");
                    await refreshAuthButton();
                    setTimeout(closeAuthModal, 500);
                }
            } catch (error) {
                console.error("DECOREVA Auth:", error);
                showMessage(error?.message || "Unable to complete this request.", true);
            } finally {
                if (submit) submit.disabled = false;
            }
        }, true);

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeAuthModal();
        });

        supabase.auth.onAuthStateChange(function () {
            refreshAuthButton();
        });

        refreshAuthButton();

        window.decorevaSupabaseAuth = {
            open: openAuthModal,
            close: closeAuthModal,
            refresh: refreshAuthButton
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startSupabaseAuth, { once: true });
    } else {
        startSupabaseAuth();
    }
})();

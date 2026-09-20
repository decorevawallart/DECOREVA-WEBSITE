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
                        '<div id="decoreva-auth-reset-wrap" hidden>' +
                            '<input id="decoreva-auth-new-password" type="password" autocomplete="new-password" minlength="6" placeholder="New password (minimum 6 characters)">' +
                            '<input id="decoreva-auth-confirm-password" type="password" autocomplete="new-password" minlength="6" placeholder="Confirm new password">' +
                        '</div>' +
                        '<button type="submit" id="decoreva-auth-submit">LOGIN</button>' +
                    '</form>' +

                    '<button type="button" id="decoreva-auth-forgot" class="decoreva-auth-switch">Forgot password?</button>' +
                    '<button type="button" id="decoreva-auth-switch">New customer? SIGN UP</button>' +
                    '<button type="button" id="decoreva-auth-logout" class="decoreva-auth-submit" hidden>LOGOUT</button>' +
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

        function showAuthToast(message) {
            let toast = document.querySelector(".decoreva-shop-toast");

            if (toast) {
                toast.remove();
            }

            toast = document.createElement("div");
            toast.className = "decoreva-shop-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");

            /* Small professional auth toast — scoped only to this toast.
               Keeps the existing DECOREVA shop-toast behaviour intact. */
            toast.style.cssText =
                "position:fixed !important;" +
                "top:105px !important;" +
                "right:20px !important;" +
                "left:auto !important;" +
                "z-index:999999 !important;" +
                "width:auto !important;" +
                "max-width:min(360px,calc(100vw - 32px)) !important;" +
                "min-height:0 !important;" +
                "display:flex !important;" +
                "align-items:center !important;" +
                "gap:8px !important;" +
                "padding:9px 13px !important;" +
                "border-radius:7px !important;" +
                "font:600 13px/1.3 Arial,sans-serif !important;" +
                "box-sizing:border-box !important;" +
                "white-space:normal !important;";

            const icon = document.createElement("i");
            icon.className = "fas fa-check";
            icon.setAttribute("aria-hidden", "true");
            icon.style.cssText =
                "width:20px !important;" +
                "height:20px !important;" +
                "min-width:20px !important;" +
                "display:flex !important;" +
                "align-items:center !important;" +
                "justify-content:center !important;" +
                "font-size:11px !important;" +
                "border-radius:50% !important;";

            const text = document.createElement("span");
            text.textContent = message;
            text.style.cssText =
                "font-size:13px !important;" +
                "line-height:1.3 !important;" +
                "font-weight:600 !important;" +
                "margin:0 !important;";

            toast.appendChild(icon);
            toast.appendChild(text);
            document.body.appendChild(toast);

            if (window.matchMedia && window.matchMedia("(max-width:600px)").matches) {
                toast.style.setProperty("top", "88px", "important");
                toast.style.setProperty("right", "12px", "important");
                toast.style.setProperty("max-width", "calc(100vw - 24px)", "important");
                toast.style.setProperty("padding", "8px 11px", "important");
                toast.style.setProperty("font-size", "12px", "important");

                icon.style.setProperty("width", "19px", "important");
                icon.style.setProperty("height", "19px", "important");
                icon.style.setProperty("min-width", "19px", "important");
                icon.style.setProperty("font-size", "10px", "important");
                text.style.setProperty("font-size", "12px", "important");
            }

            requestAnimationFrame(function () {
                toast.classList.add("show");
            });

            clearTimeout(window.__decorevaAuthToastTimer);
            window.__decorevaAuthToastTimer = setTimeout(function () {
                toast.classList.remove("show");
                setTimeout(function () {
                    if (toast.parentNode) toast.remove();
                }, 180);
            }, 1050);
        }

        function setMode(mode) {
            const signup = mode === "signup";
            const forgot = mode === "forgot";
            const reset = mode === "reset";

            const form = document.getElementById("decoreva-auth-form");
            const switchButton = document.getElementById("decoreva-auth-switch");
            const forgotButton = document.getElementById("decoreva-auth-forgot");
            const logoutButton = document.getElementById("decoreva-auth-logout");
            const nameWrap = document.getElementById("decoreva-auth-name-wrap");
            const nameInput = document.getElementById("decoreva-auth-name");
            const phoneInput = document.getElementById("decoreva-auth-phone");
            const emailInput = document.getElementById("decoreva-auth-email");
            const passwordInput = document.getElementById("decoreva-auth-password");
            const resetWrap = document.getElementById("decoreva-auth-reset-wrap");
            const newPasswordInput = document.getElementById("decoreva-auth-new-password");
            const confirmPasswordInput = document.getElementById("decoreva-auth-confirm-password");
            const submit = document.getElementById("decoreva-auth-submit");
            const modeText = document.getElementById("decoreva-auth-mode-text");

            if (form) form.hidden = false;
            if (switchButton) switchButton.hidden = reset || forgot;
            if (forgotButton) forgotButton.hidden = signup || forgot || reset;
            if (logoutButton) logoutButton.hidden = true;

            if (nameWrap) nameWrap.hidden = !signup;
            if (nameInput) nameInput.required = signup;
            if (phoneInput) {
                phoneInput.required = signup;
                phoneInput.hidden = signup ? false : true;
            }

            if (emailInput) {
                emailInput.hidden = reset;
                emailInput.required = !reset;
            }

            if (passwordInput) {
                passwordInput.hidden = forgot || reset;
                passwordInput.required = !forgot && !reset;
                passwordInput.autocomplete = signup ? "new-password" : "current-password";
            }

            if (resetWrap) resetWrap.hidden = !reset;
            if (newPasswordInput) newPasswordInput.required = reset;
            if (confirmPasswordInput) confirmPasswordInput.required = reset;

            if (submit) {
                submit.textContent = signup ? "SIGN UP" : (forgot ? "SEND RESET LINK" : (reset ? "UPDATE PASSWORD" : "LOGIN"));
            }

            if (modeText) {
                modeText.textContent =
                    signup ? "Create your customer account" :
                    forgot ? "Reset your DECOREVA password" :
                    reset ? "Choose a new password" :
                    "Login to your account";
            }

            if (switchButton) {
                switchButton.textContent = signup
                    ? "Already have an account? LOGIN"
                    : "New customer? SIGN UP";
            }

            if (forgotButton) forgotButton.textContent = "Forgot password?";
            if (form) form.dataset.mode = mode;
            showMessage("");
        }

        function showLoggedInMode(user) {
            const form = document.getElementById("decoreva-auth-form");
            const switchButton = document.getElementById("decoreva-auth-switch");
            const logoutButton = document.getElementById("decoreva-auth-logout");
            const modeText = document.getElementById("decoreva-auth-mode-text");
            const name =
                user?.user_metadata?.full_name ||
                user?.email ||
                "My Account";

            if (form) form.hidden = true;
            if (switchButton) switchButton.hidden = true;
            const forgotButton = document.getElementById("decoreva-auth-forgot");
            const resetWrap = document.getElementById("decoreva-auth-reset-wrap");
            if (forgotButton) forgotButton.hidden = true;
            if (resetWrap) resetWrap.hidden = true;
            if (logoutButton) logoutButton.hidden = false;
            if (modeText) modeText.textContent = "Logged in as " + name;
            showMessage("");
        }

        async function openAuthModal() {
            const modal = ensureAuthModal();
            const result = await supabase.auth.getSession();
            const session = result.data ? result.data.session : null;

            if (session && session.user) {
                showLoggedInMode(session.user);
            } else {
                const form = document.getElementById("decoreva-auth-form");
                const switchButton = document.getElementById("decoreva-auth-switch");
                const logoutButton = document.getElementById("decoreva-auth-logout");
                if (form) form.hidden = false;
                if (switchButton) switchButton.hidden = false;
                if (logoutButton) logoutButton.hidden = true;
                setMode("login");
            }
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
            const title = document.getElementById("decoreva-profile-welcome-title");
            const sub = document.getElementById("decoreva-profile-welcome-sub");
            const logout = document.getElementById("decoreva-profile-logout");

            const result = await supabase.auth.getSession();
            const session = result.data ? result.data.session : null;

            /* Always restore the original two-line Logout row.
               This prevents a previous click from leaving only "LOG OUT". */
            if (logout) {
                logout.disabled = false;
                logout.hidden = true;
                logout.innerHTML =
                    '<span>Logout</span><small>Sign out of your account</small>';
                logout.setAttribute("type", "button");
                logout.setAttribute("data-profile-menu", "logout");
            }

            if (session && session.user) {
                const name = session.user.user_metadata?.full_name || session.user.email || "Customer";
                const phone = session.user.user_metadata?.phone || "";
                const firstName = name.split(/\s+/)[0] || name;

                if (title) title.textContent = "Hello " + firstName;
                if (sub) sub.textContent = phone || session.user.email || "Welcome back to DECOREVA";
                if (button) button.hidden = true;

                if (logout) {
                    logout.hidden = false;
                    logout.disabled = false;
                }
            } else {
                if (title) title.textContent = "Welcome to DECOREVA";
                if (sub) sub.textContent = "Login or sign up to manage your orders and account.";

                if (button) {
                    button.hidden = false;
                    button.textContent = "LOGIN / SIGNUP";
                    button.setAttribute("aria-label", "Login or sign up");
                }

                if (logout) {
                    logout.hidden = true;
                    logout.disabled = false;
                }
            }
        }

        document.addEventListener("click", async function (event) {
            const loginButton = event.target.closest("#decoreva-profile-login");

            if (loginButton) {
                /* One profile-close path: finish the profile close animation
                   first, then open the authentication modal. */
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                const openLoginModal = function () {
                    const modal = ensureAuthModal();
                    const form = document.getElementById("decoreva-auth-form");
                    if (form) form.hidden = false;
                    setMode("login");
                    modal.classList.add("open");
                    modal.setAttribute("aria-hidden", "false");
                    document.documentElement.style.overflow = "hidden";
                    document.body.style.overflow = "hidden";

                    setTimeout(function () {
                        const email = document.getElementById("decoreva-auth-email");
                        if (email) email.focus();
                    }, 50);
                };

                if (typeof window.decorevaCloseProfile === "function") {
                    window.decorevaCloseProfile(openLoginModal);
                } else {
                    openLoginModal();
                }

                return;
            }

            const profileLogoutButton = event.target.closest("#decoreva-profile-logout");

            if (profileLogoutButton) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                profileLogoutButton.disabled = true;

                supabase.auth.signOut().then(async function (result) {
                    if (result.error) throw result.error;
                    profileLogoutButton.disabled = false;
                    profileLogoutButton.innerHTML =
                        '<span>Logout</span><small>Sign out of your account</small>';
                    const panel = document.getElementById("decoreva-profile-panel");
                    if (panel) {
                        panel.classList.remove("open");
                        panel.setAttribute("aria-hidden", "true");
                        panel.style.transition = "";
                        panel.style.visibility = "";
                        panel.style.pointerEvents = "";
                    }
                    await refreshAuthButton();
                    showAuthToast("You are logged out successfully.");
                }).catch(function (error) {
                    console.error("DECOREVA Profile logout:", error);
                    profileLogoutButton.disabled = false;
                });
                return;
            }

            if (event.target.closest("[data-auth-close]")) {
                event.preventDefault();
                event.stopPropagation();
                closeAuthModal();
                return;
            }

            const logoutButton = event.target.closest("#decoreva-auth-logout");

            if (logoutButton) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                logoutButton.disabled = true;
                showMessage("Logging out...");

                supabase.auth.signOut().then(async function (result) {
                    if (result.error) throw result.error;
                    showMessage("Logged out successfully.");
                    await refreshAuthButton();
                    setTimeout(function () {
                        closeAuthModal();
                        showAuthToast("You are logged out successfully.");
                    }, 500);
                }).catch(function (error) {
                    console.error("DECOREVA Auth logout:", error);
                    showMessage(error?.message || "Unable to log out.", true);
                    logoutButton.disabled = false;
                });
                return;
            }

            const forgotButton = event.target.closest("#decoreva-auth-forgot");

            if (forgotButton) {
                event.preventDefault();
                event.stopPropagation();
                const form = document.getElementById("decoreva-auth-form");
                if (form) setMode("forgot");
                const email = document.getElementById("decoreva-auth-email");
                if (email) {
                    email.hidden = false;
                    email.required = true;
                    setTimeout(function () { email.focus(); }, 50);
                }
                return;
            }

            const switchButton = event.target.closest("#decoreva-auth-switch");

            if (switchButton) {
                event.preventDefault();
                event.stopPropagation();
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
            const newPassword = document.getElementById("decoreva-auth-new-password")?.value || "";
            const confirmPassword = document.getElementById("decoreva-auth-confirm-password")?.value || "";
            const submit = document.getElementById("decoreva-auth-submit");

            if (submit) submit.disabled = true;
            showMessage(mode === "signup" ? "Creating your account..." : "Logging in...");

            try {
                if (mode === "forgot") {
                    if (!email) {
                        throw new Error("Please enter your email address.");
                    }

                    const redirectTo = window.location.origin + window.location.pathname;
                    const result = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: redirectTo
                    });

                    if (result.error) {
                        const errorMessage = String(result.error?.message || "").toLowerCase();

                        if (
                            errorMessage.includes("rate limit") ||
                            errorMessage.includes("too many") ||
                            errorMessage.includes("email rate")
                        ) {
                            throw new Error(
                                "Too many reset requests. Please try again later."
                            );
                        }

                        throw result.error;
                    }

                    showMessage("Password reset link sent. Please check your email.");
                    setTimeout(closeAuthModal, 1200);

                } else if (mode === "reset") {
                    if (newPassword.length < 6) {
                        throw new Error("New password must be at least 6 characters.");
                    }

                    if (newPassword !== confirmPassword) {
                        throw new Error("New passwords do not match.");
                    }

                    const result = await supabase.auth.updateUser({
                        password: newPassword
                    });

                    if (result.error) throw result.error;

                    showMessage("Password reset successfully. You can now log in.");
                    setTimeout(async function () {
                        await supabase.auth.signOut();
                        setMode("login");
                        closeAuthModal();
                        showAuthToast("Your password has been reset successfully.");
                    }, 700);

                } else if (mode === "signup") {
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
                        setTimeout(function () {
                            closeAuthModal();
                            showAuthToast("Your DECOREVA account is ready. You are logged in!");
                        }, 700);
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
                    setTimeout(function () {
                        closeAuthModal();
                        showAuthToast("You are logged in successfully.");
                    }, 500);
                }
            } catch (error) {
                console.error("DECOREVA Auth:", error);

                const errorMessage = String(error?.message || "").toLowerCase();

                if (
                    errorMessage.includes("rate limit") ||
                    errorMessage.includes("too many") ||
                    errorMessage.includes("email rate")
                ) {
                    showMessage(
                        "Too many reset requests. Please try again later.",
                        true
                    );
                } else {
                    showMessage(
                        error?.message || "Unable to complete this request.",
                        true
                    );
                }
            } finally {
                if (submit) submit.disabled = false;
            }
        }, true);

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeAuthModal();
        });

        function openPasswordResetMode() {
            const modal = ensureAuthModal();
            setMode("reset");
            modal.classList.add("open");
            modal.setAttribute("aria-hidden", "false");
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";

            setTimeout(function () {
                const newPassword = document.getElementById("decoreva-auth-new-password");
                if (newPassword) newPassword.focus();
            }, 50);
        }

        function isRecoveryUrl() {
            try {
                const url = new URL(window.location.href);
                const queryType = (url.searchParams.get("type") || "").toLowerCase();
                if (queryType === "recovery") return true;

                const hash = (url.hash || "").replace(/^#/, "");
                if (!hash) return false;

                const hashParams = new URLSearchParams(hash);
                return (hashParams.get("type") || "").toLowerCase() === "recovery";
            } catch (error) {
                return false;
            }
        }

        async function checkPasswordRecoveryOnLoad() {
            if (!isRecoveryUrl()) return;

            const result = await supabase.auth.getSession();
            const session = result.data ? result.data.session : null;

            if (session && session.user) {
                openPasswordResetMode();
            } else {
                setTimeout(async function () {
                    const retry = await supabase.auth.getSession();
                    const retrySession = retry.data ? retry.data.session : null;
                    if (retrySession && retrySession.user && isRecoveryUrl()) {
                        openPasswordResetMode();
                    }
                }, 500);
            }
        }

        supabase.auth.onAuthStateChange(function (event) {
            refreshAuthButton();

            /* If a Review modal is open, immediately re-bind its controls
               to the new authenticated user. */
            if (
                (event === "SIGNED_IN" ||
                 event === "SIGNED_OUT" ||
                 event === "USER_UPDATED") &&
                typeof window.decorevaReviewAuthChanged === "function"
            ) {
                setTimeout(function () {
                    window.decorevaReviewAuthChanged();
                }, 120);
            }

            if (event === "PASSWORD_RECOVERY") {
                openPasswordResetMode();
            }
        });

        refreshAuthButton();
        checkPasswordRecoveryOnLoad();

        window.decorevaSupabaseAuth = {
            open: openAuthModal,
            close: closeAuthModal,
            refresh: refreshAuthButton,
            forgotPassword: function () {
                ensureAuthModal();
                setMode("forgot");
                const modal = document.getElementById("decoreva-auth-modal");
                if (modal) {
                    modal.classList.add("open");
                    modal.setAttribute("aria-hidden", "false");
                    document.documentElement.style.overflow = "hidden";
                    document.body.style.overflow = "hidden";
                }
            }
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startSupabaseAuth, { once: true });
    } else {
        startSupabaseAuth();
    }
})();

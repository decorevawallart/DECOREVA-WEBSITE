        document.addEventListener("DOMContentLoaded", function () {
            "use strict";

            /* ================= DECOREVA VISITOR TRACKING ================= */
            const DECOREVA_VISITOR_ID_KEY = "decorevaVisitorId";
            const DECOREVA_TRACKED_PAGE_KEY = "decorevaTrackedPage";

            function getDecorevaVisitorId() {
                let visitorId = "";
                try {
                    visitorId = localStorage.getItem(DECOREVA_VISITOR_ID_KEY) || "";
                } catch (error) {
                    console.warn("DECOREVA visitor storage read error:", error);
                }

                if (!visitorId) {
                    if (window.crypto && typeof window.crypto.randomUUID === "function") {
                        visitorId = window.crypto.randomUUID();
                    } else if (window.crypto && typeof window.crypto.getRandomValues === "function") {
                        const bytes = new Uint8Array(16);
                        window.crypto.getRandomValues(bytes);
                        visitorId = Array.from(bytes, function (byte) {
                            return byte.toString(16).padStart(2, "0");
                        }).join("");
                    } else {
                        visitorId = "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
                    }

                    try {
                        localStorage.setItem(DECOREVA_VISITOR_ID_KEY, visitorId);
                    } catch (error) {
                        console.warn("DECOREVA visitor storage write error:", error);
                    }
                }

                return visitorId;
            }

            async function getDecorevaTrackingUser() {
                if (!window.decorevaSupabase || !window.decorevaSupabase.auth) {
                    return null;
                }

                try {
                    const result = await window.decorevaSupabase.auth.getUser();
                    return result && result.data ? result.data.user || null : null;
                } catch (error) {
                    console.warn("DECOREVA visitor auth check error:", error);
                    return null;
                }
            }

            function getDecorevaTrackingPageKey() {
                return window.location.pathname + window.location.search + window.location.hash;
            }

            async function trackDecorevaVisit(productKey) {
                if (!window.decorevaSupabase) {
                    console.warn("DECOREVA visitor tracking: Supabase client unavailable.");
                    return false;
                }

                const visitorId = getDecorevaVisitorId();
                if (!visitorId) return false;

                const pageKey = getDecorevaTrackingPageKey();
                const isProductView = !!productKey;

                /* Prevent repeated refreshes of the same page from creating
                   multiple visitor rows during one browser session. */
                if (!isProductView) {
                    try {
                        if (sessionStorage.getItem(DECOREVA_TRACKED_PAGE_KEY) === pageKey) {
                            return true;
                        }
                    } catch (error) {
                        console.warn("DECOREVA visitor session storage read error:", error);
                    }
                }

                const user = await getDecorevaTrackingUser();

                const payload = {
                    visitor_id: visitorId,
                    user_id: user ? user.id : null,
                    page_path: pageKey,
                    product_key: productKey ? String(productKey) : null,
                    referrer: document.referrer || null
                };

                try {
                    const result = await window.decorevaSupabase
                        .from("site_visits")
                        .insert(payload);

                    if (result.error) {
                        console.error("DECOREVA visitor tracking error:", result.error);
                        return false;
                    }

                    if (!isProductView) {
                        try {
                            sessionStorage.setItem(DECOREVA_TRACKED_PAGE_KEY, pageKey);
                        } catch (error) {
                            console.warn("DECOREVA visitor session storage write error:", error);
                        }
                    }

                    return true;
                } catch (error) {
                    console.error("DECOREVA visitor tracking exception:", error);
                    return false;
                }
            }

            window.decorevaTrackVisit = trackDecorevaVisit;

            /* Track the current page. Logged-in users are linked through
               user_id; guests are stored with user_id = NULL. */
            trackDecorevaVisit();

            /* Track product-card views when a visitor opens/clicks a product.
               This does not interfere with existing card/slider behaviour. */
            document.addEventListener("click", function (event) {
                const card = event.target.closest("#collection-products .card, .featured-slider .featured-slide");
                if (!card) return;

                const productKey =
                    card.dataset.productKey ||
                    card.dataset.productId ||
                    card.getAttribute("data-product-key") ||
                    card.getAttribute("data-product-id") ||
                    card.getAttribute("data-variation-product") ||
                    "";

                if (productKey) {
                    trackDecorevaVisit(productKey);
                }
            }, true);

            function getSliderImages(slider) {
                if (!slider) return [];
                try {
                    return JSON.parse(slider.dataset.images || "[]");
                } catch (error) {
                    console.error("DECOREVA slider data error:", error);
                    return [];
                }
            }
            function getSliderIndex(slider) {
                if (!slider) return 0;
                const index = parseInt(slider.dataset.index || "0", 10);
                return Number.isNaN(index) ? 0 : index;
            }
            document.querySelectorAll("#collection-products .card").forEach(function (card) {
                const title = card.querySelector("h3");
                if (!title) return;
                if (title.textContent.trim().toLowerCase() === "family keyholder") {
                    card.remove();
                }
            });
            function updateDots(slider, images, currentIndex) {
                if (!slider) return;
                const container = slider.querySelector(".slider-dots");
                if (!container) return;
                const fragment = document.createDocumentFragment();
                images.forEach(function (_, index) {
                    const dot = document.createElement("span");
                    dot.className =
                        "slider-dot" +
                        (index === currentIndex ? " active" : "");
                    dot.dataset.index = String(index);
                    dot.setAttribute("role", "button");
                    dot.setAttribute("tabindex", "0");
                    dot.setAttribute("aria-label", "View image " + (index + 1));
                    fragment.appendChild(dot);
                });
                container.replaceChildren(fragment);
            }
            document.addEventListener("click", function (event) {
                const dot = event.target.closest(".slider-dot");
                if (!dot) return;
                const container = dot.closest(".slider-dots");
                const slider = container
                    ? container.closest(".image-slider, .featured-image-box")
                    : null;
                const index = Number(dot.dataset.index);
                if (!slider || !Number.isInteger(index)) return;
                event.preventDefault();
                event.stopPropagation();
                showSliderImage(slider, index);
            });
            document.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") return;
                const dot = event.target.closest(".slider-dot");
                if (!dot) return;
                const container = dot.closest(".slider-dots");
                const slider = container
                    ? container.closest(".image-slider, .featured-image-box")
                    : null;
                const index = Number(dot.dataset.index);
                if (!slider || !Number.isInteger(index)) return;
                event.preventDefault();
                event.stopPropagation();
                showSliderImage(slider, index);
            });
            function showSliderImage(slider, index) {
                if (!slider) return;
                const images = getSliderImages(slider);
                const image = slider.querySelector(".slider-image");
                if (!images.length || !image) return;
                index =
                    ((index % images.length) + images.length) %
                    images.length;
                slider.dataset.index = String(index);
                const targetSrc = images[index];
                if (image.getAttribute("src") !== targetSrc) {
                    image.src = targetSrc;
                }
                image.dataset.loaded = "true";
                updateDots(slider, images, index);
            }
            window.changeImage = function (button, direction) {
                if (!button) return;
                const slider = button.closest(".image-slider");
                if (!slider) return;
                const images = getSliderImages(slider);
                if (!images.length) return;
                let index = getSliderIndex(slider);
                index += Number(direction) || 0;
                showSliderImage(slider, index);
            };
            const sliderObserver =
                "IntersectionObserver" in window
                    ? new IntersectionObserver(
                        function (entries) {
                            entries.forEach(function (entry) {
                                if (!entry.isIntersecting) return;
                                const slider = entry.target;
                                const index = getSliderIndex(slider);
                                showSliderImage(slider, index);
                                sliderObserver.unobserve(slider);
                            });
                        },
                        {
                            rootMargin: "250px 0px",
                            threshold: 0.01
                        }
                    )
                    : null;
            document.querySelectorAll(".image-slider").forEach(function (slider) {
                const images = getSliderImages(slider);
                if (!images.length) return;
                updateDots(slider, images, getSliderIndex(slider));
                if (sliderObserver) {
                    sliderObserver.observe(slider);
                } else {
                    showSliderImage(slider, getSliderIndex(slider));
                }
            });
            const lightbox =
                document.querySelector("#lightbox") ||
                document.querySelector(".lightbox");
            const lightboxImg =
                document.querySelector("#lightbox-img");
            const lightboxClose =
                document.querySelector(".lightbox .close");
            const lightboxPrev =
                document.querySelector(".lightbox-prev");
            const lightboxNext =
                document.querySelector(".lightbox-next");
            let lightboxImages = [];
            let lightboxIndex = 0;
            function openLightbox(images, index) {
                if (!lightbox || !lightboxImg || !images || !images.length) {
                    return;
                }
                lightboxImages = images.filter(Boolean);
                if (!lightboxImages.length) return;
                lightboxIndex = parseInt(index, 10) || 0;
                lightboxIndex =
                    ((lightboxIndex % lightboxImages.length) +
                    lightboxImages.length) %
                    lightboxImages.length;
                lightboxImg.src = lightboxImages[lightboxIndex];
                lightbox.classList.add("active");
                document.body.classList.add("lightbox-open");
                document.body.style.overflow = "hidden";
            }
            function closeLightbox() {
                if (!lightbox) return;
                lightbox.classList.remove("active");
                document.body.classList.remove("lightbox-open");
                document.body.style.overflow = "";
            }
            function showLightboxImage(index) {
                if (!lightboxImages.length || !lightboxImg) return;
                index =
                    ((index % lightboxImages.length) +
                    lightboxImages.length) %
                    lightboxImages.length;
                lightboxIndex = index;
                lightboxImg.src = lightboxImages[index];
            }
            function flashLightboxButton(button) {
                if (!button) return;
                button.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
                button.style.transform = "translateY(-50%) scale(0.91)";
                button.style.background = "rgba(201,149,46,.95)";
                button.style.color = "#fff";
                button.style.boxShadow = "0 0 0 3px rgba(201,149,46,.18), 0 6px 18px rgba(0,0,0,.28)";
                window.clearTimeout(button._decorevaPressTimer);
                button._decorevaPressTimer = window.setTimeout(function () {
                    button.style.transform = "translateY(-50%) scale(1)";
                    button.style.background = "rgba(20,15,9,.78)";
                    button.style.color = "#f1cd7c";
                    button.style.boxShadow = "";
                }, 140);
            }
            [lightboxPrev, lightboxNext].forEach(function (button) {
                if (!button) return;
                button.addEventListener("pointerdown", function () {
                    button.style.transition = "transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease";
                    button.style.transform = "translateY(-50%) scale(0.91)";
                    button.style.background = "rgba(201,149,46,.95)";
                    button.style.color = "#fff";
                    button.style.boxShadow = "0 0 0 3px rgba(201,149,46,.18), 0 6px 18px rgba(0,0,0,.28)";
                });
                button.addEventListener("pointerup", function () {
                    flashLightboxButton(button);
                });
                button.addEventListener("pointercancel", function () {
                    flashLightboxButton(button);
                });
            });
        const featuredLightboxSlider =
            document.querySelector(".featured-slider");
        if (featuredLightboxSlider) {
            featuredLightboxSlider.addEventListener(
                "click",
                function (event) {
                    const image =
                        event.target.closest(
                            ".featured-image-box img"
                        );
                    if (!image) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const slide =
                        image.closest(".featured-slide");
                    if (!slide) return;
                    const imageBox =
                        image.closest(".featured-image-box");
                    let images = [];
                    if (
                        imageBox &&
                        imageBox.dataset.images
                    ) {
                        try {
                            images = JSON.parse(
                                imageBox.dataset.images
                            );
                        } catch (error) {
                            console.error(
                                "Featured image data error:",
                                error
                            );
                        }
                    }
                    if (
                        !images.length &&
                        slide.dataset.images
                    ) {
                        try {
                            images = JSON.parse(
                                slide.dataset.images
                            );
                        } catch (error) {
                            console.error(
                                "Featured slide data error:",
                                error
                            );
                        }
                    }
                    if (!images.length) {
                        images = [
                            image.currentSrc ||
                            image.src
                        ];
                    }
                    const currentImage =
                        image.currentSrc ||
                        image.src;
                    let currentIndex =
                        images.findIndex(
                            function (src) {
                                return (
                                    src === currentImage ||
                                    currentImage.includes(src) ||
                                    src.includes(currentImage)
                                );
                            }
                        );
                    if (currentIndex < 0) {
                        currentIndex = 0;
                    }
                    openLightbox(
                        images,
                        currentIndex
                    );
                }
            );
        }
            const collectionProducts =
                document.querySelector("#collection-products");
            if (collectionProducts) {
                collectionProducts.addEventListener(
                    "click",
                    function (event) {
                        const image =
                            event.target.closest(".slider-image");
                        if (!image) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const slider =
                            image.closest(".image-slider");
                        if (!slider) return;
                        const images = getSliderImages(slider);
                        const index = getSliderIndex(slider);
                        if (!images.length) return;
                        openLightbox(images, index);
                    }
                );
            }
            if (lightboxClose) {
                lightboxClose.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        closeLightbox();
                    }
                );
            }
            if (lightboxNext) {
                lightboxNext.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        flashLightboxButton(lightboxNext);
                        showLightboxImage(
                            lightboxIndex + 1
                        );
                    }
                );
            }
            if (lightboxPrev) {
                lightboxPrev.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        flashLightboxButton(lightboxPrev);
                        showLightboxImage(
                            lightboxIndex - 1
                        );
                    }
                );
            }
            if (lightbox) {
                lightbox.addEventListener(
                    "click",
                    function (event) {
                        if (event.target === lightbox) {
                            closeLightbox();
                        }
                    }
                );
            }
            document.addEventListener(
                "keydown",
                function (event) {
                    if (
                        !lightbox ||
                        !lightbox.classList.contains("active")
                    ) {
                        return;
                    }
                    if (event.key === "Escape") {
                        closeLightbox();
                    }
                    if (event.key === "ArrowRight") {
                        showLightboxImage(lightboxIndex + 1);
                    }
                    if (event.key === "ArrowLeft") {
                        showLightboxImage(lightboxIndex - 1);
                    }
                }
            );
            const productSearch =
                document.querySelector("#productSearch");
            function filterProducts() {
                if (!productSearch) return;
                const searchText =
                    productSearch.value.toLowerCase().trim();
                const cards =
                    document.querySelectorAll("#collection-products .card");
                if (searchText) {
                    document
                        .querySelectorAll(".decoreva-pagination")
                        .forEach(function (nav) {
                            nav.style.display = "none";
                        });
                    cards.forEach(function (card) {
                        const title = card.querySelector("h3");
                        const name = title
                            ? title.textContent.toLowerCase()
                            : "";
                        card.style.setProperty(
                            "display",
                            name.includes(searchText) ? "flex" : "none",
                            "important"
                        );
                    });
                    if (typeof window.decorevaLoadVisibleSliders === "function") {
                        window.decorevaLoadVisibleSliders();
                    }
                    return;
                }
                document
                    .querySelectorAll(".decoreva-pagination")
                    .forEach(function (nav) {
                        nav.style.display = "flex";
                    });
                if (typeof decorevaShowPage === "function") {
                    decorevaShowPage(1);
                }
            }
            if (productSearch) {
                productSearch.addEventListener(
                    "input",
                    filterProducts
                );
            }
            const voiceSearchBtn =
                document.querySelector("#voiceSearchBtn");
            if (voiceSearchBtn && productSearch) {
                const SpeechRecognition =
                    window.SpeechRecognition ||
                    window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition =
                        new SpeechRecognition();
                    recognition.lang = "en-IN";
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    voiceSearchBtn.addEventListener(
                        "click",
                        function () {
                            try {
                                recognition.start();
                                voiceSearchBtn.classList.add(
                                    "listening"
                                );
                            } catch (error) {
                                console.log(
                                    "Voice search already active."
                                );
                            }
                        }
                    );
                    recognition.addEventListener(
                        "result",
                        function (event) {
                            const transcript =
                                event.results[0][0]
                                    .transcript
                                    .trim();
                            productSearch.value =
                                transcript;
                            filterProducts();
                        }
                    );
                    recognition.addEventListener(
                        "end",
                        function () {
                            voiceSearchBtn.classList.remove(
                                "listening"
                            );
                        }
                    );
                    recognition.addEventListener(
                        "error",
                        function () {
                            voiceSearchBtn.classList.remove(
                                "listening"
                            );
                        }
                    );
                } else {
                    voiceSearchBtn.addEventListener(
                        "click",
                        function () {
                            alert(
                                "Voice search is not supported in this browser. Please use Google Chrome."
                            );
                        }
                    );
                }
            }
            const productsContainer =
                document.querySelector("#collection-products");
            const customSort =
                document.querySelector(".custom-sort");
            const customSortButton =
                document.querySelector(".custom-sort-button");
            const customSortMenu =
                document.querySelector(".custom-sort-menu");
            const sortOptions =
                customSortMenu
                    ? Array.from(
                        customSortMenu.querySelectorAll(
                            "[data-value]"
                        )
                    )
                    : [];
        const originalProductOrder =
            productsContainer
                ? Array.from(
                    productsContainer.querySelectorAll(".card")
                )
                : [];
            function getCards() {
                if (!productsContainer) return [];
                return Array.from(
                    productsContainer.querySelectorAll(".card")
                );
            }
            function getPrice(card) {
                const price =
                    card.querySelector(".price");
                if (!price) return 0;
                return parseFloat(
                    price.textContent.replace(
                        /[^\d.]/g,
                        ""
                    )
                ) || 0;
            }
            function getName(card) {
                const title =
                    card.querySelector("h3");
                if (!title) return "";
                return title.textContent
                    .trim()
                    .toLowerCase();
            }
            function sortProducts(value) {
                if (!productsContainer) return;
                const cards = getCards();
                cards.sort(function (a, b) {
                    if (value === "low-high") {
                        return getPrice(a) - getPrice(b);
                    }
                    if (value === "high-low") {
                        return getPrice(b) - getPrice(a);
                    }
                    if (value === "az") {
                        return getName(a)
                            .localeCompare(getName(b));
                    }
                    if (value === "za") {
                        return getName(b)
                            .localeCompare(getName(a));
                    }
                    return 0;
                });
                cards.forEach(function (card) {
                    productsContainer.appendChild(card);
                });
                decorevaProducts = Array.from(
                    productsContainer.querySelectorAll(".card")
                );
                if (typeof decorevaShowPage === "function") {
                    decorevaShowPage(1);
                }
            }
            function updateSortLabel(value) {
                if (!customSortButton) return;
                const label =
                    customSortButton.querySelector(
                        "span:first-child"
                    );
                const option =
                    sortOptions.find(function (item) {
                        return item.dataset.value === value;
                    });
                if (label && option) {
                    label.textContent =
                        option.textContent.trim();
                }
            }
            if (customSort && customSortButton) {
                customSortButton.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        customSort.classList.toggle("open");
                    }
                );
                sortOptions.forEach(function (option) {
                    option.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            const value =
                                option.dataset.value;
                           if (value === "default") {
            clearAllCollectionFilters();
            return;
        }
                            sortProducts(value);
                            updateSortLabel(value);
                            sortOptions.forEach(function (item) {
                                item.classList.remove("active");
                            });
                            option.classList.add("active");
                            customSort.classList.remove("open");
                            customSortButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    );
                });
                document.addEventListener(
                    "click",
                    function (event) {
                        if (!customSort.contains(event.target)) {
                            customSort.classList.remove("open");
                            customSortButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    }
                );
            }
        function clearAllCollectionFilters(shouldScrollToCollection = true) {
            if (productSearch) {
                productSearch.value = "";
            }
            if (productsContainer && originalProductOrder.length) {
                originalProductOrder.forEach(function (card) {
                    productsContainer.appendChild(card);
                });
                decorevaProducts = originalProductOrder.slice();
            }
            if (customSortButton) {
                const label =
                    customSortButton.querySelector(
                        "span:first-child"
                    );
                if (label) {
                    label.textContent = "Sort Products";
                }
                customSortButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
            sortOptions.forEach(function (item) {
                item.classList.remove("active");
            });
            if (customSort) {
                customSort.classList.remove("open");
            }
            document
                .querySelectorAll(".decoreva-pagination")
                .forEach(function (nav) {
                    nav.style.display = "flex";
                });
            if (typeof decorevaShowPage === "function") {
                decorevaShowPage(1);
            }
            if (shouldScrollToCollection) {
                requestAnimationFrame(function () {
                    scrollToCollectionTitle("smooth");
                });
            }
        }
        const collectionControls =
            document.querySelector(".collection-controls");
        if (collectionControls) {
            let clearAllButton =
                document.querySelector("#clear-all-products");
            if (!clearAllButton) {
                clearAllButton =
                    document.createElement("button");
                clearAllButton.type = "button";
                clearAllButton.id = "clear-all-products";
                clearAllButton.className = "clear-all-products";
                clearAllButton.setAttribute("aria-label", "Clear all collection filters");
                clearAllButton.textContent = "Clear All";
                clearAllButton.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        clearAllCollectionFilters();
                    }
                );
                const productSort =
                    collectionControls.querySelector(
                        ".product-sort"
                    );
                if (productSort) {
                    productSort.insertAdjacentElement(
                        "afterend",
                        clearAllButton
                    );
                } else {
                    collectionControls.insertBefore(
                        clearAllButton,
                        collectionControls.firstChild
                    );
                }
            }
        }
            const featuredSlider =
                document.querySelector(".featured-slider");
            let featuredSlides =
                Array.from(
                    document.querySelectorAll(".featured-slide")
                );
            const featuredPrev =
                document.querySelector(".featured-prev");
            const featuredNext =
                document.querySelector(".featured-next");
            const featuredDotsContainer =
                document.querySelector(".featured-dots");
            let featuredTrack = null;
            let featuredPosition = 0;
            let featuredRealIndex = 0;
            let featuredCloneCount = 0;
            let featuredAnimating = false;
            let featuredTimer = null;
            let featuredResizeTimer = null;
            function getFeaturedVisibleCount() {
                if (window.innerWidth <= 760) return 2;
                if (window.innerWidth <= 1100) return 3;
                return 4;
            }
            function getFeaturedGap() {
                if (!featuredTrack) return 10;
                const styles =
                    window.getComputedStyle(
                        featuredTrack
                    );
                return (
                    parseFloat(
                        styles.columnGap ||
                        styles.gap ||
                        "10"
                    ) || 10
                );
            }
            function getFeaturedStep() {
                if (!featuredTrack) return 0;
                const card =
                    featuredTrack.querySelector(
                        ".featured-slide"
                    );
                if (!card) return 0;
                return (
                    card.getBoundingClientRect().width +
                    getFeaturedGap()
                );
            }
            function createFeaturedDots() {
                if (!featuredDotsContainer) return;
                featuredDotsContainer.innerHTML = "";
                featuredSlides.forEach(function (_, index) {
                    const dot =
                        document.createElement("span");
                    dot.className = "featured-dot";
                    dot.setAttribute(
                        "role",
                        "button"
                    );
                    dot.setAttribute(
                        "tabindex",
                        "0"
                    );
                    dot.setAttribute(
                        "aria-label",
                        "Featured product " + (index + 1)
                    );
                    dot.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            goToFeatured(index);
                        }
                    );
                    dot.addEventListener(
                        "keydown",
                        function (event) {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                goToFeatured(index);
                            }
                        }
                    );
                    featuredDotsContainer.appendChild(dot);
                });
            }
            function updateFeaturedDots() {
                if (!featuredDotsContainer) return;
                const dots =
                    Array.from(
                        featuredDotsContainer.querySelectorAll(
                            ".featured-dot"
                        )
                    );
                dots.forEach(function (dot, index) {
                    dot.classList.toggle(
                        "active",
                        index === featuredRealIndex
                    );
                });
            }
            function clearFeaturedClones() {
                if (!featuredTrack) return;
                featuredTrack
                    .querySelectorAll(".featured-clone")
                    .forEach(function (clone) {
                        clone.remove();
                    });
            }
            function buildFeaturedLoop() {
                if (
                    !featuredSlider ||
                    !featuredSlides.length
                ) {
                    return;
                }
                if (!featuredTrack) {
                    featuredTrack =
                        document.createElement("div");
                    featuredTrack.className =
                        "featured-track";
                    featuredSlides.forEach(function (slide) {
                        featuredTrack.appendChild(slide);
                    });
                    featuredSlider.insertBefore(
                        featuredTrack,
                        featuredSlider.firstChild
                    );
                } else {
                    clearFeaturedClones();
                }
                const visible =
                    getFeaturedVisibleCount();
                featuredCloneCount =
                    Math.min(
                        visible,
                        featuredSlides.length
                    );
                const before =
                    featuredSlides
                        .slice(-featuredCloneCount)
                        .map(function (slide) {
                            const clone =
                                slide.cloneNode(true);
                            clone.classList.add(
                                "featured-clone"
                            );
                            return clone;
                        })
                        .reverse();
                const after =
                    featuredSlides
                        .slice(0, featuredCloneCount)
                        .map(function (slide) {
                            const clone =
                                slide.cloneNode(true);
                            clone.classList.add(
                                "featured-clone"
                            );
                            return clone;
                        });
                before.forEach(function (clone) {
                    featuredTrack.insertBefore(
                        clone,
                        featuredTrack.firstChild
                    );
                });
                after.forEach(function (clone) {
                    featuredTrack.appendChild(clone);
                });
                featuredPosition =
                    featuredCloneCount +
                    featuredRealIndex;
                featuredAnimating = false;
                requestAnimationFrame(function () {
                    setFeaturedPosition(false);
                    updateFeaturedDots();
                });
            }
            function setFeaturedPosition(animate) {
                if (!featuredTrack) return;
                featuredTrack.style.transition =
                    animate
                        ? "transform .55s cubic-bezier(.22,.61,.36,1)"
                        : "none";
                const step =
                    getFeaturedStep();
                featuredTrack.style.transform =
                    "translate3d(" +
                    (-featuredPosition * step) +
                    "px,0,0)";
            }
            function nextFeaturedSlide() {
                if (
                    featuredAnimating ||
                    !featuredSlides.length
                ) {
                    return;
                }
                featuredAnimating = true;
                featuredPosition++;
                setFeaturedPosition(true);
            }
            function previousFeaturedSlide() {
                if (
                    featuredAnimating ||
                    !featuredSlides.length
                ) {
                    return;
                }
                featuredAnimating = true;
                featuredPosition--;
                setFeaturedPosition(true);
            }
            function goToFeatured(index) {
                if (
                    featuredAnimating ||
                    !featuredSlides.length
                ) {
                    return;
                }
                index =
                    (
                        index %
                        featuredSlides.length +
                        featuredSlides.length
                    ) %
                    featuredSlides.length;
                featuredAnimating = true;
                featuredRealIndex = index;
                featuredPosition =
                    featuredCloneCount + index;
                setFeaturedPosition(true);
                updateFeaturedDots();
                restartFeaturedAutoPlay();
            }
            function startFeaturedAutoPlay() {
                clearInterval(featuredTimer);
                if (
                    featuredSlides.length <=
                    getFeaturedVisibleCount()
                ) {
                    return;
                }
                featuredTimer =
                    setInterval(
                        function () {
                            nextFeaturedSlide();
                        },
                        4500
                    );
            }
            function restartFeaturedAutoPlay() {
                startFeaturedAutoPlay();
            }
            if (
                featuredSlider &&
                featuredSlides.length
            ) {
                createFeaturedDots();
                buildFeaturedLoop();
                if (featuredPrev) {
                    featuredPrev.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            previousFeaturedSlide();
                            restartFeaturedAutoPlay();
                        }
                    );
                }
                if (featuredNext) {
                    featuredNext.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            nextFeaturedSlide();
                            restartFeaturedAutoPlay();
                        }
                    );
                }
                if (featuredTrack) {
                    featuredTrack.addEventListener(
                        "transitionend",
                        function (event) {
                            if (
                                event.propertyName !==
                                "transform"
                            ) {
                                return;
                            }
                            featuredAnimating = false;
                            const total =
                                featuredSlides.length;
                            const firstReal =
                                featuredCloneCount;
                            const lastReal =
                                featuredCloneCount +
                                total -
                                1;
                            if (
                                featuredPosition >
                                lastReal
                            ) {
                                featuredRealIndex = 0;
                                featuredPosition =
                                    firstReal;
                                setFeaturedPosition(false);
                            } else if (
                                featuredPosition <
                                firstReal
                            ) {
                                featuredRealIndex =
                                    total - 1;
                                featuredPosition =
                                    firstReal +
                                    total -
                                    1;
                                setFeaturedPosition(false);
                            } else {
                                featuredRealIndex =
                                    featuredPosition -
                                    featuredCloneCount;
                            }
                            updateFeaturedDots();
                        }
                    );
                }
                featuredSlider.addEventListener(
                    "mouseenter",
                    function () {
                        clearInterval(featuredTimer);
                    }
                );
                featuredSlider.addEventListener(
                    "mouseleave",
                    function () {
                        startFeaturedAutoPlay();
                    }
                );
                let touchStartX = 0;
                let touchStartY = 0;
                featuredSlider.addEventListener(
                    "touchstart",
                    function (event) {
                        const touch =
                            event.changedTouches[0];
                        touchStartX =
                            touch.screenX;
                        touchStartY =
                            touch.screenY;
                        clearInterval(featuredTimer);
                    },
                    {
                        passive: true
                    }
                );
                featuredSlider.addEventListener(
                    "touchend",
                    function (event) {
                        const touch =
                            event.changedTouches[0];
                        const dx =
                            touchStartX -
                            touch.screenX;
                        const dy =
                            touchStartY -
                            touch.screenY;
                        if (
                            Math.abs(dx) > 40 &&
                            Math.abs(dx) >
                            Math.abs(dy)
                        ) {
                            if (dx > 0) {
                                nextFeaturedSlide();
                            } else {
                                previousFeaturedSlide();
                            }
                        }
                        restartFeaturedAutoPlay();
                    },
                    {
                        passive: true
                    }
                );
                window.addEventListener(
                    "resize",
                    function () {
                        clearTimeout(
                            featuredResizeTimer
                        );
                        featuredResizeTimer =
                            setTimeout(
                                function () {
                                    clearInterval(
                                        featuredTimer
                                    );
                                    if (featuredTrack) {
                                        featuredTrack.style.transition =
                                            "none";
                                        clearFeaturedClones();
                                    }
                                    featuredAnimating = false;
                                    buildFeaturedLoop();
                                    startFeaturedAutoPlay();
                                },
                                180
                            );
                    }
                );
                startFeaturedAutoPlay();
            }
            function scrollToCollectionTitle(behavior) {
                const title = document.querySelector("#collection-title, .collection-title");
                if (!title) return;
                const offset = window.innerWidth <= 760 ? 58 : 72;
                const top = title.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: Math.max(0, top),
                    behavior: behavior || "smooth"
                });
            }
            const menuButton =
                document.querySelector(
                    ".mobile-menu-toggle"
                );
            const nav =
                document.querySelector("#main-nav");
            if (menuButton && nav) {
                menuButton.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        const isOpen =
                            nav.classList.toggle(
                                "mobile-open"
                            );
                        document.body.classList.toggle(
                            "menu-open",
                            isOpen
                        );
                        menuButton.setAttribute(
                            "aria-expanded",
                            isOpen ? "true" : "false"
                        );
                    }
                );
                nav.querySelectorAll("a")
                    .forEach(function (link) {
                        link.addEventListener(
                            "click",
                            function () {
                                nav.classList.remove(
                                    "mobile-open"
                                );
                                document.body.classList.remove(
                                    "menu-open"
                                );
                                menuButton.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );
                            }
                        );
                    });
            }
            document
                .querySelectorAll("#main-nav a[href^='#']")
                .forEach(function (link) {
                    link.addEventListener("click", function (event) {
                        const id = link.getAttribute("href");
                        if (!id || id === "#") return;
                        const target = document.querySelector(id);
                        if (!target) return;
                        const aboutSection = document.querySelector("#about");
                        if (aboutSection) aboutSection.style.display = id === "#about" ? "block" : "none";
                        event.preventDefault();
                        event.stopPropagation();
                        if (id === "#collection-title") {
                            document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
                                nav.style.display = "flex";
                            });
                            const savedPage = Number(sessionStorage.getItem("decorevaPage")) || 1;
                            if (typeof decorevaShowPage === "function") {
                                window.decorevaPageNavigation = false;
                                decorevaShowPage(savedPage);
                            }
                            requestAnimationFrame(function () {
                                scrollToCollectionTitle("smooth");
                            });
                        } else if (id === "#home") {
                            clearAllCollectionFilters(false);
                            document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
                                nav.style.display = "flex";
                            });
                            history.replaceState(
                                null,
                                "",
                                window.location.pathname
                            );
                            window.scrollTo({
                                top: 0,
                                left: 0,
                                behavior: "smooth"
                            });
                        } else {
                            document.querySelectorAll(".decoreva-pagination").forEach(function (nav) {
                                nav.style.display = "flex";
                            });
                            (id === "#about"
                                ? (target.querySelector(".about-heading") || target)
                                : target
                            ).scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                            history.replaceState(
                                null,
                                "",
                                id
                            );
                        }
                        nav.classList.remove("mobile-open");
                        document.body.classList.remove("menu-open");
                        if (menuButton) {
                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    });
                });
            document
                .querySelectorAll(
                    'a[href="#home"]:not(#main-nav a)'
                )
                .forEach(function (link) {
                    link.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            clearAllCollectionFilters(false);
                            history.replaceState(
                                null,
                                "",
                                window.location.pathname
                            );
                            window.scrollTo({
                                top: 0,
                                left: 0,
                                behavior: "smooth"
                            });
                        }
                    );
                });
            const searchContainer =
                document.querySelector(
                    ".search-container"
                );
            const searchBox =
                document.querySelector(
                    ".search-box"
                );
            if (voiceSearchBtn) {
                voiceSearchBtn.style.position = "absolute";
                voiceSearchBtn.style.right = "13px";
                voiceSearchBtn.style.top = "50%";
                voiceSearchBtn.style.transform = "translateY(-50%)";
                voiceSearchBtn.style.width = "32px";
                voiceSearchBtn.style.height = "32px";
                voiceSearchBtn.style.padding = "0";
                voiceSearchBtn.style.margin = "0";
                voiceSearchBtn.style.border = "0";
                voiceSearchBtn.style.background = "transparent";
                voiceSearchBtn.style.display = "flex";
                voiceSearchBtn.style.alignItems = "center";
                voiceSearchBtn.style.justifyContent = "center";
                voiceSearchBtn.style.cursor = "pointer";
                voiceSearchBtn.style.zIndex = "50";
            }
            document
                .querySelectorAll(".slider-btn")
                .forEach(function (button) {
                    button.addEventListener(
                        "click",
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    );
                });
            document
                .querySelectorAll("img")
                .forEach(function (image) {
                    image.setAttribute(
                        "draggable",
                        "false"
                    );
                });
            if (!sliderObserver) {
                document
                    .querySelectorAll("#collection-products .image-slider")
                    .forEach(function (slider) {
                        const images = getSliderImages(slider);
                        if (images.length) {
                            showSliderImage(
                                slider,
                                getSliderIndex(slider)
                            );
                        }
                    });
            }
            document.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key === "Escape" &&
                        customSort
                    ) {
                        customSort.classList.remove(
                            "open"
                        );
                    }
                }
            );
            window.addEventListener(
                "beforeunload",
                function () {
                    clearInterval(
                        featuredTimer
                    );
                }
            );
        let decorevaProducts = Array.from(
            document.querySelectorAll("#collection-products .card")
        );
        const decorevaPerPage = 20;
        const decorevaTotalPages = Math.max(
            1,
            Math.ceil(decorevaProducts.length / decorevaPerPage)
        );
        let decorevaCurrentPage = 1;
        function decorevaPaginationStyle(nav) {
            nav.style.display = "flex";
            nav.style.justifyContent = "center";
            nav.style.alignItems = "center";
            nav.style.gap = "22px";
            nav.style.margin = "28px 0";
            nav.style.padding = "8px 0";
            nav.style.fontFamily = "inherit";
        }
        function createDecorevaPagination() {
            const nav = document.createElement("div");
            nav.className = "decoreva-pagination";
            decorevaPaginationStyle(nav);
            const previous = document.createElement("button");
            previous.type = "button";
            previous.innerHTML = "‹";
            previous.setAttribute(
                "aria-label",
                "Previous page"
            );
            previous.style.border = "none";
            previous.style.background = "transparent";
            previous.style.fontSize = "30px";
            previous.style.lineHeight = "1";
            previous.style.color = "#8b6a32";
            previous.style.cursor = "pointer";
            previous.style.padding = "4px 8px";
            previous.style.fontWeight = "400";
            previous.addEventListener(
                "click",
                function () {window.decorevaPageNavigation = true;
                    if (decorevaCurrentPage > 1) {
                        decorevaShowPage(
                            decorevaCurrentPage - 1
                        );
                    }
                }
            );
            nav.appendChild(previous);
            for (
                let page = 1;
                page <= decorevaTotalPages;
                page++
            ) {
                const number = document.createElement("button");
                number.type = "button";
                number.textContent = page;
                number.dataset.page = page;
                number.style.border = "none";
                number.style.background = "transparent";
                number.style.color = "#5a4630";
                number.style.cursor = "pointer";
                number.style.fontSize = "15px";
                number.style.padding = "5px 4px";
                number.style.minWidth = "24px";
                number.style.fontWeight = "400";
                number.addEventListener(
                    "click",
                    function () {window.decorevaPageNavigation = true;
                        decorevaShowPage(page);
                    }
                );
                nav.appendChild(number);
            }
            const next = document.createElement("button");
            next.type = "button";
            next.innerHTML = "›";
            next.setAttribute(
                "aria-label",
                "Next page"
            );
            next.style.border = "none";
            next.style.background = "transparent";
            next.style.fontSize = "30px";
            next.style.lineHeight = "1";
            next.style.color = "#8b6a32";
            next.style.cursor = "pointer";
            next.style.padding = "4px 8px";
            next.style.fontWeight = "400";
            next.addEventListener(
                "click",
                function () {window.decorevaPageNavigation = true;
                    if (
                        decorevaCurrentPage <
                        decorevaTotalPages
                    ) {
                        decorevaShowPage(
                            decorevaCurrentPage + 1
                        );
                    }
                }
            );
            nav.appendChild(next);
            return nav;
        }
        window.decorevaLoadVisibleSliders = function () {
            const sliders =
                document.querySelectorAll("#collection-products .image-slider");
            sliders.forEach(function (slider) {
                if (slider.closest(".card")?.style.display === "none") return;
                const rect = slider.getBoundingClientRect();
                if (
                    rect.bottom >= -250 &&
                    rect.top <= window.innerHeight + 250
                ) {
                    showSliderImage(slider, getSliderIndex(slider));
                }
            });
        };
        function decorevaShowPage(page) {
            decorevaCurrentPage = page;
            sessionStorage.setItem("decorevaPage", page);
            const aboutSection = document.querySelector("#about");
            if (aboutSection) aboutSection.style.display = "none";
            const start =
                (page - 1) * decorevaPerPage;
            const end =
                start + decorevaPerPage;
            decorevaProducts.forEach(
                function (card, index) {
                    card.style.setProperty(
                        "display",
                        index >= start && index < end
                            ? "flex"
                            : "none",
                        "important"
                    );
                }
            );
            if (typeof window.decorevaLoadVisibleSliders === "function") {
                window.decorevaLoadVisibleSliders();
            }
        if (window.decorevaPageNavigation) {
            requestAnimationFrame(function () {
                scrollToCollectionTitle("auto");
            });
        }
            document
                .querySelectorAll(
                    ".decoreva-pagination"
                )
                .forEach(
                    function (nav) {
                        const buttons =
                            nav.querySelectorAll(
                                "button"
                            );
                        buttons.forEach(
                            function (button) {
                                if (
                                    button.dataset.page
                                ) {
                                    const isActive =
                                        Number(
                                            button.dataset.page
                                        ) === page;
                                    if (isActive) {
                                        button.style.color =
                                            "#b98218";
                                        button.style.fontWeight =
                                            "700";
                                        button.style.borderBottom =
                                            "2px solid #b98218";
                                    } else {
                                        button.style.color =
                                            "#5a4630";
                                        button.style.fontWeight =
                                            "400";
                                        button.style.borderBottom =
                                            "2px solid transparent";
                                    }
                                }
                            }
                        );
                        const previousButton =
                            buttons[0];
                        const nextButton =
                            buttons[buttons.length - 1];
                        if (page === 1) {
                            previousButton.disabled = true;
                            previousButton.style.opacity = "0.25";
                            previousButton.style.cursor =
                                "default";
                        } else {
                            previousButton.disabled = false;
                            previousButton.style.opacity = "1";
                            previousButton.style.cursor =
                                "pointer";
                        }
                        if (
                            page === decorevaTotalPages
                        ) {
                            nextButton.disabled = true;
                            nextButton.style.opacity = "0.25";
                            nextButton.style.cursor =
                                "default";
                        } else {
                            nextButton.disabled = false;
                            nextButton.style.opacity = "1";
                            nextButton.style.cursor =
                                "pointer";
                        }
                    }
                );
            }
        const decorevaGrid =
            document.querySelector(
                "#collection-products"
            );
        if (
            decorevaGrid &&
            decorevaProducts.length > 0
        ) {
            decorevaGrid.parentNode
                .querySelectorAll(".decoreva-pagination")
                .forEach(function (nav) {
                    nav.remove();
                });
            const paginationAbove =
                createDecorevaPagination();
            const paginationBelow =
                createDecorevaPagination();
            decorevaGrid.parentNode.insertBefore(
                paginationAbove,
                decorevaGrid
            );
            decorevaGrid.insertAdjacentElement(
                "afterend",
                paginationBelow
            );
            const savedPage =
                Number(sessionStorage.getItem("decorevaPage")) || 1;
            decorevaShowPage(savedPage);
        }
            const decorevaVariationProducts = {
            "happy-place-1": {
                defaultVariation: "black",
                variations: {
                    "black": {
                        price: "₹299",
                        size: "Size: 12 × 7 inch (Approx.)",
                        amazon: "https://amzn.in/d/0bqU4Xuu",
                        whatsapp: "This Is My Happy Place MDF Wallart - Black",
                        images: [
                            "images/Thisismyhappyplace_Black_01.webp",
                            "images/Thisismyhappyplace_Black_02.webp",
                            "images/Thisismyhappyplace_Black_03.webp",
                            "images/Thisismyhappyplace_Black_04.webp",
                            "images/Thisismyhappyplace_Black_05.webp",
                            "images/Thisismyhappyplace_Black_06.webp",
                            "images/Thisismyhappyplace_Black_07.webp",
                            "images/Thisismyhappyplace_Black_08.webp",
                            "images/Thisismyhappyplace_Black_09.webp"
                        ]
                    },
                    "red": {
                        price: "₹299",
                        size: "Size: 12 × 7 inch (Approx.)",
                        amazon: "https://amzn.in/d/06FvVbYg",
                        whatsapp: "This Is My Happy Place MDF Wallart - Red",
                        images: [
                            "images/Thisismyhappyplace_Red_01.webp",
                            "images/Thisismyhappyplace_Red_02.webp",
                            "images/Thisismyhappyplace_Red_03.webp",
                            "images/Thisismyhappyplace_Red_04.webp",
                            "images/Thisismyhappyplace_Red_05.webp",
                            "images/Thisismyhappyplace_Red_06.webp",
                            "images/Thisismyhappyplace_Red_07.webp",
                            "images/Thisismyhappyplace_Red_08.webp",
                            "images/Thisismyhappyplace_Red_09.webp"
                        ]
                    }
                }
            },
            "radha-krishna-2": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/005U5hmW",
                        whatsapp: "Radha Krishna Small Temple 2 - Brown Small",
                        images: [
                            "images/Radha Krishna Temple_02_Small_Brown_01.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_02.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_03.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_04.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_05.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_06.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_07.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_08.webp",
                            "images/Radha Krishna Temple_02_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/0aHi7S4O",
                        whatsapp: "Radha Krishna Small Temple 2 - Brown Big",
                        images: [
                            "images/Radha Krishna Temple_02_Big_Brown_01.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_02.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_03.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_04.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_05.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_06.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_07.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_08.webp",
                            "images/Radha Krishna Temple_02_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/0c7WcRdE",
                        whatsapp: "Radha Krishna Small Temple 2 - Dark Brown Small",
                        images: [
                            "images/Radha Krishna Temple_02_Small_Darkbrown_01.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_02.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_03.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_04.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_05.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_06.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_07.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_08.webp",
                            "images/Radha Krishna Temple_02_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/0cIsHZ0d",
                        whatsapp: "Radha Krishna Small Temple 2 - Dark Brown Big",
                        images: [
                            "images/Radha Krishna Temple_02_Big_Darkbrown_01.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_02.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_03.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_04.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_05.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_06.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_07.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_08.webp",
                            "images/Radha Krishna Temple_02_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            },
            "radha-krishna-1": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/0412ozF3",
                        whatsapp: "Radha Krishna Small Temple - Brown Small",
                        images: [
                            "images/Radha Krishna Temple_01_Small_Brown_01.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_02.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_03.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_04.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_05.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_06.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_07.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_08.webp",
                            "images/Radha Krishna Temple_01_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/03VyLAM6",
                        whatsapp: "Radha Krishna Small Temple - Brown Big",
                        images: [
                            "images/Radha Krishna Temple_01_Big_Brown_01.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_02.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_03.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_04.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_05.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_06.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_07.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_08.webp",
                            "images/Radha Krishna Temple_01_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/0iF4jE0x",
                        whatsapp: "Radha Krishna Small Temple - Dark Brown Small",
                        images: [
                            "images/Radha Krishna Temple_01_Small_Darkbrown_01.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_02.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_03.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_04.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_05.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_06.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_07.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_08.webp",
                            "images/Radha Krishna Temple_01_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/08WY03U0",
                        whatsapp: "Radha Krishna Small Temple - Dark Brown Big",
                        images: [
                            "images/Radha Krishna Temple_01_Big_Darkbrown_01.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_02.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_03.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_04.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_05.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_06.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_07.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_08.webp",
                            "images/Radha Krishna Temple_01_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            },
            "lakshmi-ganesha-1": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/0dZPplNw",
                        whatsapp: "Lakshmi Ganesha Small Temple - Brown Small",
                        images: [
                            "images/Lakshmi Ganesha_Temple_Small_Brown_01.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_02.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_03.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_04.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_05.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_06.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_07.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_08.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/04y60sk1",
                        whatsapp: "Lakshmi Ganesha Small Temple - Brown Big",
                        images: [
                            "images/Lakshmi Ganesha_Temple_Big_Brown_01.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_02.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_03.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_04.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_05.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_06.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_07.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_08.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/01CKyfSY",
                        whatsapp: "Lakshmi Ganesha Small Temple - Dark Brown Small",
                        images: [
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_01.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_02.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_03.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_04.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_05.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_06.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_07.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_08.webp",
                            "images/Lakshmi Ganesha_Temple_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/0654Yb37",
                        whatsapp: "Lakshmi Ganesha Small Temple - Dark Brown Big",
                        images: [
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_01.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_02.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_03.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_04.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_05.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_06.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_07.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_08.webp",
                            "images/Lakshmi Ganesha_Temple_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            },
                "sherawali-1": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0hKdqLAl",
                            whatsapp: "Sherawali Mata Temple - Brown Small",
                            images: [
                                "images/Sherawalimatatemple_01_Small_Brown.webp",
                                "images/Sherawalimatatemple_02_Small_Brown.webp",
                                "images/Sherawalimatatemple_03_Small_Brown.webp",
                                "images/Sherawalimatatemple_04_Small_Brown.webp",
                                "images/Sherawalimatatemple_05_Small_Brown.webp",
                                "images/Sherawalimatatemple_06_Small_Brown.webp",
                                "images/Sherawalimatatemple_07_Small_Brown.webp",
                                "images/Sherawalimatatemple_08_Small_Brown.webp",
                                "images/Sherawalimatatemple_09_Small_Brown.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/09hyu0US",
                            whatsapp: "Sherawali Mata Temple - Brown Big",
                            images: [
                                "images/Sherawalimatatemple_01_Big_Brown.webp",
                                "images/Sherawalimatatemple_02_Big_Brown.webp",
                                "images/Sherawalimatatemple_03_Big_Brown.webp",
                                "images/Sherawalimatatemple_04_Big_Brown.webp",
                                "images/Sherawalimatatemple_05_Big_Brown.webp",
                                "images/Sherawalimatatemple_06_Big_Brown.webp",
                                "images/Sherawalimatatemple_07_Big_Brown.webp",
                                "images/Sherawalimatatemple_08_Big_Brown.webp",
                                "images/Sherawalimatatemple_09_Big_Brown.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/08DePxbl",
                            whatsapp: "Sherawali Mata Temple - Dark Brown Small",
                            images: [
                                "images/Sherawalimatatemple_01_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_02_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_03_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_04_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_05_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_06_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_07_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_08_Small_Darkbrown.webp",
                                "images/Sherawalimatatemple_09_Small_Darkbrown.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/03Rcbh9e",
                            whatsapp: "Sherawali Mata Temple - Dark Brown Big",
                            images: [
                                "images/Sherawalimatatemple_01_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_03_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_04_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_05_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_06_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_07_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_08_Big_DarkBrown.webp",
                                "images/Sherawalimatatemple_09_Big_DarkBrown.webp"
                            ]
                        }
                    }
                },
                "sherawali-2": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0arqThT9",
                            whatsapp: "Sherawali Mata Temple 2 - Brown Small",
                            images: [
                                "images/Sherawalimatatemple_02_Small_Brown_01.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_02.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_03.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_04.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_05.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_06.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_07.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_08.webp",
                                "images/Sherawalimatatemple_02_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/03E4xYH5",
                            whatsapp: "Sherawali Mata Temple 2 - Brown Big",
                            images: [
                                "images/Sherawalimatatemple_02_Big_Brown_01.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_02.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_03.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_04.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_05.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_06.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_07.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_08.webp",
                                "images/Sherawalimatatemple_02_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0dj2Lz3c",
                            whatsapp: "Sherawali Mata Temple 2 - Dark Brown Small",
                            images: [
                                "images/Sherawalimatatemple_02_Small_Darkrown_01.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_02.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_03.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_04.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_05.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_06.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_07.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_08.webp",
                                "images/Sherawalimatatemple_02_Small_Darkrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0cGv5Z1p",
                            whatsapp: "Sherawali Mata Temple 2 - Dark Brown Big",
                            images: [
                                "images/Sherawalimatatemple_02_Big_DarkBrown_01.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_02.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_03.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_04.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_05.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_06.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_07.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_08.webp",
                                "images/Sherawalimatatemple_02_Big_DarkBrown_09.webp"
                            ]
                        }
                    }
                    },
        "sherawali-3": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0izsug2U",
                    whatsapp: "Sherawali Mata Temple 3 - Brown Small",
                    images: [
                        "images/Sherawalimata_03_Small_Brown_01.webp",
                        "images/Sherawalimata_03_Small_Brown_02.webp",
                        "images/Sherawalimata_03_Small_Brown_03.webp",
                        "images/Sherawalimata_03_Small_Brown_04.webp",
                        "images/Sherawalimata_03_Small_Brown_05.webp",
                        "images/Sherawalimata_03_Small_Brown_06.webp",
                        "images/Sherawalimata_03_Small_Brown_07.webp",
                        "images/Sherawalimata_03_Small_Brown_08.webp",
                        "images/Sherawalimata_03_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0fajTDks",
                    whatsapp: "Sherawali Mata Temple 3 - Brown Big",
                    images: [
                        "images/Sherawalimata_03_Big_Brown_01.webp",
                        "images/Sherawalimata_03_Big_Brown_02.webp",
                        "images/Sherawalimata_03_Big_Brown_03.webp",
                        "images/Sherawalimata_03_Big_Brown_04.webp",
                        "images/Sherawalimata_03_Big_Brown_05.webp",
                        "images/Sherawalimata_03_Big_Brown_06.webp",
                        "images/Sherawalimata_03_Big_Brown_07.webp",
                        "images/Sherawalimata_03_Big_Brown_08.webp",
                        "images/Sherawalimata_03_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0fiWhSdI",
                    whatsapp: "Sherawali Mata Temple 3 - Dark Brown Small",
                    images: [
                        "images/Sherawalimata_03_Small_Darkbrown_01.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_02.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_03.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_04.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_05.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_06.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_07.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_08.webp",
                        "images/Sherawalimata_03_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0cL2sOsj",
                    whatsapp: "Sherawali Mata Temple 3 - Dark Brown Big",
                    images: [
                        "images/Sherawalimata_03_Big_Darkbrown_01.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_02.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_03.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_04.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_05.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_06.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_07.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_08.webp",
                        "images/Sherawalimata_03_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
                "sherawali-4": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0gfODZNB",
                    whatsapp: "Sherawali Mata Temple 4 - Brown Small",
                    images: [
                        "images/Sherawalimata Temple_04_Small_Brown_01.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_02.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_03.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_04.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_05.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_06.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_07.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_08.webp",
                        "images/Sherawalimata Temple_04_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0a1tvQM1",
                    whatsapp: "Sherawali Mata Temple 4 - Brown Big",
                    images: [
                        "images/Sherawalimata Temple_04_Big_Brown_01.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_02.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_03.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_04.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_05.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_06.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_07.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_08.webp",
                        "images/Sherawalimata Temple_04_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/05l1jM6H",
                    whatsapp: "Sherawali Mata Temple 4 - Dark Brown Small",
                    images: [
                        "images/Sherawalimata Temple_04_Small_Darkbrown_01.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_02.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_03.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_04.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_05.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_06.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_07.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_08.webp",
                        "images/Sherawalimata Temple_04_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0f5J7uWW",
                    whatsapp: "Sherawali Mata Temple 4 - Dark Brown Big",
                    images: [
                        "images/Sherawalimata Temple_04_Big_Darkbrown_01.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_02.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_03.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_04.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_05.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_06.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_07.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_08.webp",
                        "images/Sherawalimata Temple_04_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "shiv-parvati-1": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0b5XcQw3",
                    whatsapp: "Shiv Parvati Temple - Brown Small",
                    images: [
                        "images/Shivparvatitemple_01_Small_Brown_01.webp",
                        "images/Shivparvatitemple_01_Small_Brown_02.webp",
                        "images/Shivparvatitemple_01_Small_Brown_03.webp",
                        "images/Shivparvatitemple_01_Small_Brown_04.webp",
                        "images/Shivparvatitemple_01_Small_Brown_05.webp",
                        "images/Shivparvatitemple_01_Small_Brown_06.webp",
                        "images/Shivparvatitemple_01_Small_Brown_07.webp",
                        "images/Shivparvatitemple_01_Small_Brown_08.webp",
                        "images/Shivparvatitemple_01_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/03cwZ8fE",
                    whatsapp: "Shiv Parvati Temple - Brown Big",
                    images: [
                        "images/Shivparvatitemple_01_Big_Brown_01.webp",
                        "images/Shivparvatitemple_01_Big_Brown_02.webp",
                        "images/Shivparvatitemple_01_Big_Brown_03.webp",
                        "images/Shivparvatitemple_01_Big_Brown_04.webp",
                        "images/Shivparvatitemple_01_Big_Brown_05.webp",
                        "images/Shivparvatitemple_01_Big_Brown_06.webp",
                        "images/Shivparvatitemple_01_Big_Brown_07.webp",
                        "images/Shivparvatitemple_01_Big_Brown_08.webp",
                        "images/Shivparvatitemple_01_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/03ersPUv",
                    whatsapp: "Shiv Parvati Temple - Dark Brown Small",
                    images: [
                        "images/Shivparvatitemple_01_Small_Darkbrown_01.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_02.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_03.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_04.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_05.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_06.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_07.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_08.webp",
                        "images/Shivparvatitemple_01_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/03hAJP4O",
                    whatsapp: "Shiv Parvati Temple - Dark Brown Big",
                    images: [
                        "images/Shivparvatitemple_01_Big_Darkbrown_01.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_02.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_03.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_04.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_05.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_06.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_07.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_08.webp",
                        "images/Shivparvatitemple_01_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
            "shiv-parvati-2": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0hYVylr1",
                    whatsapp: "Shiv Parvati Small Temple 2 - Brown Small",
                    images: [
                        "images/ShivParvatitemple_02_Small_Brown_01.webp",
                        "images/ShivParvatitemple_02_Small_Brown_02.webp",
                        "images/ShivParvatitemple_02_Small_Brown_03.webp",
                        "images/ShivParvatitemple_02_Small_Brown_04.webp",
                        "images/ShivParvatitemple_02_Small_Brown_05.webp",
                        "images/ShivParvatitemple_02_Small_Brown_06.webp",
                        "images/ShivParvatitemple_02_Small_Brown_07.webp",
                        "images/ShivParvatitemple_02_Small_Brown_08.webp",
                        "images/ShivParvatitemple_02_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/02CrHlvJ",
                    whatsapp: "Shiv Parvati Small Temple 2 - Brown Big",
                    images: [
                        "images/ShivParvatitemple_02_Big_Brown_01.webp",
                        "images/ShivParvatitemple_02_Big_Brown_02.webp",
                        "images/ShivParvatitemple_02_Big_Brown_03.webp",
                        "images/ShivParvatitemple_02_Big_Brown_04.webp",
                        "images/ShivParvatitemple_02_Big_Brown_05.webp",
                        "images/ShivParvatitemple_02_Big_Brown_06.webp",
                        "images/ShivParvatitemple_02_Big_Brown_07.webp",
                        "images/ShivParvatitemple_02_Big_Brown_08.webp",
                        "images/ShivParvatitemple_02_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/03uf1aPo",
                    whatsapp: "Shiv Parvati Small Temple 2 - Dark Brown Small",
                    images: [
                        "images/ShivParvatitemple_02_Small_Darkbrown_01.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_02.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_03.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_04.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_05.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_06.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_07.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_08.webp",
                        "images/ShivParvatitemple_02_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/02XBU4Gd",
                    whatsapp: "Shiv Parvati Small Temple 2 - Dark Brown Big",
                    images: [
                        "images/ShivParvatitemple_02_Big_Darkbrown_01.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_02.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_03.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_04.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_05.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_06.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_07.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_08.webp",
                        "images/ShivParvatitemple_02_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
                "shiv-parvati-3": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0f1drRls",
                            whatsapp: "Shiv Parvati Temple 3 - Brown Small",
                            images: [
                            "images/Shivparvatitemple_03_Small_Brown_01.webp",
                            "images/Shivparvatitemple_03_Small_Brown_02.webp",
                            "images/Shivparvatitemple_03_Small_Brown_03.webp",
                            "images/Shivparvatitemple_03_Small_Brown_04.webp",
                            "images/Shivparvatitemple_03_Small_Brown_05.webp",
                            "images/Shivparvatitemple_03_Small_Brown_06.webp",
                            "images/Shivparvatitemple_03_Small_Brown_07.webp",
                            "images/Shivparvatitemple_03_Small_Brown_08.webp",
                            "images/Shivparvatitemple_03_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/05o5nTgm",
                            whatsapp: "Shiv Parvati Temple 3 - Brown Big",
                            images: [
                            "images/Shivparvatitemple_03_Big_Brown_01.webp",
                            "images/Shivparvatitemple_03_Big_Brown_02.webp",
                            "images/Shivparvatitemple_03_Big_Brown_03.webp",
                            "images/Shivparvatitemple_03_Big_Brown_04.webp",
                            "images/Shivparvatitemple_03_Big_Brown_05.webp",
                            "images/Shivparvatitemple_03_Big_Brown_06.webp",
                            "images/Shivparvatitemple_03_Big_Brown_07.webp",
                            "images/Shivparvatitemple_03_Big_Brown_08.webp",
                            "images/Shivparvatitemple_03_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0bjseaa9",
                            whatsapp: "Shiv Parvati Temple 3 - Dark Brown Small",
                            images: [
                            "images/Shivparvatitemple_03_Small_Darkbrown_01.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_02.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_03.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_04.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_05.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_06.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_07.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_08.webp",
                            "images/Shivparvatitemple_03_Small_Darkbrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/05Q5QwZF",
                            whatsapp: "Shiv Parvati Temple 3 - Dark Brown Big",
                            images: [
                            "images/Shivparvatitemple_03_Big_Darkbrown_01.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_02.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_03.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_04.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_05.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_06.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_07.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_08.webp",
                            "images/Shivparvatitemple_03_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                },
    "shiva-1": {
        defaultVariation: "brown-small",
        variations: {
            "brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/0bhOrhrA",
                whatsapp: "Shiva Small Temple - Brown Small",
                images: [
                    "images/Shivatemple_Small_Brown_01.webp",
                    "images/Shivatemple_Small_Brown_02.webp",
                    "images/Shivatemple_Small_Brown_03.webp",
                    "images/Shivatemple_Small_Brown_04.webp",
                    "images/Shivatemple_Small_Brown_05.webp",
                    "images/Shivatemple_Small_Brown_06.webp",
                    "images/Shivatemple_Small_Brown_07.webp",
                    "images/Shivatemple_Small_Brown_08.webp",
                    "images/Shivatemple_Small_Brown_09.webp"
                ]
            },
            "brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/0gGYOUAX",
                whatsapp: "Shiva Small Temple - Brown Big",
                images: [
                    "images/Shivatemple_Big_Brown_01.webp",
                    "images/Shivatemple_Big_Brown_02.webp",
                    "images/Shivatemple_Big_Brown_03.webp",
                    "images/Shivatemple_Big_Brown_04.webp",
                    "images/Shivatemple_Big_Brown_05.webp",
                    "images/Shivatemple_Big_Brown_06.webp",
                    "images/Shivatemple_Big_Brown_07.webp",
                    "images/Shivatemple_Big_Brown_08.webp",
                    "images/Shivatemple_Big_Brown_09.webp"
                ]
            },
            "dark-brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/09BhbjJ1",
                whatsapp: "Shiva Small Temple - Dark Brown Small",
                images: [
                    "images/Shivatemple_Small_Darkrown_01.webp",
                    "images/Shivatemple_Small_Darkrown_02.webp",
                    "images/Shivatemple_Small_Darkrown_03.webp",
                    "images/Shivatemple_Small_Darkrown_04.webp",
                    "images/Shivatemple_Small_Darkrown_05.webp",
                    "images/Shivatemple_Small_Darkrown_06.webp",
                    "images/Shivatemple_Small_Darkrown_07.webp",
                    "images/Shivatemple_Small_Darkrown_08.webp",
                    "images/Shivatemple_Small_Darkrown_09.webp"
                ]
            },
            "dark-brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/08soQzMu",
                whatsapp: "Shiva Small Temple - Dark Brown Big",
                images: [
                    "images/Shivatemple_Big_Darkrown_01.webp",
                    "images/Shivatemple_Big_Darkrown_02.webp",
                    "images/Shivatemple_Big_Darkrown_03.webp",
                    "images/Shivatemple_Big_Darkrown_04.webp",
                    "images/Shivatemple_Big_Darkrown_05.webp",
                    "images/Shivatemple_Big_Darkrown_06.webp",
                    "images/Shivatemple_Big_Darkrown_07.webp",
                    "images/Shivatemple_Big_Darkrown_08.webp",
                    "images/Shivatemple_Big_Darkrown_09.webp"
                ]
            }
        }
    },
    "siyaram-1": {
        defaultVariation: "brown-small",
        variations: {
            "brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/05tK8gJy",
                whatsapp: "Siyaram Small Temple - Brown Small",
                images: [
                    "images/Siyaramtemple_01_Small_Brown_01.webp",
                    "images/Siyaramtemple_01_Small_Brown_02.webp",
                    "images/Siyaramtemple_01_Small_Brown_03.webp",
                    "images/Siyaramtemple_01_Small_Brown_04.webp",
                    "images/Siyaramtemple_01_Small_Brown_05.webp",
                    "images/Siyaramtemple_01_Small_Brown_06.webp",
                    "images/Siyaramtemple_01_Small_Brown_07.webp",
                    "images/Siyaramtemple_01_Small_Brown_08.webp",
                    "images/Siyaramtemple_01_Small_Brown_09.webp"
                ]
            },
            "brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/06I1Y8Ry",
                whatsapp: "Siyaram Small Temple - Brown Big",
                images: [
                    "images/Siyaramtemple_01_Big_Brown_01.webp",
                    "images/Siyaramtemple_01_Big_Brown_02.webp",
                    "images/Siyaramtemple_01_Big_Brown_03.webp",
                    "images/Siyaramtemple_01_Big_Brown_04.webp",
                    "images/Siyaramtemple_01_Big_Brown_05.webp",
                    "images/Siyaramtemple_01_Big_Brown_06.webp",
                    "images/Siyaramtemple_01_Big_Brown_07.webp",
                    "images/Siyaramtemple_01_Big_Brown_08.webp",
                    "images/Siyaramtemple_01_Big_Brown_09.webp"
                ]
            },
            "dark-brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/05WrvCs0",
                whatsapp: "Siyaram Small Temple - Dark Brown Small",
                images: [
                    "images/Siyaramtemple_01_Small_Darkbrown_01.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_02.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_03.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_04.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_05.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_06.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_07.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_08.webp",
                    "images/Siyaramtemple_01_Small_Darkbrown_09.webp"
                ]
            },
            "dark-brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/09BSNNbN",
                whatsapp: "Siyaram Small Temple - Dark Brown Big",
                images: [
                    "images/Siyaramtemple_01_Big_Darkbrown_01.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_02.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_03.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_04.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_05.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_06.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_07.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_08.webp",
                    "images/Siyaramtemple_01_Big_Darkbrown_09.webp"
                ]
            }
        }
    },
    "siyaram-2": {
        defaultVariation: "brown-small",
        variations: {
            "brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/0357ndZq",
                whatsapp: "Siyaram Small Temple 2 - Brown Small",
                images: [
                    "images/Siyaramtemple_02_Small_Brown_01.webp",
                    "images/Siyaramtemple_02_Small_Brown_02.webp",
                    "images/Siyaramtemple_02_Small_Brown_03.webp",
                    "images/Siyaramtemple_02_Small_Brown_04.webp",
                    "images/Siyaramtemple_02_Small_Brown_05.webp",
                    "images/Siyaramtemple_02_Small_Brown_06.webp",
                    "images/Siyaramtemple_02_Small_Brown_07.webp",
                    "images/Siyaramtemple_02_Small_Brown_08.webp",
                    "images/Siyaramtemple_02_Small_Brown_09.webp"
                ]
            },
            "brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/0cIg1mVm",
                whatsapp: "Siyaram Small Temple 2 - Brown Big",
                images: [
                    "images/Siyaramtemple_02_Big_Brown_01.webp",
                    "images/Siyaramtemple_02_Big_Brown_02.webp",
                    "images/Siyaramtemple_02_Big_Brown_03.webp",
                    "images/Siyaramtemple_02_Big_Brown_04.webp",
                    "images/Siyaramtemple_02_Big_Brown_05.webp",
                    "images/Siyaramtemple_02_Big_Brown_06.webp",
                    "images/Siyaramtemple_02_Big_Brown_07.webp",
                    "images/Siyaramtemple_02_Big_Brown_08.webp",
                    "images/Siyaramtemple_02_Big_Brown_09.webp"
                ]
            },
            "dark-brown-small": {
                price: "₹299",
                size: "Size : 3.3 × 4.6 inch Approx",
                amazon: "https://amzn.in/d/0e9dbVWa",
                whatsapp: "Siyaram Small Temple 2 - Dark Brown Small",
                images: [
                    "images/Siyaramtemple_02_Small_Darkbrown_01.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_02.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_03.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_04.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_05.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_06.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_07.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_08.webp",
                    "images/Siyaramtemple_02_Small_Darkbrown_09.webp"
                ]
            },
            "dark-brown-big": {
                price: "₹399",
                size: "Size : 4 × 5.1 inch Approx",
                amazon: "https://amzn.in/d/0401KVZ2",
                whatsapp: "Siyaram Small Temple 2 - Dark Brown Big",
                images: [
                    "images/Siyaramtemple_02_Big_Darkbrown_01.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_02.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_03.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_04.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_05.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_06.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_07.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_08.webp",
                    "images/Siyaramtemple_02_Big_Darkbrown_09.webp"
                ]
            }
        }
    },
    "ganesha-1": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/07GtndwV",
                            whatsapp: "Ganesha Small Temple 2 - Brown Small",
                            images: [
                                "images/Ganesha_01_Small_Brown_01.webp",
                                "images/Ganesha_01_Small_Brown_02.webp",
                                "images/Ganesha_01_Small_Brown_03.webp",
                                "images/Ganesha_01_Small_Brown_04.webp",
                                "images/Ganesha_01_Small_Brown_05.webp",
                                "images/Ganesha_01_Small_Brown_06.webp",
                                "images/Ganesha_01_Small_Brown_07.webp",
                                "images/Ganesha_01_Small_Brown_08.webp",
                                "images/Ganesha_01_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/00a4ejCY",
                            whatsapp: "Ganesha Small Temple 2 - Brown Big",
                            images: [
                                "images/Ganesha_01_Big_Brown_01.webp",
                                "images/Ganesha_01_Big_Brown_02.webp",
                                "images/Ganesha_01_Big_Brown_03.webp",
                                "images/Ganesha_01_Big_Brown_04.webp",
                                "images/Ganesha_01_Big_Brown_05.webp",
                                "images/Ganesha_01_Big_Brown_06.webp",
                                "images/Ganesha_01_Big_Brown_07.webp",
                                "images/Ganesha_01_Big_Brown_08.webp",
                                "images/Ganesha_01_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0j0ORVEp",
                            whatsapp: "Ganesha Small Temple 2 - Dark Brown Small",
                            images: [
                                "images/Ganesha_01_Small_Darkbrown_01.webp",
                                "images/Ganesha_01_Small_Darkbrown_02.webp",
                                "images/Ganesha_01_Small_Darkbrown_03.webp",
                                "images/Ganesha_01_Small_Darkbrown_04.webp",
                                "images/Ganesha_01_Small_Darkbrown_05.webp",
                                "images/Ganesha_01_Small_Darkbrown_06.webp",
                                "images/Ganesha_01_Small_Darkbrown_07.webp",
                                "images/Ganesha_01_Small_Darkbrown_08.webp",
                                "images/Ganesha_01_Small_Darkbrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/05AU3mcR",
                            whatsapp: "Ganesha Small Temple 2 - Dark Brown Big",
                            images: [
                                "images/Ganesha_01_Big_Darkbrown_01.webp",
                                "images/Ganesha_01_Big_Darkbrown_02.webp",
                                "images/Ganesha_01_Big_Darkbrown_03.webp",
                                "images/Ganesha_01_Big_Darkbrown_04.webp",
                                "images/Ganesha_01_Big_Darkbrown_05.webp",
                                "images/Ganesha_01_Big_Darkbrown_06.webp",
                                "images/Ganesha_01_Big_Darkbrown_07.webp",
                                "images/Ganesha_01_Big_Darkbrown_08.webp",
                                "images/Ganesha_01_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                },
                "hanuman-1": {
                    defaultVariation: "brown-small",
                    variations: {
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/09fx0mfl",
                            whatsapp: "Hanuman Small Temple 2 - Dark Brown Small",
                            images: [
                                "images/Hanuman_01_Small_Darkbrown_01.webp",
                                "images/Hanuman_01_Small_Darkbrown_02.webp",
                                "images/Hanuman_01_Small_Darkbrown_03.webp",
                                "images/Hanuman_01_Small_Darkbrown_04.webp",
                                "images/Hanuman_01_Small_Darkbrown_05.webp",
                                "images/Hanuman_01_Small_Darkbrown_06.webp",
                                "images/Hanuman_01_Small_Darkbrown_07.webp",
                                "images/Hanuman_01_Small_Darkbrown_08.webp",
                                "images/Hanuman_01_Small_Darkbrown_09.webp"
                            ]
                        },
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/08hD7M2s",
                            whatsapp: "Hanuman Small Temple 2 - Brown Small",
                            images: [
                                "images/Hanuman_01_Small_Brown_01.webp",
                                "images/Hanuman_01_Small_Brown_02.webp",
                                "images/Hanuman_01_Small_Brown_03.webp",
                                "images/Hanuman_01_Small_Brown_04.webp",
                                "images/Hanuman_01_Small_Brown_05.webp",
                                "images/Hanuman_01_Small_Brown_06.webp",
                                "images/Hanuman_01_Small_Brown_07.webp",
                                "images/Hanuman_01_Small_Brown_08.webp",
                                "images/Hanuman_01_Small_Brown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/0178n2Pc",
                            whatsapp: "Hanuman Small Temple 2 - Dark Brown Big",
                            images: [
                                "images/Hanuman_01_Big_Darkbrown_01.webp",
                                "images/Hanuman_01_Big_Darkbrown_02.webp",
                                "images/Hanuman_01_Big_Darkbrown_03.webp",
                                "images/Hanuman_01_Big_Darkbrown_04.webp",
                                "images/Hanuman_01_Big_Darkbrown_05.webp",
                                "images/Hanuman_01_Big_Darkbrown_06.webp",
                                "images/Hanuman_01_Big_Darkbrown_07.webp",
                                "images/Hanuman_01_Big_Darkbrown_08.webp",
                                "images/Hanuman_01_Big_Darkbrown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/05X0m7c9",
                            whatsapp: "Hanuman Small Temple 2 - Brown Big",
                            images: [
                                "images/Hanuman_01_Big_Brown_01.webp",
                                "images/Hanuman_01_Big_Brown_02.webp",
                                "images/Hanuman_01_Big_Brown_03.webp",
                                "images/Hanuman_01_Big_Brown_04.webp",
                                "images/Hanuman_01_Big_Brown_05.webp",
                                "images/Hanuman_01_Big_Brown_06.webp",
                                "images/Hanuman_01_Big_Brown_07.webp",
                                "images/Hanuman_01_Big_Brown_08.webp",
                                "images/Hanuman_01_Big_Brown_09.webp"
                            ]
                        }
                    }
                },
                "hanuman-2": {
                    defaultVariation: "brown-small",
                    variations: {
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/04bbMP4C",
                            whatsapp: "Hanuman Small Temple - Dark Brown Small",
                            images: [
                                "images/Hanuman Temple_02_Small_Darkbrown_01.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_02.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_03.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_04.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_05.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_06.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_07.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_08.webp",
                                "images/Hanuman Temple_02_Small_Darkbrown_09.webp"
                            ]
                        },
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0cOuzgW0",
                            whatsapp: "Hanuman Small Temple - Brown Small",
                            images: [
                                "images/Hanuman Temple_02_Small_Brown_01.webp",
                                "images/Hanuman Temple_02_Small_Brown_02.webp",
                                "images/Hanuman Temple_02_Small_Brown_03.webp",
                                "images/Hanuman Temple_02_Small_Brown_04.webp",
                                "images/Hanuman Temple_02_Small_Brown_05.webp",
                                "images/Hanuman Temple_02_Small_Brown_06.webp",
                                "images/Hanuman Temple_02_Small_Brown_07.webp",
                                "images/Hanuman Temple_02_Small_Brown_08.webp",
                                "images/Hanuman Temple_02_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/02ng878g",
                            whatsapp: "Hanuman Small Temple - Brown Big",
                            images: [
                                "images/Hanuman Temple_02_Big_Brown_01.webp",
                                "images/Hanuman Temple_02_Big_Brown_02.webp",
                                "images/Hanuman Temple_02_Big_Brown_03.webp",
                                "images/Hanuman Temple_02_Big_Brown_04.webp",
                                "images/Hanuman Temple_02_Big_Brown_05.webp",
                                "images/Hanuman Temple_02_Big_Brown_06.webp",
                                "images/Hanuman Temple_02_Big_Brown_07.webp",
                                "images/Hanuman Temple_02_Big_Brown_08.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/023TUFUz",
                            whatsapp: "Hanuman Small Temple - Dark Brown Big",
                            images: [
                                "images/Hanuman Temple_02_Big_Darkbrown_01.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_02.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_03.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_04.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_05.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_06.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_07.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_08.webp",
                                "images/Hanuman Temple_02_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                }
                ,"hanuman-3": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0cvdnYH4",
                            whatsapp: "Hanuman Temple 3 - Brown Small",
                            images: [
                                "images/Hanuman Temple_03_Small_Brown_01.webp",
                                "images/Hanuman Temple_03_Small_Brown_02.webp",
                                "images/Hanuman Temple_03_Small_Brown_03.webp",
                                "images/Hanuman Temple_03_Small_Brown_04.webp",
                                "images/Hanuman Temple_03_Small_Brown_05.webp",
                                "images/Hanuman Temple_03_Small_Brown_06.webp",
                                "images/Hanuman Temple_03_Small_Brown_07.webp",
                                "images/Hanuman Temple_03_Small_Brown_08.webp",
                                "images/Hanuman Temple_03_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/07HHkYm5",
                            whatsapp: "Hanuman Temple 3 - Brown Big",
                            images: [
                                "images/Hanuman Temple_03_Big_Brown_01.webp",
                                "images/Hanuman Temple_03_Big_Brown_02.webp",
                                "images/Hanuman Temple_03_Big_Brown_03.webp",
                                "images/Hanuman Temple_03_Big_Brown_04.webp",
                                "images/Hanuman Temple_03_Big_Brown_05.webp",
                                "images/Hanuman Temple_03_Big_Brown_06.webp",
                                "images/Hanuman Temple_03_Big_Brown_07.webp",
                                "images/Hanuman Temple_03_Big_Brown_08.webp",
                                "images/Hanuman Temple_03_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0gbN4YIF",
                            whatsapp: "Hanuman Temple 3 - Dark Brown Small",
                            images: [
                                "images/Hanuman Temple_03_Small_Darkbrown_01.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_02.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_03.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_04.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_05.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_06.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_07.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_08.webp",
                                "images/Hanuman Temple_03_Small_Darkbrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/02tcnVb7",
                            whatsapp: "Hanuman Temple 3 - Dark Brown Big",
                            images: [
                                "images/Hanuman Temple_03_Big_Darkbrown_01.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_02.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_03.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_04.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_05.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_06.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_07.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_08.webp",
                                "images/Hanuman Temple_03_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                },
                "krishna-2": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/02blWPLh",
                            whatsapp: "Krishna Small Temple 2 - Brown Small",
                            images: [
                                "images/Krishna Temple_02_Small_Brown_01.webp",
                                "images/Krishna Temple_02_Small_Brown_02.webp",
                                "images/Krishna Temple_02_Small_Brown_03.webp",
                                "images/Krishna Temple_02_Small_Brown_04.webp",
                                "images/Krishna Temple_02_Small_Brown_05.webp",
                                "images/Krishna Temple_02_Small_Brown_06.webp",
                                "images/Krishna Temple_02_Small_Brown_07.webp",
                                "images/Krishna Temple_02_Small_Brown_08.webp",
                                "images/Krishna Temple_02_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/0hSl5Th1",
                            whatsapp: "Krishna Small Temple 2 - Brown Big",
                            images: [
                                "images/Krishna Temple_02_Big_Brown_01.webp",
                                "images/Krishna Temple_02_Big_Brown_02.webp",
                                "images/Krishna Temple_02_Big_Brown_03.webp",
                                "images/Krishna Temple_02_Big_Brown_04.webp",
                                "images/Krishna Temple_02_Big_Brown_05.webp",
                                "images/Krishna Temple_02_Big_Brown_06.webp",
                                "images/Krishna Temple_02_Big_Brown_07.webp",
                                "images/Krishna Temple_02_Big_Brown_08.webp",
                                "images/Krishna Temple_02_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0h3PBqKK",
                            whatsapp: "Krishna Small Temple 2 - Dark Brown Small",
                            images: [
                                "images/Krishna Temple_02_Small_Darkbrown_01.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_02.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_03.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_04.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_05.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_06.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_07.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_08.webp",
                                "images/Krishna Temple_02_Small_Darkbrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/0g4EiQdm",
                            whatsapp: "Krishna Small Temple 2 - Dark Brown Big",
                            images: [
                                "images/Krishna Temple_02_Big_Darkbrown_01.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_02.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_03.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_04.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_05.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_06.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_07.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_08.webp",
                                "images/Krishna Temple_02_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                },
                "krishna-1": {
                    defaultVariation: "brown-small",
                    variations: {
                        "brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/0ckxBzLQ",
                            whatsapp: "Krishna Small Temple - Brown Small",
                            images: [
                                "images/Krishna_01_Small_Brown_01.webp",
                                "images/Krishna_01_Small_Brown_02.webp",
                                "images/Krishna_01_Small_Brown_03.webp",
                                "images/Krishna_01_Small_Brown_04.webp",
                                "images/Krishna_01_Small_Brown_05.webp",
                                "images/Krishna_01_Small_Brown_06.webp",
                                "images/Krishna_01_Small_Brown_07.webp",
                                "images/Krishna_01_Small_Brown_08.webp",
                                "images/Krishna_01_Small_Brown_09.webp"
                            ]
                        },
                        "brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/0g1zPNTD",
                            whatsapp: "Krishna Small Temple - Brown Big",
                            images: [
                                "images/Krishna_01_Big_Brown_01.webp",
                                "images/Krishna_01_Big_Brown_02.webp",
                                "images/Krishna_01_Big_Brown_03.webp",
                                "images/Krishna_01_Big_Brown_04.webp",
                                "images/Krishna_01_Big_Brown_05.webp",
                                "images/Krishna_01_Big_Brown_06.webp",
                                "images/Krishna_01_Big_Brown_07.webp",
                                "images/Krishna_01_Big_Brown_08.webp",
                                "images/Krishna_01_Big_Brown_09.webp"
                            ]
                        },
                        "dark-brown-small": {
                            price: "₹299",
                            size: "Size : 3.3 × 4.6 inch Approx",
                            amazon: "https://amzn.in/d/01O8N3YG",
                            whatsapp: "Krishna Small Temple - Dark Brown Small",
                            images: [
                                "images/Krishna_01_Small Darkbrown_01.webp",
                                "images/Krishna_01_Small Darkbrown_02.webp",
                                "images/Krishna_01_Small Darkbrown_03.webp",
                                "images/Krishna_01_Small Darkbrown_04.webp",
                                "images/Krishna_01_Small Darkbrown_05.webp",
                                "images/Krishna_01_Small Darkbrown_06.webp",
                                "images/Krishna_01_Small Darkbrown_07.webp",
                                "images/Krishna_01_Small Darkbrown_08.webp",
                                "images/Krishna_01_Small Darkbrown_09.webp"
                            ]
                        },
                        "dark-brown-big": {
                            price: "₹399",
                            size: "Size : 4 × 5.1 inch Approx",
                            amazon: "https://amzn.in/d/03O2qNHf",
                            whatsapp: "Krishna Small Temple - Dark Brown Big",
                            images: [
                                "images/Krishna_01_Big_Darkbrown_01.webp",
                                "images/Krishna_01_Big_Darkbrown_02.webp",
                                "images/Krishna_01_Big_Darkbrown_03.webp",
                                "images/Krishna_01_Big_Darkbrown_04.webp",
                                "images/Krishna_01_Big_Darkbrown_05.webp",
                                "images/Krishna_01_Big_Darkbrown_06.webp",
                                "images/Krishna_01_Big_Darkbrown_07.webp",
                                "images/Krishna_01_Big_Darkbrown_08.webp",
                                "images/Krishna_01_Big_Darkbrown_09.webp"
                            ]
                        }
                    }
                },
        "khatushyam-1": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0gytQnqS",
                    whatsapp: "Khatu Shyam Temple - Brown Small",
                    images: [
                        "images/Khatushyam Temple_01_Small_Brown_01.webp",
                        "images/Khatushyam Temple_01_Small_Brown_02.webp",
                        "images/Khatushyam Temple_01_Small_Brown_03.webp",
                        "images/Khatushyam Temple_01_Small_Brown_04.webp",
                        "images/Khatushyam Temple_01_Small_Brown_05.webp",
                        "images/Khatushyam Temple_01_Small_Brown_06.webp",
                        "images/Khatushyam Temple_01_Small_Brown_07.webp",
                        "images/Khatushyam Temple_01_Small_Brown_08.webp",
                        "images/Khatushyam Temple_01_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0a3QIQ5w",
                    whatsapp: "Khatu Shyam Temple - Brown Big",
                    images: [
                        "images/Khatushyam Temple_01_Big_Brown_01.webp",
                        "images/Khatushyam Temple_01_Big_Brown_02.webp",
                        "images/Khatushyam Temple_01_Big_Brown_03.webp",
                        "images/Khatushyam Temple_01_Big_Brown_04.webp",
                        "images/Khatushyam Temple_01_Big_Brown_05.webp",
                        "images/Khatushyam Temple_01_Big_Brown_06.webp",
                        "images/Khatushyam Temple_01_Big_Brown_07.webp",
                        "images/Khatushyam Temple_01_Big_Brown_08.webp",
                        "images/Khatushyam Temple_01_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0etXsRC7",
                    whatsapp: "Khatu Shyam Temple - Dark Brown Small",
                    images: [
                        "images/Khatushyam Temple_01_Small_Darkbrown_01.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_02.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_03.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_04.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_05.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_06.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_07.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_08.webp",
                        "images/Khatushyam Temple_01_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/038QapIf",
                    whatsapp: "Khatu Shyam Temple - Dark Brown Big",
                    images: [
                        "images/Khatushyam Temple_01_Big_Darkbrown_01.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_02.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_03.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_04.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_05.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_06.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_07.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_08.webp",
                        "images/Khatushyam Temple_01_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "khatushyam-2": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/01UiCsYS",
                    whatsapp: "Khatu Shyam Temple 2 - Brown Small",
                    images: [
                        "images/Khatushyamtemple_02_Small_Brown_01.webp",
                        "images/Khatushyamtemple_02_Small_Brown_02.webp",
                        "images/Khatushyamtemple_02_Small_Brown_03.webp",
                        "images/Khatushyamtemple_02_Small_Brown_04.webp",
                        "images/Khatushyamtemple_02_Small_Brown_05.webp",
                        "images/Khatushyamtemple_02_Small_Brown_06.webp",
                        "images/Khatushyamtemple_02_Small_Brown_07.webp",
                        "images/Khatushyamtemple_02_Small_Brown_08.webp",
                        "images/Khatushyamtemple_02_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0cpQydWP",
                    whatsapp: "Khatu Shyam Temple 2 - Brown Big",
                    images: [
                        "images/Khatushyamtemple_02_Big_Brown_01.webp",
                        "images/Khatushyamtemple_02_Big_Brown_02.webp",
                        "images/Khatushyamtemple_02_Big_Brown_03.webp",
                        "images/Khatushyamtemple_02_Big_Brown_04.webp",
                        "images/Khatushyamtemple_02_Big_Brown_05.webp",
                        "images/Khatushyamtemple_02_Big_Brown_06.webp",
                        "images/Khatushyamtemple_02_Big_Brown_07.webp",
                        "images/Khatushyamtemple_02_Big_Brown_08.webp",
                        "images/Khatushyamtemple_02_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/03RM8NkW",
                    whatsapp: "Khatu Shyam Temple 2 - Dark Brown Small",
                    images: [
                        "images/Khatushyamtemple_02_Small_Darkbrown_01.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_02.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_03.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_04.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_05.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_06.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_07.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_08.webp",
                        "images/Khatushyamtemple_02_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/077VNHGC",
                    whatsapp: "Khatu Shyam Temple 2 - Dark Brown Big",
                    images: [
                        "images/Khatushyamtemple_02_Big_Darkbrown_01.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_02.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_03.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_04.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_05.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_06.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_07.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_08.webp",
                        "images/Khatushyamtemple_02_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "om-1": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Diameter: 7.9 inch × Thickness: 5 mm",
                    amazon: "https://amzn.in/d/07kUNCJ4",
                    whatsapp: "OM Wall Art - Brown Small",
                    images: [
                        "images/OMWallart_Small_Brown_01.webp",
                        "images/OMWallart_Small_Brown_02.webp",
                        "images/OMWallart_Small_Brown_03.webp",
                        "images/OMWallart_Small_Brown_04.webp",
                        "images/OMWallart_Small_Brown_05.webp",
                        "images/OMWallart_Small_Brown_06.webp",
                        "images/OMWallart_Small_Brown_07.webp",
                        "images/OMWallart_Small_Brown_08.webp",
                        "images/OMWallart_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Diameter: 15 inch × Thickness: 5 mm",
                    amazon: "https://amzn.in/d/066Mwcqs",
                    whatsapp: "OM Wall Art - Brown Big",
                    images: [
                        "images/OMWallart_Big_Brown_01.webp",
                        "images/OMWallart_Big_Brown_02.webp",
                        "images/OMWallart_Big_Brown_03.webp",
                        "images/OMWallart_Big_Brown_04.webp",
                        "images/OMWallart_Big_Brown_05.webp",
                        "images/OMWallart_Big_Brown_06.webp",
                        "images/OMWallart_Big_Brown_07.webp",
                        "images/OMWallart_Big_Brown_08.webp",
                        "images/OMWallart_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Diameter: 7.9 inch × Thickness: 5 mm",
                    amazon: "https://amzn.in/d/0iC3x8Eq",
                    whatsapp: "OM Wall Art - Dark Brown Small",
                    images: [
                        "images/OMWallart_Small_Darkbrown_01.webp",
                        "images/OMWallart_Small_Darkbrown_02.webp",
                        "images/OMWallart_Small_Darkbrown_03.webp",
                        "images/OMWallart_Small_Darkbrown_04.webp",
                        "images/OMWallart_Small_Darkbrown_05.webp",
                        "images/OMWallart_Small_Darkbrown_06.webp",
                        "images/OMWallart_Small_Darkbrown_07.webp",
                        "images/OMWallart_Small_Darkbrown_08.webp",
                        "images/OMWallart_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Diameter: 15 inch × Thickness: 5 mm",
                    amazon: "https://amzn.in/d/06tXwLTg",
                    whatsapp: "OM Wall Art - Dark Brown Big",
                    images: [
                        "images/OMWallart_Big_Darkbrown_01.webp",
                        "images/OMWallart_Big_Darkbrown_02.webp",
                        "images/OMWallart_Big_Darkbrown_03.webp",
                        "images/OMWallart_Big_Darkbrown_04.webp",
                        "images/OMWallart_Big_Darkbrown_05.webp",
                        "images/OMWallart_Big_Darkbrown_06.webp",
                        "images/OMWallart_Big_Darkbrown_07.webp",
                        "images/OMWallart_Big_Darkbrown_08.webp",
                        "images/OMWallart_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "waheguru-1": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0fokBjGR",
                    whatsapp: "Waheguru Temple - Brown Small",
                    images: [
                        "images/Waheguru Temple_01_Small_Brown_01.webp",
                        "images/Waheguru Temple_01_Small_Brown_02.webp",
                        "images/Waheguru Temple_01_Small_Brown_03.webp",
                        "images/Waheguru Temple_01_Small_Brown_04.webp",
                        "images/Waheguru Temple_01_Small_Brown_05.webp",
                        "images/Waheguru Temple_01_Small_Brown_06.webp",
                        "images/Waheguru Temple_01_Small_Brown_07.webp",
                        "images/Waheguru Temple_01_Small_Brown_08.webp",
                        "images/Waheguru Temple_01_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/02Csehqj",
                    whatsapp: "Waheguru Temple - Brown Big",
                    images: [
                        "images/Waheguru Temple_01_Big_Brown_01.webp",
                        "images/Waheguru Temple_01_Big_Brown_02.webp",
                        "images/Waheguru Temple_01_Big_Brown_03.webp",
                        "images/Waheguru Temple_01_Big_Brown_04.webp",
                        "images/Waheguru Temple_01_Big_Brown_05.webp",
                        "images/Waheguru Temple_01_Big_Brown_06.webp",
                        "images/Waheguru Temple_01_Big_Brown_07.webp",
                        "images/Waheguru Temple_01_Big_Brown_08.webp",
                        "images/Waheguru Temple_01_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/06eRpND1",
                    whatsapp: "Waheguru Temple - Dark Brown Small",
                    images: [
                        "images/Waheguru Temple_01_Small_Darkbrown_01.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_02.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_03.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_04.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_05.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_06.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_07.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_08.webp",
                        "images/Waheguru Temple_01_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/01gMmzz9",
                    whatsapp: "Waheguru Temple - Dark Brown Big",
                    images: [
                        "images/Waheguru Temple_01_Big_Darkbrown_01.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_02.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_03.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_04.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_05.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_06.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_07.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_08.webp",
                        "images/Waheguru Temple_01_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "ganesha-2": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/05XiBBkn",
                    whatsapp: "Ganesha Temple 2 - Brown Small",
                    images: [
                        "images/Ganesha Temple_02_Small_Brown_01.webp",
                        "images/Ganesha Temple_02_Small_Brown_02.webp",
                        "images/Ganesha Temple_02_Small_Brown_03.webp",
                        "images/Ganesha Temple_02_Small_Brown_04.webp",
                        "images/Ganesha Temple_02_Small_Brown_05.webp",
                        "images/Ganesha Temple_02_Small_Brown_06.webp",
                        "images/Ganesha Temple_02_Small_Brown_07.webp",
                        "images/Ganesha Temple_02_Small_Brown_08.webp",
                        "images/Ganesha Temple_02_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0ekYClw1",
                    whatsapp: "Ganesha Temple 2 - Brown Big",
                    images: [
                        "images/Ganesha Temple_02_Big_Brown_01.webp",
                        "images/Ganesha Temple_02_Big_Brown_02.webp",
                        "images/Ganesha Temple_02_Big_Brown_03.webp",
                        "images/Ganesha Temple_02_Big_Brown_04.webp",
                        "images/Ganesha Temple_02_Big_Brown_05.webp",
                        "images/Ganesha Temple_02_Big_Brown_06.webp",
                        "images/Ganesha Temple_02_Big_Brown_07.webp",
                        "images/Ganesha Temple_02_Big_Brown_08.webp",
                        "images/Ganesha Temple_02_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/02bFdeRS",
                    whatsapp: "Ganesha Temple 2 - Dark Brown Small",
                    images: [
                        "images/Ganesha Temple_02_Small_Darkbrown_01.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_02.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_03.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_04.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_05.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_06.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_07.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_08.webp",
                        "images/Ganesha Temple_02_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0eS7NNPy",
                    whatsapp: "Ganesha Temple 2 - Dark Brown Big",
                    images: [
                        "images/Ganesha Temple_02_Big_Darkbrown_01.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_02.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_03.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_04.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_05.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_06.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_07.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_08.webp",
                        "images/Ganesha Temple_02_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
        "guruji-1": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/07c5gB7M",
                    whatsapp: "Guruji Temple - Brown Small",
                    images: [
                        "images/Guruji Temple_01_Small_Brown_01.webp",
                        "images/Guruji Temple_01_Small_Brown_02.webp",
                        "images/Guruji Temple_01_Small_Brown_03.webp",
                        "images/Guruji Temple_01_Small_Brown_04.webp",
                        "images/Guruji Temple_01_Small_Brown_05.webp",
                        "images/Guruji Temple_01_Small_Brown_06.webp",
                        "images/Guruji Temple_01_Small_Brown_07.webp",
                        "images/Guruji Temple_01_Small_Brown_08.webp",
                        "images/Guruji Temple_01_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/02fNtirt",
                    whatsapp: "Guruji Temple - Brown Big",
                    images: [
                        "images/Guruji Temple_01_Big_Brown_01.webp",
                        "images/Guruji Temple_01_Big_Brown_02.webp",
                        "images/Guruji Temple_01_Big_Brown_03.webp",
                        "images/Guruji Temple_01_Big_Brown_04.webp",
                        "images/Guruji Temple_01_Big_Brown_05.webp",
                        "images/Guruji Temple_01_Big_Brown_06.webp",
                        "images/Guruji Temple_01_Big_Brown_07.webp",
                        "images/Guruji Temple_01_Big_Brown_08.webp",
                        "images/Guruji Temple_01_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/08vsGWlT",
                    whatsapp: "Guruji Temple - Dark Brown Small",
                    images: [
                        "images/Guruji Temple_01_Small_Darkbrown_01.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_02.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_03.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_04.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_05.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_06.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_07.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_08.webp",
                        "images/Guruji Temple_01_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0hd1fKjv",
                    whatsapp: "Guruji Temple - Dark Brown Big",
                    images: [
                        "images/Guruji Temple_01_Big_Darkbrown_01.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_02.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_03.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_04.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_05.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_06.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_07.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_08.webp",
                        "images/Guruji Temple_01_Big_Darkbrown_09.webp"
                    ]
                }
            }
        }
    ,
        "guruji-2": {
            defaultVariation: "brown-small",
            variations: {
                "brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/0io8XSB2",
                    whatsapp: "Guru Ji Temple 2 - Brown Small",
                    images: [
                        "images/Guruji_Temple_02_Small_Brown_01.webp",
                        "images/Guruji_Temple_02_Small_Brown_02.webp",
                        "images/Guruji_Temple_02_Small_Brown_03.webp",
                        "images/Guruji_Temple_02_Small_Brown_04.webp",
                        "images/Guruji_Temple_02_Small_Brown_05.webp",
                        "images/Guruji_Temple_02_Small_Brown_06.webp",
                        "images/Guruji_Temple_02_Small_Brown_07.webp",
                        "images/Guruji_Temple_02_Small_Brown_08.webp",
                        "images/Guruji_Temple_02_Small_Brown_09.webp"
                    ]
                },
                "brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/01RuvYFr",
                    whatsapp: "Guru Ji Temple 2 - Brown Big",
                    images: [
                        "images/Guruji_Temple_02_Big_Brown_01.webp",
                        "images/Guruji_Temple_02_Big_Brown_02.webp",
                        "images/Guruji_Temple_02_Big_Brown_03.webp",
                        "images/Guruji_Temple_02_Big_Brown_04.webp",
                        "images/Guruji_Temple_02_Big_Brown_05.webp",
                        "images/Guruji_Temple_02_Big_Brown_06.webp",
                        "images/Guruji_Temple_02_Big_Brown_07.webp",
                        "images/Guruji_Temple_02_Big_Brown_08.webp",
                        "images/Guruji_Temple_02_Big_Brown_09.webp"
                    ]
                },
                "dark-brown-small": {
                    price: "₹299",
                    size: "Size : 3.3 × 4.6 inch Approx",
                    amazon: "https://amzn.in/d/03Ys5G5S",
                    whatsapp: "Guru Ji Temple 2 - Dark Brown Small",
                    images: [
                        "images/Guruji_Temple_02_Small_Darkbrown_01.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_02.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_03.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_04.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_05.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_06.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_07.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_08.webp",
                        "images/Guruji_Temple_02_Small_Darkbrown_09.webp"
                    ]
                },
                "dark-brown-big": {
                    price: "₹399",
                    size: "Size : 4 × 5.1 inch Approx",
                    amazon: "https://amzn.in/d/0gsINYvT",
                    whatsapp: "Guru Ji Temple 2 - Dark Brown Big",
                    images: [
                        "images/Guruji_Temple_02_Big_Darkbrown_01.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_02.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_03.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_04.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_05.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_06.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_07.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_08.webp",
                        "images/Guruji_Temple_02_Big_Darkbrown_09.webp"
                    ]
                }
            }
        },
            "ganesha-3": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/02tP3Qln",
                        whatsapp: "Ganesha Small Temple 3 - Brown Small",
                        images: [
                            "images/Ganesha Temple_03_Small_Brown_01.webp",
                            "images/Ganesha Temple_03_Small_Brown_02.webp",
                            "images/Ganesha Temple_03_Small_Brown_03.webp",
                            "images/Ganesha Temple_03_Small_Brown_04.webp",
                            "images/Ganesha Temple_03_Small_Brown_05.webp",
                            "images/Ganesha Temple_03_Small_Brown_06.webp",
                            "images/Ganesha Temple_03_Small_Brown_07.webp",
                            "images/Ganesha Temple_03_Small_Brown_08.webp",
                            "images/Ganesha Temple_03_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/07nr04Fj",
                        whatsapp: "Ganesha Small Temple 3 - Brown Big",
                        images: [
                            "images/Ganesha Temple_03_Big_Brown_01.webp",
                            "images/Ganesha Temple_03_Big_Brown_02.webp",
                            "images/Ganesha Temple_03_Big_Brown_03.webp",
                            "images/Ganesha Temple_03_Big_Brown_04.webp",
                            "images/Ganesha Temple_03_Big_Brown_05.webp",
                            "images/Ganesha Temple_03_Big_Brown_06.webp",
                            "images/Ganesha Temple_03_Big_Brown_07.webp",
                            "images/Ganesha Temple_03_Big_Brown_08.webp",
                            "images/Ganesha Temple_03_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/09oEo56H",
                        whatsapp: "Ganesha Small Temple 3 - Dark Brown Small",
                        images: [
                            "images/Ganesha Temple_03_Small_Darkbrown_01.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_02.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_03.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_04.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_05.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_06.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_07.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_08.webp",
                            "images/Ganesha Temple_03_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/05ymgN8z",
                        whatsapp: "Ganesha Small Temple 3 - Dark Brown Big",
                        images: [
                            "images/Ganesha Temple_03_Big_Darkbrown_01.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_02.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_03.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_04.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_05.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_06.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_07.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_08.webp",
                            "images/Ganesha Temple_03_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            },
            "lord-mahaveer-1": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/06I1HHyX",
                        whatsapp: "Lord Mahaveer Small Temple - Brown Small",
                        images: [
                            "images/Lord Mahaveer Temple_Small_Brown_01.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_02.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_03.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_04.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_05.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_06.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_07.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_08.webp",
                            "images/Lord Mahaveer Temple_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/04KMW16w",
                        whatsapp: "Lord Mahaveer Small Temple - Brown Big",
                        images: [
                            "images/Lord Mahaveer Temple_Big_Brown_01.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_02.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_03.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_04.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_05.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_06.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_07.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_08.webp",
                            "images/Lord Mahaveer Temple_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/08bUt3cr",
                        whatsapp: "Lord Mahaveer Small Temple - Dark Brown Small",
                        images: [
                            "images/Lord Mahaveer Temple_Small_Darkbrown_01.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_02.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_03.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_04.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_05.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_06.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_07.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_08.webp",
                            "images/Lord Mahaveer Temple_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/07PITyT2",
                        whatsapp: "Lord Mahaveer Small Temple - Dark Brown Big",
                        images: [
                            "images/Lord Mahaveer Temple_Big_Darkbrown_01.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_02.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_03.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_04.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_05.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_06.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_07.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_08.webp",
                            "images/Lord Mahaveer Temple_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            },
            "sai-baba-1": {
                defaultVariation: "brown-small",
                variations: {
                    "brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/054EMTVf",
                        whatsapp: "Sai Baba Temple - Brown Small",
                        images: [
                            "images/Saibaba Temple_Small_Brown_01.webp",
                            "images/Saibaba Temple_Small_Brown_02.webp",
                            "images/Saibaba Temple_Small_Brown_03.webp",
                            "images/Saibaba Temple_Small_Brown_04.webp",
                            "images/Saibaba Temple_Small_Brown_05.webp",
                            "images/Saibaba Temple_Small_Brown_06.webp",
                            "images/Saibaba Temple_Small_Brown_07.webp",
                            "images/Saibaba Temple_Small_Brown_08.webp",
                            "images/Saibaba Temple_Small_Brown_09.webp"
                        ]
                    },
                    "brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/0gtVEVJy",
                        whatsapp: "Sai Baba Temple - Brown Big",
                        images: [
                            "images/Saibaba Temple_Big_Brown_01.webp",
                            "images/Saibaba Temple_Big_Brown_02.webp",
                            "images/Saibaba Temple_Big_Brown_03.webp",
                            "images/Saibaba Temple_Big_Brown_04.webp",
                            "images/Saibaba Temple_Big_Brown_05.webp",
                            "images/Saibaba Temple_Big_Brown_06.webp",
                            "images/Saibaba Temple_Big_Brown_07.webp",
                            "images/Saibaba Temple_Big_Brown_08.webp",
                            "images/Saibaba Temple_Big_Brown_09.webp"
                        ]
                    },
                    "dark-brown-small": {
                        price: "₹299",
                        size: "Size : 3.3 × 4.6 inch Approx",
                        amazon: "https://amzn.in/d/0d2oGsHI",
                        whatsapp: "Sai Baba Temple - Dark Brown Small",
                        images: [
                            "images/Saibaba Temple_Small_Darkbrown_01.webp",
                            "images/Saibaba Temple_Small_Darkbrown_02.webp",
                            "images/Saibaba Temple_Small_Darkbrown_03.webp",
                            "images/Saibaba Temple_Small_Darkbrown_04.webp",
                            "images/Saibaba Temple_Small_Darkbrown_05.webp",
                            "images/Saibaba Temple_Small_Darkbrown_06.webp",
                            "images/Saibaba Temple_Small_Darkbrown_07.webp",
                            "images/Saibaba Temple_Small_Darkbrown_08.webp",
                            "images/Saibaba Temple_Small_Darkbrown_09.webp"
                        ]
                    },
                    "dark-brown-big": {
                        price: "₹399",
                        size: "Size : 4 × 5.1 inch Approx",
                        amazon: "https://amzn.in/d/04igizVh",
                        whatsapp: "Sai Baba Temple - Dark Brown Big",
                        images: [
                            "images/Saibaba Temple_Big_Darkbrown_01.webp",
                            "images/Saibaba Temple_Big_Darkbrown_02.webp",
                            "images/Saibaba Temple_Big_Darkbrown_03.webp",
                            "images/Saibaba Temple_Big_Darkbrown_04.webp",
                            "images/Saibaba Temple_Big_Darkbrown_05.webp",
                            "images/Saibaba Temple_Big_Darkbrown_06.webp",
                            "images/Saibaba Temple_Big_Darkbrown_07.webp",
                            "images/Saibaba Temple_Big_Darkbrown_08.webp",
                            "images/Saibaba Temple_Big_Darkbrown_09.webp"
                        ]
                    }
                }
            }
    };
            function getVariationWhatsAppName(card, key, variation) {
                const title = card.querySelector("h3");
                const button = card.querySelector('[data-variation="' + key + '"]');
                const productName = title ? title.textContent.trim() : variation.whatsapp;
                const variationName = button ? button.textContent.trim() : key.replace(/-/g, " ");
                return productName + " - " + variationName;
            }

            document.querySelectorAll(".decoreva-variation-card, .featured-variation-card").forEach(function (card) {
                card.classList.add("sherawali-variation-card");
                const options = card.querySelector(".variation-options");
                if (options) options.classList.add("sherawali-variations");
                card.querySelectorAll(".variation-button").forEach(function (button) {
                    button.classList.add("sherawali-variation");
                });
                const actions = card.querySelector(".variation-actions, .featured-variation-actions");
                if (actions) actions.classList.add("sherawali-actions");
                const amazon = card.querySelector(".variation-amazon-button");
                if (amazon) amazon.classList.add("sherawali-amazon-button");
                const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button");
                if (whatsapp) whatsapp.classList.add("sherawali-whatsapp-button");
            });
            document.querySelectorAll(".decoreva-variation-card, .featured-variation-card").forEach(function (card) {
                const product = decorevaVariationProducts[card.dataset.variationProduct];
                if (!product) return;
                const slider = card.querySelector(".image-slider, .featured-image-box");
                const image = card.querySelector(".slider-image, .featured-image-box img");
                const price = card.querySelector(".price, .featured-price");
                const size = card.querySelector(".size, .featured-size");
                const amazon = card.querySelector(".variation-amazon-button, .sherawali-amazon-button");
                const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button, .sherawali-whatsapp-button");
                const buttons = card.querySelectorAll(".variation-button, .sherawali-variation");
                function applyVariation(key) {
                    const variation = product.variations[key];
                    if (!variation || !slider) return;
                    slider.dataset.images = JSON.stringify(variation.images);
                    slider.dataset.index = "0";
                    if (image) {
                        image.src = variation.images[0];
                        image.dataset.src = variation.images[0];
                        image.dataset.loaded = "true";
                        const title = card.querySelector("h3");
                        image.alt = (title ? title.textContent.trim() : "DECOREVA Product") + " - " + key.replace(/-/g, " ");
                    }
                    if (price) price.textContent = variation.price;
                    if (size) size.textContent = variation.size;
                    if (amazon) amazon.href = variation.amazon;
                    if (whatsapp) {
                        whatsapp.href = "https://wa.me/919582899547?text=" +
                            encodeURIComponent("Hello DECOREVA, I want to buy " + getVariationWhatsAppName(card, key, variation));
                    }
                    buttons.forEach(function (button) {
                        button.classList.toggle("active", button.dataset.variation === key);
                    });
                    updateDots(slider, variation.images, 0);
                }
                card._decorevaApplyVariation = applyVariation;
                applyVariation(product.defaultVariation);
            });
            document.addEventListener("click", function (event) {
                const button = event.target.closest(".variation-button, .sherawali-variation");
                if (!button) return;
                const card = button.closest(".decoreva-variation-card, .featured-variation-card");
                if (!card) return;
                const key = button.dataset.variation;
                const applyVariation = card._decorevaApplyVariation;
                if (typeof applyVariation === "function") {
                    event.preventDefault();
                    event.stopPropagation();
                    applyVariation(key);
                    return;
                }
                const product = decorevaVariationProducts[card.dataset.variationProduct];
                const variation = product && product.variations[key];
                if (!variation) return;
                event.preventDefault();
                event.stopPropagation();
                const image = card.querySelector(".slider-image, .featured-image-box img");
                const price = card.querySelector(".price, .featured-price");
                const size = card.querySelector(".size, .featured-size");
                const amazon = card.querySelector(".variation-amazon-button, .sherawali-amazon-button");
                const whatsapp = card.querySelector(".variation-whatsapp-button, .featured-whatsapp-button, .sherawali-whatsapp-button");
                if (image) image.src = variation.images[0];
                if (price) price.textContent = variation.price;
                if (size) size.textContent = variation.size;
                if (amazon) amazon.href = variation.amazon;
                if (whatsapp) {
                    whatsapp.href = "https://wa.me/919582899547?text=" +
                        encodeURIComponent("Hello DECOREVA, I want to buy " + getVariationWhatsAppName(card, key, variation));
                }
                card.querySelectorAll(".variation-button, .sherawali-variation").forEach(function (item) {
                    item.classList.toggle("active", item.dataset.variation === key);
                });
            }, true);


            /* =========================================================
               DECOREVA — CART + WISHLIST
               Client-side • variation-aware • WhatsApp checkout
               ========================================================= */
            (function () {
                "use strict";

                const CART_KEY = "decoreva_cart_v1";
                const WISHLIST_KEY = "decoreva_wishlist_v1";
                const COUPON_KEY = "decoreva_coupon_v1";
                const DELIVERY_CHARGE = 60;
                const COUPONS = {
                    "WELCOME10": 10
                };

                let cart = [];
                let wishlist = [];
                let appliedCoupon = "";
                let couponModalOpen = false;
                let checkoutStep = "cart";
                let couponPreviewCode = "";
                let deliveryAddress = JSON.parse(localStorage.getItem("decorevaDeliveryAddress") || "null");
                const PROFILE_KEY = "decoreva_profile_v1";
                let profile = { name: "", mobile: "", email: "", addresses: [] };
                try {
                    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
                    if (savedProfile && typeof savedProfile === "object") {
                        profile = {
                            name: String(savedProfile.name || ""),
                            mobile: String(savedProfile.mobile || ""),
                            email: String(savedProfile.email || ""),
                            addresses: Array.isArray(savedProfile.addresses) ? savedProfile.addresses : []
                        };
                    }
                } catch (error) {
                    profile = { name: "", mobile: "", email: "", addresses: [] };
                }

                try {
                    cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
                    if (!Array.isArray(cart)) cart = [];
                } catch (error) {
                    cart = [];
                }

                try {
                    wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
                    if (!Array.isArray(wishlist)) wishlist = [];
                } catch (error) {
                    wishlist = [];
                }

                try {
                    appliedCoupon = String(localStorage.getItem(COUPON_KEY) || "").toUpperCase();
                    if (!COUPONS[appliedCoupon]) appliedCoupon = "";
                } catch (error) {
                    appliedCoupon = "";
                }

                function saveCart() {
                    localStorage.setItem(CART_KEY, JSON.stringify(cart));
                }

                function saveWishlist() {
                    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
                }

                function saveCoupon() {
                    if (appliedCoupon) {
                        localStorage.setItem(COUPON_KEY, appliedCoupon);
                    } else {
                        localStorage.removeItem(COUPON_KEY);
                    }
                }

                function money(value) {
                    return "₹" + Number(value || 0).toLocaleString("en-IN");
                }

                function numericPrice(text) {
                    return parseFloat(String(text || "").replace(/[^\d.]/g, "")) || 0;
                }

                function getCardData(card) {
                    if (!card) return null;

                    const titleEl = card.querySelector("h3");
                    const imageEl = card.querySelector(".slider-image, .featured-image-box img");
                    const priceEl = card.querySelector(".price, .featured-price");
                    const sizeEl = card.querySelector(".size, .featured-size");
                    const productId = card.dataset.variationProduct ||
                        ((titleEl ? titleEl.textContent.trim() : "DECOREVA Product") + "|" +
                         (imageEl ? imageEl.currentSrc || imageEl.src : ""));

                    let variationKey = "";
                    let variationName = "";
                    let price = numericPrice(priceEl ? priceEl.textContent : "");
                    let size = sizeEl ? sizeEl.textContent.trim() : "";
                    let image = imageEl ? (imageEl.currentSrc || imageEl.src) : "";

                    const activeVariation = card.querySelector(".variation-button.active, .sherawali-variation.active");
                    if (card.dataset.variationProduct && typeof decorevaVariationProducts !== "undefined") {
                        const product = decorevaVariationProducts[card.dataset.variationProduct];
                        if (product) {
                            variationKey = activeVariation ? activeVariation.dataset.variation : product.defaultVariation;
                            const variation = product.variations[variationKey] || product.variations[product.defaultVariation];
                            if (variation) {
                                variationKey = variationKey || product.defaultVariation;
                                variationName = activeVariation
                                    ? activeVariation.textContent.trim()
                                    : variationKey.replace(/-/g, " ");
                                price = numericPrice(variation.price);
                                size = variation.size || size;
                                image = variation.images && variation.images.length
                                    ? variation.images[0]
                                    : image;
                            }
                        }
                    }

                    return {
                        id: productId + (variationKey ? "|" + variationKey : ""),
                        productId: productId,
                        title: titleEl ? titleEl.textContent.trim() : "DECOREVA Product",
                        variationKey: variationKey,
                        variationName: variationName,
                        price: price,
                        size: size,
                        image: image
                    };
                }

                function totalItems() {
                    return cart.reduce(function (sum, item) {
                        return sum + Number(item.quantity || 0);
                    }, 0);
                }

                function subtotalAmount() {
                    return cart.reduce(function (sum, item) {
                        return sum + Number(item.price || 0) * Number(item.quantity || 0);
                    }, 0);
                }

                function effectiveCouponCode() {
                    return couponPreviewCode || appliedCoupon || "";
                }

                function discountAmount() {
                    const rate = COUPONS[effectiveCouponCode()] || 0;
                    return Math.round(subtotalAmount() * rate / 100);
                }

                function deliveryCharge() {
                    return cart.length ? DELIVERY_CHARGE : 0;
                }

                function finalAmount() {
                    return Math.max(0, subtotalAmount() - discountAmount() + deliveryCharge());
                }

                function updateCartCount() {
                    try {
                        const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
                        if (Array.isArray(saved)) cart = saved;
                    } catch (error) {}
                    const value = String(totalItems());
                    document.querySelectorAll("#decoreva-cart-count, #decoreva-cart-nav-count").forEach(function (count) {
                        count.textContent = value;
                        count.hidden = false;
                    });
                }

                function updateWishlistCount() {
                    try {
                        const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
                        if (Array.isArray(saved)) wishlist = saved;
                    } catch (error) {}
                    const value = String(wishlist.length);
                    document.querySelectorAll("#decoreva-wishlist-count").forEach(function (count) {
                        count.textContent = value;
                        count.hidden = false;
                    });
                }

                function updateWishlistButtons() {
                    document.querySelectorAll(".decoreva-wishlist").forEach(function (button) {
                        const card = button.closest(".card, .featured-slide");
                        const data = getCardData(card);
                        const saved = data && wishlist.some(function (item) {
                            return item.id === data.id;
                        });
                        button.classList.toggle("active", !!saved);
                        button.innerHTML = saved
                            ? '<i class="fas fa-heart" aria-hidden="true"></i>'
                            : '<i class="far fa-heart" aria-hidden="true"></i>';
                        button.setAttribute("aria-label", saved ? "Remove from wishlist" : "Add to wishlist");
                        button.title = saved ? "Remove from Wishlist" : "Add to Wishlist";
                    });
                }

                function renderCart() {
                    const list = document.querySelector("#decoreva-cart-items");
                    const total = document.querySelector("#decoreva-cart-total");
                    const subtotal = document.querySelector("#decoreva-cart-subtotal");
                    const discount = document.querySelector("#decoreva-cart-discount");
                    const discountRow = document.querySelector("#decoreva-cart-discount-row");
                    const delivery = document.querySelector("#decoreva-cart-delivery");
                    const empty = document.querySelector("#decoreva-cart-empty");
                    const label = document.querySelector("#decoreva-cart-item-label");
                    const couponInput = document.querySelector("#decoreva-coupon-input");
                    const couponMessage = document.querySelector("#decoreva-coupon-message");
                    const checkout = document.querySelector("#decoreva-cart-whatsapp");

                    if (!list || !total || !empty) return;

                    list.replaceChildren();
                    empty.hidden = cart.length !== 0;

                    cart.forEach(function (item, index) {
                        const row = document.createElement("div");
                        row.className = "decoreva-cart-item";

                        const img = document.createElement("img");
                        img.src = item.image || "";
                        img.alt = item.title;
                        img.loading = "lazy";

                        const info = document.createElement("div");
                        info.className = "decoreva-cart-item-info";

                        const name = document.createElement("strong");
                        name.textContent = item.title;
                        info.appendChild(name);

                        if (item.variationName) {
                            const variation = document.createElement("span");
                            variation.textContent = item.variationName;
                            info.appendChild(variation);
                        }

                        const price = document.createElement("span");
                        price.textContent = money(item.price) + " × " + item.quantity;
                        info.appendChild(price);

                        const controls = document.createElement("div");
                        controls.className = "decoreva-cart-item-controls";

                        const minus = document.createElement("button");
                        minus.type = "button";
                        minus.textContent = "−";
                        minus.setAttribute("aria-label", "Decrease quantity");
                        minus.dataset.cartAction = "minus";
                        minus.dataset.cartIndex = String(index);

                        const qty = document.createElement("span");
                        qty.textContent = String(item.quantity);

                        const plus = document.createElement("button");
                        plus.type = "button";
                        plus.textContent = "+";
                        plus.setAttribute("aria-label", "Increase quantity");
                        plus.dataset.cartAction = "plus";
                        plus.dataset.cartIndex = String(index);

                        const remove = document.createElement("button");
                        remove.type = "button";
                        remove.textContent = "Remove";
                        remove.dataset.cartAction = "remove";
                        remove.dataset.cartIndex = String(index);

                        const wishlistButton = document.createElement("button");
                        wishlistButton.type = "button";
                        wishlistButton.textContent = "Move to Wishlist";
                        wishlistButton.dataset.cartAction = "wishlist";
                        wishlistButton.dataset.cartIndex = String(index);

                        controls.appendChild(minus);
                        controls.appendChild(qty);
                        controls.appendChild(plus);
                        controls.appendChild(remove);
                        controls.appendChild(wishlistButton);
                        info.appendChild(controls);

                        row.appendChild(img);
                        row.appendChild(info);
                        list.appendChild(row);
                    });

                    const count = totalItems();
                    if (label) {
                        label.textContent = count + (count === 1 ? " item" : " items");
                    }

                    if (subtotal) subtotal.textContent = money(subtotalAmount());

                    const discountValue = discountAmount();
                    if (discount) discount.textContent = "- " + money(discountValue);
                    if (discountRow) discountRow.hidden = !discountValue;
                    if (delivery) delivery.textContent = money(deliveryCharge());
                    if (total) total.textContent = money(finalAmount());

                    if (couponInput) couponInput.value = appliedCoupon;
                    if (couponMessage) {
                        couponMessage.textContent = appliedCoupon ? appliedCoupon + " applied — 10% off" : "";
                        couponMessage.className = appliedCoupon
                            ? "decoreva-coupon-message success"
                            : "decoreva-coupon-message";
                    }

                    const couponAppliedLabel = document.querySelector("#decoreva-coupon-applied-label");
                    if (couponAppliedLabel) {
                        couponAppliedLabel.textContent = appliedCoupon ? appliedCoupon + " applied" : (couponPreviewCode ? couponPreviewCode + " checked — 10% OFF" : "");
                        couponAppliedLabel.hidden = !(appliedCoupon || couponPreviewCode);
                    }
                    const couponTrigger = document.querySelector("#decoreva-open-coupon");
                    if (couponTrigger) couponTrigger.textContent = "Apply Coupon";

                    if (checkout) {
                        checkout.disabled = cart.length === 0;
                        checkout.textContent = "Place Order on WhatsApp";
                        checkout.setAttribute("aria-label", "Place Order on WhatsApp");
                    }

                    if (document.querySelector("#decoreva-similar-products")) renderSimilarProducts();
                    if (checkoutStep !== "cart") {
                        renderCheckoutSummary();
                        updateAddressContinueState();
                    }

                    updateCartCount();
                }

                function renderWishlist() {
                    const list = document.querySelector("#decoreva-wishlist-items");
                    const empty = document.querySelector("#decoreva-wishlist-empty");
                    const label = document.querySelector("#decoreva-wishlist-label");

                    if (!list || !empty) return;

                    list.replaceChildren();
                    empty.hidden = wishlist.length !== 0;

                    wishlist.forEach(function (item, index) {
                        const row = document.createElement("div");
                        row.className = "decoreva-wishlist-item";

                        const img = document.createElement("img");
                        img.src = item.image || "";
                        img.alt = item.title;
                        img.loading = "lazy";

                        const info = document.createElement("div");
                        info.className = "decoreva-wishlist-info";

                        const name = document.createElement("strong");
                        name.textContent = item.title;
                        info.appendChild(name);

                        if (item.variationName) {
                            const variation = document.createElement("span");
                            variation.textContent = item.variationName;
                            info.appendChild(variation);
                        }

                        const price = document.createElement("b");
                        price.textContent = money(item.price);
                        info.appendChild(price);

                        const remove = document.createElement("button");
                        remove.type = "button";
                        remove.textContent = "Remove";
                        remove.dataset.wishlistAction = "remove";
                        remove.dataset.wishlistIndex = String(index);
                        info.appendChild(remove);

                        row.appendChild(img);
                        row.appendChild(info);
                        list.appendChild(row);
                    });

                    if (label) {
                        label.textContent = wishlist.length + (wishlist.length === 1 ? " item" : " items");
                    }
                    updateWishlistCount();
                    updateWishlistButtons();
                }

                function openCart() {
                    openCartDrawer();
                }

                function closeCart() {
                    const drawer = document.querySelector("#decoreva-cart-drawer");
                    if (!drawer) return;
                    checkoutStep = "cart";
                    drawer.classList.remove("decoreva-checkout-mode");
                    drawer.classList.remove("open");
                    document.body.classList.remove("decoreva-cart-open", "decoreva-checkout-open");
                    document.body.style.overflow = "";
                    document.documentElement.style.overflow = "";
                    drawer.setAttribute("aria-hidden", "true");
                }

                function openCartDrawer() {
                    const drawer = document.querySelector("#decoreva-cart-drawer");
                    if (!drawer) return;
                    checkoutStep = "cart";
                    drawer.classList.add("decoreva-checkout-mode");
                    renderCart();
                    updateCheckoutStepUI();
                    const steps = drawer.querySelector(".decoreva-checkout-steps");
                    if (steps) { steps.hidden = false; steps.style.display = "flex"; }
                    drawer.classList.add("open");
                    document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
                    document.body.style.overflow = "hidden";
                    document.documentElement.style.overflow = "hidden";
                    drawer.setAttribute("aria-hidden", "false");
                }

                function openWishlist() {
                    const drawer = document.querySelector("#decoreva-wishlist-drawer");
                    if (!drawer) return;
                    renderWishlist();
                    drawer.classList.add("open");
                    drawer.setAttribute("aria-hidden", "false");
                    document.body.classList.add("decoreva-wishlist-open");
                    document.body.style.overflow = "hidden";
                }

                function closeWishlist() {
                    const drawer = document.querySelector("#decoreva-wishlist-drawer");
                    if (!drawer) return;
                    drawer.classList.remove("open");
                    drawer.setAttribute("aria-hidden", "true");
                    document.body.classList.remove("decoreva-wishlist-open");
                    if (!document.body.classList.contains("decoreva-cart-open")) document.body.style.overflow = "";
                }

                function saveProfile() {
                    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
                }

                const decorevaAddressSupabase = window.decorevaSupabase || null;
                let decorevaOrderInProgress = false;

                function generateDecorevaOrderNumber() {
                    const now = new Date();
                    const datePart = now.getFullYear().toString() +
                        String(now.getMonth() + 1).padStart(2, "0") +
                        String(now.getDate()).padStart(2, "0");

                    let randomPart = "";
                    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
                        const bytes = new Uint8Array(4);
                        window.crypto.getRandomValues(bytes);
                        randomPart = Array.from(bytes, function (byte) {
                            return byte.toString(16).padStart(2, "0");
                        }).join("").toUpperCase();
                    } else {
                        randomPart = Math.random().toString(16).slice(2, 10).toUpperCase();
                    }

                    return "DEC-" + datePart + "-" + randomPart;
                }

                function buildDeliveryAddressText(address) {
                    if (!address) return "";
                    return [
                        address.name || "",
                        "Mobile: " + (address.mobile || ""),
                        address.line || "",
                        (address.city || "") + ", " + (address.state || "") + " - " + (address.pincode || "")
                    ].filter(Boolean).join("\n");
                }

                async function createSupabaseOrder() {
                    if (!cart.length || !deliveryAddress) {
                        throw new Error("Cart or delivery address is missing.");
                    }

                    if (!decorevaAddressSupabase) {
                        throw new Error("Supabase is not available on this page.");
                    }

                    const user = await getDecorevaAuthUser();
                    if (!user) {
                        const loginMessage = document.querySelector("#decoreva-address-message");
                        if (loginMessage) {
                            loginMessage.dataset.userMessage = "1";
                            loginMessage.textContent = "Please login or signup before placing your order.";
                            loginMessage.className = "decoreva-address-message error";
                        }
                        return null;
                    }

                    const orderNumber = generateDecorevaOrderNumber();
                    const subtotal = subtotalAmount();
                    const discount = discountAmount();
                    const delivery = deliveryCharge();
                    const total = finalAmount();
                    const coupon = effectiveCouponCode() || null;

                    const orderPayload = {
                        user_id: user.id,
                        order_number: orderNumber,
                        status: "pending",
                        customer_name: deliveryAddress.name,
                        customer_phone: deliveryAddress.mobile,
                        delivery_address: buildDeliveryAddressText(deliveryAddress),
                        subtotal: subtotal,
                        delivery_charge: delivery,
                        discount: discount,
                        total: total,
                        coupon: coupon
                    };

                    const orderResult = await decorevaAddressSupabase
                        .from("orders")
                        .insert(orderPayload)
                        .select("id, order_number")
                        .single();

                    if (orderResult.error) {
                        console.error("DECOREVA order create error:", orderResult.error);
                        throw orderResult.error;
                    }

                    const orderId = orderResult.data && orderResult.data.id;
                    if (!orderId) {
                        throw new Error("Supabase did not return the created order ID.");
                    }

                    const itemPayload = cart.map(function (item) {
                        return {
                            order_id: orderId,
                            product_key: String(item.productId || item.id || ""),
                            product_name: String(item.title || "DECOREVA Product"),
                            variation: String(item.variationName || item.variationKey || ""),
                            quantity: Math.max(1, Number(item.quantity || 1)),
                            unit_price: Math.max(0, Number(item.price || 0))
                        };
                    });

                    const itemsResult = await decorevaAddressSupabase
                        .from("order_items")
                        .insert(itemPayload);

                    if (itemsResult.error) {
                        console.error("DECOREVA order items create error:", itemsResult.error);

                        try {
                            await decorevaAddressSupabase
                                .from("orders")
                                .delete()
                                .eq("id", orderId)
                                .eq("user_id", user.id);
                        } catch (cleanupError) {
                            console.warn("DECOREVA order cleanup error:", cleanupError);
                        }

                        throw itemsResult.error;
                    }

                    return {
                        id: orderId,
                        orderNumber: orderResult.data.order_number || orderNumber,
                        userId: user.id
                    };
                }

                async function getDecorevaAuthUser() {
                    if (!decorevaAddressSupabase || !decorevaAddressSupabase.auth) return null;
                    try {
                        const result = await decorevaAddressSupabase.auth.getUser();
                        return result.data && result.data.user ? result.data.user : null;
                    } catch (error) {
                        console.warn("DECOREVA address auth check:", error);
                        return null;
                    }
                }

                function mapSupabaseAddress(row) {
                    return {
                        id: row.id,
                        label: String(row.label || "HOME"),
                        name: String(row.recipient_name || ""),
                        mobile: String(row.phone || ""),
                        line: String(row.address_line || ""),
                        city: String(row.city || ""),
                        state: String(row.state || ""),
                        pincode: String(row.pincode || ""),
                        default: !!row.is_default
                    };
                }

                async function loadSupabaseAddresses() {
                    const user = await getDecorevaAuthUser();
                    if (!user || !decorevaAddressSupabase) return false;

                    const result = await decorevaAddressSupabase
                        .from("saved_addresses")
                        .select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
                        .eq("user_id", user.id)
                        .order("is_default", { ascending: false })
                        .order("created_at", { ascending: true });

                    if (result.error) {
                        console.error("DECOREVA saved addresses load error:", result.error);
                        return false;
                    }

                    profile.addresses = Array.isArray(result.data)
                        ? result.data.map(mapSupabaseAddress)
                        : [];

                    saveProfile();
                    return true;
                }

                async function saveSupabaseAddress(address, editIndex) {
                    const user = await getDecorevaAuthUser();
                    if (!user || !decorevaAddressSupabase) return false;

                    const payload = {
                        user_id: user.id,
                        label: address.label,
                        recipient_name: address.name,
                        phone: address.mobile,
                        address_line: address.line,
                        city: address.city,
                        state: address.state,
                        pincode: address.pincode,
                        is_default: !!address.default
                    };

                    if (address.default) {
                        const clearDefaults = await decorevaAddressSupabase
                            .from("saved_addresses")
                            .update({ is_default: false })
                            .eq("user_id", user.id);

                        if (clearDefaults.error) throw clearDefaults.error;
                    }

                    const existing = Number.isInteger(editIndex) && profile.addresses[editIndex]
                        ? profile.addresses[editIndex]
                        : null;

                    let result;

                    if (existing && existing.id) {
                        result = await decorevaAddressSupabase
                            .from("saved_addresses")
                            .update(payload)
                            .eq("id", existing.id)
                            .eq("user_id", user.id)
                            .select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
                            .single();
                    } else {
                        result = await decorevaAddressSupabase
                            .from("saved_addresses")
                            .insert(payload)
                            .select("id, user_id, label, recipient_name, phone, address_line, city, state, pincode, is_default, created_at, updated_at")
                            .single();
                    }

                    if (result.error) throw result.error;

                    await loadSupabaseAddresses();
                    return true;
                }

                async function deleteSupabaseAddress(address) {
                    const user = await getDecorevaAuthUser();
                    if (!user || !decorevaAddressSupabase || !address || !address.id) return false;

                    const result = await decorevaAddressSupabase
                        .from("saved_addresses")
                        .delete()
                        .eq("id", address.id)
                        .eq("user_id", user.id);

                    if (result.error) throw result.error;

                    await loadSupabaseAddresses();

                    if (profile.addresses.length && !profile.addresses.some(function (item) { return item.default; })) {
                        await setSupabaseDefaultAddress(profile.addresses[0]);
                    }

                    return true;
                }

                async function setSupabaseDefaultAddress(address) {
                    const user = await getDecorevaAuthUser();
                    if (!user || !decorevaAddressSupabase || !address || !address.id) return false;

                    let result = await decorevaAddressSupabase
                        .from("saved_addresses")
                        .update({ is_default: false })
                        .eq("user_id", user.id);

                    if (result.error) throw result.error;

                    result = await decorevaAddressSupabase
                        .from("saved_addresses")
                        .update({ is_default: true })
                        .eq("id", address.id)
                        .eq("user_id", user.id);

                    if (result.error) throw result.error;

                    await loadSupabaseAddresses();
                    return true;
                }

                function escapeProfileText(value) {
                    return String(value || "").replace(/[&<>\"]/g, function (char) {
                        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
                    });
                }

                function renderProfile() {
                    const panel = document.querySelector("#decoreva-profile-panel");
                    if (!panel) return;
                    const name = document.querySelector("#decoreva-profile-name");
                    const mobile = document.querySelector("#decoreva-profile-mobile");
                    const email = document.querySelector("#decoreva-profile-email");
                    const status = document.querySelector("#decoreva-profile-message");
                    const addressList = document.querySelector("#decoreva-profile-addresses");
                    const summary = document.querySelector("#decoreva-profile-summary");
                    if (name && !name.value) name.value = profile.name;
                    if (mobile && !mobile.value) mobile.value = profile.mobile;
                    if (email && !email.value) email.value = profile.email;
                    if (summary) {
                        summary.innerHTML = profile.name
                            ? '<strong>' + escapeProfileText(profile.name) + '</strong><span>' + escapeProfileText(profile.mobile || "") + (profile.email ? ' • ' + escapeProfileText(profile.email) : '') + '</span>'
                            : '<strong>Guest Customer</strong><span>Create your profile and save your delivery details on this device.</span>';
                    }
                    if (addressList) {
                        addressList.replaceChildren();
                        if (!profile.addresses.length) {
                            const empty = document.createElement("div");
                            empty.className = "decoreva-profile-address-empty";
                            empty.textContent = "No saved addresses yet.";
                            addressList.appendChild(empty);
                        } else {
                            profile.addresses.forEach(function (address, index) {
                                const card = document.createElement("div");
                                card.className = "decoreva-profile-address-card" + (address.default ? " default" : "");
                                card.innerHTML = '<div class="decoreva-profile-address-top"><strong>' + escapeProfileText(address.label || "HOME") + '</strong>' + (address.default ? '<span>DEFAULT</span>' : '') + '</div>' +
                                    '<div class="decoreva-profile-address-name">' + escapeProfileText(address.name || profile.name) + '</div>' +
                                    '<div class="decoreva-profile-address-text">' + escapeProfileText(address.line) + '<br>' + escapeProfileText(address.city) + ', ' + escapeProfileText(address.state) + ' - ' + escapeProfileText(address.pincode) + '<br>Mobile: ' + escapeProfileText(address.mobile || profile.mobile) + '</div>' +
                                    '<div class="decoreva-profile-address-actions">' +
                                    (!address.default ? '<button type="button" data-profile-address-action="default" data-profile-address-index="' + index + '">Set Default</button>' : '') +
                                    '<button type="button" data-profile-address-action="edit" data-profile-address-index="' + index + '">Edit</button>' +
                                    '<button type="button" data-profile-address-action="delete" data-profile-address-index="' + index + '">Delete</button>' +
                                    '</div>';
                                addressList.appendChild(card);
                            });
                        }
                    }
                    if (status && !status.dataset.persistent) status.textContent = "";
                }

                function showProfileAddressForm(index) {
                    const form = document.querySelector("#decoreva-profile-address-form");
                    if (!form) return;
                    form.hidden = false;
                    form.dataset.editIndex = Number.isInteger(index) ? String(index) : "";
                    const address = Number.isInteger(index) && profile.addresses[index] ? profile.addresses[index] : {};
                    const set = function (id, value) { const el = document.querySelector(id); if (el) el.value = value || ""; };
                    set("#decoreva-profile-address-label", address.label || "HOME");
                    set("#decoreva-profile-address-name", address.name || profile.name);
                    set("#decoreva-profile-address-mobile", address.mobile || profile.mobile);
                    set("#decoreva-profile-address-line", address.line);
                    set("#decoreva-profile-address-city", address.city);
                    set("#decoreva-profile-address-state", address.state);
                    set("#decoreva-profile-address-pincode", address.pincode);
                    const msg = document.querySelector("#decoreva-profile-address-message");
                    if (msg) msg.textContent = "";
                    const title = document.querySelector("#decoreva-profile-address-form-title");
                    if (title) title.textContent = Number.isInteger(index) ? "Edit Address" : "Add New Address";
                    const save = document.querySelector("#decoreva-profile-address-save");
                    if (save) save.textContent = Number.isInteger(index) ? "Update Address" : "Save Address";
                }

                function hideProfileAddressForm() {
                    const form = document.querySelector("#decoreva-profile-address-form");
                    if (form) { form.hidden = true; form.dataset.editIndex = ""; }
                }

                async function openProfile() {
                    const panel = document.querySelector("#decoreva-profile-panel");
                    if (!panel) return;

                    renderProfile();
                    panel.classList.add("open");
                    panel.setAttribute("aria-hidden", "false");

                    const user = await getDecorevaAuthUser();
                    if (user && decorevaAddressSupabase) {
                        await loadSupabaseAddresses();
                        renderProfile();
                    }
                }


                function closeProfile(callback) {
                    const panel = document.querySelector("#decoreva-profile-panel");
                    if (!panel) {
                        if (typeof callback === "function") callback();
                        return;
                    }

                    const card = panel.querySelector(".decoreva-profile-card");

                    if (panel._decorevaProfileCloseTimer) {
                        clearTimeout(panel._decorevaProfileCloseTimer);
                        panel._decorevaProfileCloseTimer = null;
                    }

                    if (!panel.classList.contains("open")) {
                        if (typeof callback === "function") callback();
                        return;
                    }

                    if (card) {
                        card.style.transition = "transform .18s ease";
                        void card.offsetWidth;
                        card.style.transform = "translateY(-8px) scale(.985)";
                    }

                    panel._decorevaProfileCloseTimer = window.setTimeout(function () {
                        panel.classList.remove("open");
                        panel.setAttribute("aria-hidden", "true");

                        if (card) {
                            card.style.transition = "";
                            card.style.transform = "";
                        }

                        panel._decorevaProfileCloseTimer = null;

                        if (typeof callback === "function") {
                            callback();
                        }
                    }, 180);
                }

                window.decorevaCloseProfile = closeProfile;

                function addToCart(card) {
                    const data = getCardData(card);
                    if (!data || !data.price) return;

                    const existing = cart.find(function (item) {
                        return item.id === data.id;
                    });

                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        data.quantity = 1;
                        cart.push(data);
                    }

                    saveCart();
                    updateCartCount();
                    renderCart();

                    /* Adding a product must not open checkout automatically.
                       Customer can open the cart from the navigation cart icon. */
                    const addButton = document.querySelector(".decoreva-add-cart");
                    if (addButton) {
                        const notice = document.createElement("div");
                        notice.className = "decoreva-cart-added-notice";
                        notice.textContent = "Added to cart";
                        document.body.appendChild(notice);
                        setTimeout(function () {
                            notice.classList.add("show");
                        }, 10);
                        setTimeout(function () {
                            notice.classList.remove("show");
                            setTimeout(function () { notice.remove(); }, 220);
                        }, 1500);
                    }
                }

                function toggleWishlist(card) {
                    const data = getCardData(card);
                    if (!data) return;

                    const index = wishlist.findIndex(function (item) {
                        return item.id === data.id;
                    });

                    if (index >= 0) {
                        wishlist.splice(index, 1);
                    } else {
                        wishlist.push(data);
                    }

                    saveWishlist();
                    updateWishlistCount();
                    renderWishlist();
                }

                function applyCoupon() {
                    const input = document.querySelector("#decoreva-coupon-input");
                    const message = document.querySelector("#decoreva-coupon-message");
                    if (!input || !message) return;

                    const code = input.value.trim().toUpperCase();

                    if (!code) {
                        appliedCoupon = "";
                        saveCoupon();
                        message.textContent = "";
                        message.className = "decoreva-coupon-message";
                        renderCart();
                        return;
                    }

                    if (!COUPONS[code]) {
                        appliedCoupon = "";
                        saveCoupon();
                        message.textContent = "Invalid coupon code.";
                        message.className = "decoreva-coupon-message error";
                        renderCart();
                        return;
                    }

                    appliedCoupon = code;
                    couponPreviewCode = "";
                    saveCoupon();
                    message.textContent = code + " applied — 10% off";
                    message.className = "decoreva-coupon-message success";
                    renderCart();
                    renderCheckoutSummary();
                    closeCouponModal();
                }

                function openCouponModal() {
                    const modal = document.querySelector("#decoreva-coupon-modal");
                    if (!modal) return;
                    const input = document.querySelector("#decoreva-coupon-input");
                    const message = document.querySelector("#decoreva-coupon-message");
                    if (input) input.value = appliedCoupon || couponPreviewCode || "";
                    if (message && !appliedCoupon && !couponPreviewCode) {
                        message.textContent = "";
                        message.className = "decoreva-coupon-message";
                    }
                    modal.classList.add("open");
                    modal.setAttribute("aria-hidden", "false");
                    couponModalOpen = true;
                    window.setTimeout(function () { if (input) input.focus(); }, 50);
                }

                function closeCouponModal() {
                    const modal = document.querySelector("#decoreva-coupon-modal");
                    if (!modal) return;
                    modal.classList.remove("open");
                    modal.setAttribute("aria-hidden", "true");
                    couponModalOpen = false;
                    if (couponPreviewCode && couponPreviewCode !== appliedCoupon) {
                        couponPreviewCode = "";
                        renderCart();
                        renderCheckoutSummary();
                    }
                }

                function beginWhatsAppCheckout() {
                    if (!cart.length) return;

                    /* Checkout intentionally starts with a blank address.
                       Saved profile addresses are kept only in Profile and are
                       not auto-applied here. */
                    deliveryAddress = null;
                    checkoutStep = "address";

                    const drawer = document.querySelector("#decoreva-cart-drawer");
                    if (drawer) {
                        drawer.classList.add("decoreva-checkout-mode");
                        drawer.classList.add("open");
                        drawer.setAttribute("aria-hidden", "false");
                    }

                    document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
                    document.body.style.overflow = "hidden";
                    document.documentElement.style.overflow = "hidden";

                    updateCheckoutStepUI();

                    [
                        "#decoreva-address-name",
                        "#decoreva-address-mobile",
                        "#decoreva-address-line",
                        "#decoreva-address-city",
                        "#decoreva-address-state",
                        "#decoreva-address-pincode"
                    ].forEach(function (id) {
                        const el = document.querySelector(id);
                        if (el) el.value = "";
                    });

                    updateAddressContinueState();

                    window.setTimeout(function () {
                        const address = document.querySelector("#decoreva-checkout-address");
                        const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
                        if (address && panel) {
                            panel.scrollTo({
                                top: Math.max(0, address.offsetTop - 18),
                                behavior: "smooth"
                            });
                        }
                    }, 40);
                }

                async function whatsappCheckout() {
                    if (!cart.length || !deliveryAddress || decorevaOrderInProgress) return;

                    decorevaOrderInProgress = true;

                    const button = document.querySelector("#decoreva-cart-whatsapp");
                    const paymentButton = document.querySelector("#decoreva-payment-order");
                    const message = document.querySelector("#decoreva-address-message");
                    const originalButtonText = button ? button.textContent : "Order on WhatsApp";
                    const originalPaymentText = paymentButton ? paymentButton.textContent : "Place Order on WhatsApp";

                    if (button) {
                        button.disabled = true;
                        button.textContent = "Saving Order...";
                    }
                    if (paymentButton) {
                        paymentButton.disabled = true;
                        paymentButton.textContent = "Saving Order...";
                    }

                    try {
                        const order = await createSupabaseOrder();

                        if (!order) {
                            if (button) {
                                button.disabled = false;
                                button.textContent = originalButtonText;
                            }
                            if (paymentButton) {
                                paymentButton.disabled = false;
                                paymentButton.textContent = originalPaymentText;
                            }
                            return;
                        }

                        const lines = [
                            "Hello DECOREVA, I want to order:",
                            "",
                            "Order Number: " + order.orderNumber,
                            ""
                        ];

                        cart.forEach(function (item, index) {
                            let line = (index + 1) + ". " + item.title;
                            if (item.variationName) line += " - " + item.variationName;
                            line += " × " + item.quantity + " = " + money(item.price * item.quantity);
                            lines.push(line);
                        });

                        lines.push("", "Total MRP: " + money(subtotalAmount()));

                        if (appliedCoupon) {
                            lines.push("Coupon: " + appliedCoupon + " (10% OFF)");
                            lines.push("Discount on MRP: - " + money(discountAmount()));
                        }

                        lines.push("Delivery: " + money(deliveryCharge()), "Total Amount: " + money(finalAmount()));
                        if (deliveryAddress) {
                            lines.push(
                                "",
                                "Delivery Address:",
                                deliveryAddress.name,
                                "Mobile: " + deliveryAddress.mobile,
                                deliveryAddress.line,
                                deliveryAddress.city + ", " + deliveryAddress.state + " - " + deliveryAddress.pincode
                            );
                        }
                        lines.push("", "Please confirm availability and payment details.");

                        const whatsappUrl =
                            "https://wa.me/919582899547?text=" +
                            encodeURIComponent(lines.join("\n"));

                        window.open(
                            whatsappUrl,
                            "_blank",
                            "noopener,noreferrer"
                        );

                        showOrderConfirmation(order.orderNumber);

                        if (message) {
                            message.dataset.userMessage = "1";
                            message.textContent = "Order " + order.orderNumber + " saved. WhatsApp opened for confirmation.";
                            message.className = "decoreva-address-message success";
                        }
                    } catch (error) {
                        console.error("DECOREVA order submission error:", error);

                        if (message) {
                            message.dataset.userMessage = "1";
                            message.textContent = "Could not save your order. Please try again. Your WhatsApp order was not opened.";
                            message.className = "decoreva-address-message error";
                        }

                        alert("We could not save your order. Please try again.");
                    } finally {
                        decorevaOrderInProgress = false;

                        if (button) {
                            button.disabled = !cart.length;
                            button.textContent = originalButtonText;
                        }
                        if (paymentButton) {
                            paymentButton.disabled = false;
                            paymentButton.textContent = originalPaymentText;
                        }
                    }
                }

                function showOrderConfirmation(orderNumber) {
                    let confirmation = document.querySelector("#decoreva-order-confirmation");
                    if (!confirmation) {
                        confirmation = document.createElement("div");
                        confirmation.id = "decoreva-order-confirmation";
                        confirmation.className = "decoreva-order-confirmation";
                        confirmation.innerHTML = `
                            <div class="decoreva-order-confirmation-overlay"></div>
                            <div class="decoreva-order-confirmation-card" role="dialog" aria-modal="true" aria-label="Order confirmation">
                                <div class="decoreva-order-confirmation-icon">✓</div>
                                <strong>Order Request Saved</strong>
                                <p class="decoreva-order-confirmation-text"></p>
                                <button type="button" id="decoreva-order-confirmation-close">Continue Shopping</button>
                            </div>`;
                        document.body.appendChild(confirmation);
                    }

                    const confirmationText = confirmation.querySelector(".decoreva-order-confirmation-text");
                    if (confirmationText) {
                        confirmationText.textContent =
                            "Order " + (orderNumber || "") + " has been saved. Your order details are open in WhatsApp. Please send the message to DECOREVA to confirm your order.";
                    }

                    confirmation.classList.add("open");
                }

                function renderCheckoutSavedAddresses() {
                    /* Saved addresses are managed from My Profile only.
                       Checkout intentionally does not display or auto-select them. */
                    return;
                }

                function fillCheckoutAddress(address) {
                    if (!address) return;
                    const values = {
                        "#decoreva-address-name": address.name || profile.name,
                        "#decoreva-address-mobile": address.mobile || profile.mobile,
                        "#decoreva-address-line": address.line || "",
                        "#decoreva-address-city": address.city || "",
                        "#decoreva-address-state": address.state || "",
                        "#decoreva-address-pincode": address.pincode || ""
                    };
                    Object.keys(values).forEach(function (id) { const el = document.querySelector(id); if (el) el.value = values[id]; });
                }

                function updateAddressContinueState() {
                    const button = document.querySelector("#decoreva-save-address");
                    if (!button) return;
                    const get = function (id) { const el = document.querySelector(id); return el ? el.value.trim() : ""; };
                    const valid = /^\d{10}$/.test(get("#decoreva-address-mobile")) &&
                        /^\d{6}$/.test(get("#decoreva-address-pincode")) &&
                        !!get("#decoreva-address-name") && !!get("#decoreva-address-line") &&
                        !!get("#decoreva-address-city") && !!get("#decoreva-address-state");
                    button.disabled = !valid;
                    button.setAttribute("aria-disabled", valid ? "false" : "true");
                    const message = document.querySelector("#decoreva-address-message");
                    if (!valid && !deliveryAddress) {
                        if (message && !message.dataset.userMessage) {
                            message.textContent = "Please fill all delivery address details before continuing.";
                            message.className = "decoreva-address-message warning";
                        }
                    } else if (valid && message && message.classList.contains("warning")) {
                        message.textContent = "Address complete. Continue to review your order.";
                        message.className = "decoreva-address-message success";
                    }
                }

                function renderCheckoutItems() {
                    const box = document.querySelector("#decoreva-checkout-items");
                    if (!box) return;
                    box.replaceChildren();
                    if (!cart.length) return;

                    const head = document.createElement("div");
                    head.className = "decoreva-checkout-items-head";
                    head.innerHTML = "<strong>Items in your order</strong><span>" + totalItems() + (totalItems() === 1 ? " item" : " items") + "</span>";
                    box.appendChild(head);

                    cart.forEach(function(item, index){
                        const row = document.createElement("div");
                        row.className = "decoreva-checkout-item";

                        const img = document.createElement("img");
                        img.src = item.image || "";
                        img.alt = item.title;
                        img.loading = "lazy";

                        const info = document.createElement("div");
                        info.className = "decoreva-checkout-item-info";

                        const title = document.createElement("strong");
                        title.textContent = item.title;
                        info.appendChild(title);

                        const variation = document.createElement("span");
                        variation.textContent = (item.variationName ? item.variationName + " • " : "") + "Qty: " + item.quantity;
                        info.appendChild(variation);

                        const price = document.createElement("b");
                        price.textContent = money(item.price * item.quantity);
                        info.appendChild(price);

                        const actions = document.createElement("div");
                        actions.className = "decoreva-checkout-item-actions";

                        const remove = document.createElement("button");
                        remove.type = "button";
                        remove.textContent = "Remove";
                        remove.dataset.checkoutItemAction = "remove";
                        remove.dataset.checkoutItemIndex = String(index);

                        const wishlistButton = document.createElement("button");
                        wishlistButton.type = "button";
                        wishlistButton.textContent = "Move to Wishlist";
                        wishlistButton.dataset.checkoutItemAction = "wishlist";
                        wishlistButton.dataset.checkoutItemIndex = String(index);

                        actions.appendChild(remove);
                        actions.appendChild(wishlistButton);
                        info.appendChild(actions);

                        row.appendChild(img);
                        row.appendChild(info);
                        box.appendChild(row);
                    });

                    const delivery = document.createElement("div");
                    delivery.className = "decoreva-checkout-delivery-note";
                    delivery.innerHTML = '<strong>Delivery estimate</strong><span>Delivery details will be confirmed with you on WhatsApp.</span>';
                    box.appendChild(delivery);
                }

                function renderSimilarProducts() {
                    const box = document.querySelector("#decoreva-similar-products");
                    if (!box) return;
                    box.replaceChildren();
                    if (!cart.length) { box.hidden = true; return; }

                    const cartTitles = cart.map(function(item){
                        return String(item.title || "").trim().toLowerCase();
                    });
                    const seen = {};
                    const candidates = Array.from(document.querySelectorAll(
                        "#collection-products .card, .featured-slider .featured-slide"
                    )).map(function(card){
                        const heading = card.querySelector("h3");
                        const title = heading ? heading.textContent.trim().replace(/\s+/g," ") : "";
                        const lower = title.toLowerCase();
                        if (!title || cartTitles.indexOf(lower) !== -1 || seen[lower]) return null;
                        seen[lower] = true;

                        const image = card.querySelector("img.slider-image, img");
                        const src = image ? (image.getAttribute("data-src") || image.getAttribute("src") || "") : "";
                        const priceEl = card.querySelector(".price");
                        const price = priceEl ? priceEl.textContent.trim().replace(/\s+/g," ") : "";
                        return {title:title, src:src, price:price};
                    }).filter(Boolean);

                    if (!candidates.length) { box.hidden = true; return; }
                    box.hidden = false;

                    const head = document.createElement("div");
                    head.className = "decoreva-similar-head";
                    head.innerHTML = "<strong>You May Also Like</strong><span>More from DECOREVA</span>";
                    box.appendChild(head);

                    const grid = document.createElement("div");
                    grid.className = "decoreva-similar-grid decoreva-all-products-grid";

                    candidates.forEach(function(item){
                        const card = document.createElement("article");
                        card.className = "decoreva-similar-card";

                        const img = document.createElement("img");
                        img.src = item.src;
                        img.alt = item.title;
                        img.loading = "lazy";

                        const info = document.createElement("div");
                        info.className = "decoreva-similar-card-info";

                        const title = document.createElement("strong");
                        title.textContent = item.title;

                        const price = document.createElement("span");
                        price.textContent = item.price || "View product";

                        const view = document.createElement("button");
                        view.type = "button";
                        view.textContent = "VIEW PRODUCT";
                        view.dataset.similarProductTitle = item.title;

                        info.appendChild(title);
                        info.appendChild(price);
                        info.appendChild(view);
                        card.appendChild(img);
                        card.appendChild(info);
                        grid.appendChild(card);
                    });

                    box.appendChild(grid);
                }

                function renderPaymentReview() {
                    const box=document.querySelector("#decoreva-payment-review");
                    if(!box) return;
                    box.innerHTML="";
                    const address=deliveryAddress || {};
                    const addressCard=document.createElement("div");
                    addressCard.className="decoreva-review-address";
                    addressCard.innerHTML='<div><strong>Deliver to</strong><span>' + escapeProfileText(address.name || "") + (address.pincode ? ", " + escapeProfileText(address.pincode) : "") + '</span></div><p>' + escapeProfileText(address.line || "") + '<br>' + escapeProfileText(address.city || "") + (address.state ? ", " + escapeProfileText(address.state) : "") + (address.pincode ? " - " + escapeProfileText(address.pincode) : "") + '<br>Mobile: ' + escapeProfileText(address.mobile || "") + '</p><button type="button" data-checkout-step="address">CHANGE ADDRESS</button>';
                    box.appendChild(addressCard);
                    const items=document.createElement("div"); items.className="decoreva-review-items";
                    const h=document.createElement("strong"); h.textContent="Items"; items.appendChild(h);
                    cart.forEach(function(item){
                        const row=document.createElement("div"); row.className="decoreva-review-item";
                        row.innerHTML='<span>' + escapeProfileText(item.title + (item.variationName ? " — " + item.variationName : "")) + ' × ' + item.quantity + '</span><b>' + money(item.price * item.quantity) + '</b>';
                        items.appendChild(row);
                    });
                    box.appendChild(items);
                    const price=document.createElement("div"); price.className="decoreva-review-price";
                    price.innerHTML='<div><span>Total MRP</span><b>' + money(subtotalAmount()) + '</b></div>' + (discountAmount() ? '<div><span>Discount on MRP</span><b>- ' + money(discountAmount()) + '</b></div>' : '') + '<div><span>Delivery</span><b>' + money(deliveryCharge()) + '</b></div><div class="final"><span>Total Amount</span><b>' + money(finalAmount()) + '</b></div>';
                    box.appendChild(price);
                }

                function renderCheckoutSummary() {
                    const box = document.querySelector("#decoreva-checkout-summary");
                    if (!box) return;
                    box.innerHTML = "";
                    const title = document.createElement("strong");
                    title.textContent = "Order Summary";
                    box.appendChild(title);
                    const couponRow = document.createElement("div");
                    couponRow.className = "decoreva-checkout-coupon-row";
                    couponRow.innerHTML = '<span>Coupon</span><button type="button" id="decoreva-checkout-coupon-button">Apply Coupon</button>';
                    box.appendChild(couponRow);
                    if (appliedCoupon) {
                        const applied = document.createElement("div");
                        applied.className = "decoreva-checkout-applied-coupon";
                        applied.innerHTML = '<span>' + escapeProfileText(appliedCoupon) + ' applied — 10% OFF</span><button type="button" id="decoreva-checkout-remove-coupon">Remove</button>';
                        box.appendChild(applied);
                    }
                    cart.forEach(function (item) {
                        const row = document.createElement("div");
                        row.className = "decoreva-checkout-summary-item";
                        const left = document.createElement("span");
                        left.textContent = item.title + (item.variationName ? " — " + item.variationName : "") + " × " + item.quantity;
                        const right = document.createElement("b");
                        right.textContent = money(item.price * item.quantity);
                        row.appendChild(left);
                        row.appendChild(right);
                        box.appendChild(row);
                    });
                    const rows = [
                        ["Total MRP", money(subtotalAmount())],
                        ...(discountAmount() ? [["Discount on MRP", "- " + money(discountAmount())]] : []),
                        ["Delivery", money(deliveryCharge())],
                        ["Total Amount", money(finalAmount())]
                    ];
                    rows.forEach(function (pair, index) {
                        const row = document.createElement("div");
                        row.className = "decoreva-checkout-summary-total" + (index === rows.length - 1 ? " final" : "");
                        const left = document.createElement("span");
                        left.textContent = pair[0];
                        const right = document.createElement("strong");
                        right.textContent = pair[1];
                        row.appendChild(left);
                        row.appendChild(right);
                        box.appendChild(row);
                    });
                    const coupon = document.createElement("div");
                    const summaryCoupon = effectiveCouponCode();
                    coupon.className = "decoreva-checkout-summary-coupon" + (summaryCoupon ? " applied" : " none");
                    coupon.textContent = summaryCoupon
                        ? "Coupon: " + summaryCoupon + (appliedCoupon ? " applied — 10% OFF" : " checked — 10% OFF")
                        : "Coupon: No coupon applied";
                    box.appendChild(coupon);
                }

                function updateCheckoutStepUI() {
                    const drawer = document.querySelector("#decoreva-cart-drawer");
                    if (!drawer) return;

                    /* Single-page checkout: Cart, price summary and Delivery Address stay visible together. */
                    checkoutStep = cart.length ? (checkoutStep === "address" ? "address" : "cart") : "cart";
                    drawer.classList.add("decoreva-checkout-mode");

                    const checkoutSteps = drawer.querySelector(".decoreva-checkout-steps");
                    if (checkoutSteps) { checkoutSteps.hidden = false; checkoutSteps.style.display = "flex"; }

                    const cartHeadTitle = drawer.querySelector(".decoreva-cart-head strong");
                    const cartHeadLabel = drawer.querySelector("#decoreva-cart-item-label");
                    if (cartHeadTitle) cartHeadTitle.textContent = "Your Cart";
                    if (cartHeadLabel) cartHeadLabel.textContent = totalItems() + (totalItems() === 1 ? " item" : " items");

                    renderCheckoutSummary();
                    renderCheckoutItems();
                    renderSimilarProducts();

                    const address = document.querySelector("#decoreva-checkout-address");
                    const payment = document.querySelector("#decoreva-checkout-payment");
                    if (address) address.hidden = cart.length === 0;
                    if (payment) payment.hidden = true;

                    const cartItems = document.querySelector("#decoreva-cart-items");
                    const cartEmpty = document.querySelector("#decoreva-cart-empty");
                    const footer = document.querySelector(".decoreva-cart-footer");
                    if (cartItems) cartItems.hidden = false;
                    if (cartEmpty) cartEmpty.hidden = cart.length !== 0;
                    if (footer) footer.hidden = cart.length === 0;

                    /* The cart already contains the order items; don't duplicate them below the address. */
                    const checkoutItems = document.querySelector("#decoreva-checkout-items");
                    if (checkoutItems) checkoutItems.hidden = true;

                    /* Keep one price/coupon box only: the cart footer on the right. */
                    const checkoutSummary = document.querySelector("#decoreva-checkout-summary");
                    if (checkoutSummary) checkoutSummary.hidden = true;

                    if (cart.length) {
                        const a = deliveryAddress || {};
                        [["#decoreva-address-name", a.name], ["#decoreva-address-mobile", a.mobile],
                         ["#decoreva-address-line", a.line], ["#decoreva-address-city", a.city],
                         ["#decoreva-address-state", a.state], ["#decoreva-address-pincode", a.pincode]]
                        .forEach(function (pair) {
                            const el = document.querySelector(pair[0]);
                            if (el && !el.value) el.value = pair[1] || "";
                        });
                        updateAddressContinueState();
                    }

                    drawer.querySelectorAll("[data-checkout-step]").forEach(function (button) {
                        const step = button.dataset.checkoutStep;
                        button.classList.toggle("active", step === checkoutStep || (step === "payment" && false));
                    });
                }

                function buildCartUI() {
                    if (document.querySelector("#decoreva-cart-drawer")) return;

                    const floating = document.createElement("button");
                    floating.type = "button";
                    floating.id = "decoreva-cart-button";
                    floating.className = "decoreva-cart-button";
                    floating.setAttribute("aria-label", "Open shopping cart");
                    floating.innerHTML = '<i class="fas fa-shopping-bag" aria-hidden="true"></i><span id="decoreva-cart-count">0</span>';

                    /* Navigation cart is now the primary cart button.
                       Keep the old floating cart only as a fallback if nav is unavailable. */
                    if (!document.querySelector("#decoreva-nav-cart")) {
                        document.body.appendChild(floating);
                    }

                    const drawer = document.createElement("aside");
                    drawer.id = "decoreva-cart-drawer";
                    drawer.className = "decoreva-cart-drawer";
                    drawer.setAttribute("aria-hidden", "true");
                    drawer.innerHTML = `
                        <div class="decoreva-cart-overlay" data-cart-close="true"></div>
                        <div class="decoreva-cart-panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
                            <div class="decoreva-checkout-steps" aria-label="Checkout progress">
                                <button type="button" class="active" data-checkout-step="cart">CART</button>
                                <i aria-hidden="true"></i>
                                <button type="button" data-checkout-step="address">ADDRESS</button>
                                <i aria-hidden="true"></i>
                                <button type="button" data-checkout-step="payment">PAYMENT</button>
                            </div>
                            <div id="decoreva-checkout-address" class="decoreva-checkout-section" hidden>
                                <div class="decoreva-checkout-section-head"><strong>Delivery Address</strong><span>Where should we deliver your order?</span></div>
                                <div id="decoreva-checkout-summary" class="decoreva-checkout-summary"></div>
                                <input id="decoreva-address-name" type="text" placeholder="Full name" autocomplete="name">
                                <input id="decoreva-address-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" autocomplete="tel">
                                <textarea id="decoreva-address-line" rows="2" placeholder="House / Street / Area"></textarea>
                                <div class="decoreva-address-grid">
                                    <input id="decoreva-address-city" type="text" placeholder="City">
                                    <input id="decoreva-address-state" type="text" placeholder="State">
                                    <input id="decoreva-address-pincode" type="text" placeholder="PIN code" inputmode="numeric" maxlength="6">
                                </div>
                                <div id="decoreva-checkout-items" class="decoreva-checkout-items"></div>
                                <div id="decoreva-similar-products" class="decoreva-similar-products" hidden></div>
                                <div id="decoreva-address-message" class="decoreva-address-message"></div>
                            </div>
                            <div id="decoreva-checkout-payment" class="decoreva-checkout-section" hidden>
                                <div class="decoreva-checkout-section-head"><strong>Review &amp; Place Order</strong><span>Check your delivery details and order before confirming.</span></div>
                                <div id="decoreva-payment-review" class="decoreva-payment-review"></div>
                                <button type="button" id="decoreva-payment-order">Place Order on WhatsApp</button>
                            </div>
                            <div class="decoreva-cart-head">
                                <div class="decoreva-cart-head-title"><strong>Your Cart</strong><span id="decoreva-cart-item-label">0 items</span></div>
                                <button type="button" class="decoreva-cart-close" data-cart-close="true" aria-label="Close cart">×</button>
                            </div>
                            <div id="decoreva-cart-empty" class="decoreva-cart-empty">Your cart is empty.</div>
                            <div id="decoreva-cart-items" class="decoreva-cart-items"></div>
                            <div class="decoreva-cart-footer">
                                <div class="decoreva-coupon-summary-row">
                                    <span>Coupon Discount</span>
                                    <button type="button" id="decoreva-open-coupon">${appliedCoupon ? "Remove Coupon" : "Apply Coupon"}</button>
                                </div>
                                <div id="decoreva-coupon-applied-label" class="decoreva-coupon-applied-label" hidden></div>
                                <div class="decoreva-cart-summary-row"><span>Total MRP</span><strong id="decoreva-cart-subtotal">₹0</strong></div>
                                <div class="decoreva-cart-summary-row" id="decoreva-cart-discount-row" hidden><span>Discount on MRP</span><strong id="decoreva-cart-discount">- ₹0</strong></div>
                                <div class="decoreva-cart-summary-row"><span>Delivery</span><strong id="decoreva-cart-delivery">₹0</strong></div>
                                <div class="decoreva-cart-total-row"><span>Total Amount</span><strong id="decoreva-cart-total">₹0</strong></div>
                                <button type="button" id="decoreva-cart-whatsapp">Place Order on WhatsApp</button>
                            </div>
                        </div>`;
                    document.body.appendChild(drawer);

                    const couponModal = document.createElement("div");
                    couponModal.id = "decoreva-coupon-modal";
                    couponModal.className = "decoreva-coupon-modal";
                    couponModal.setAttribute("aria-hidden", "true");
                    couponModal.innerHTML = `
                        <div class="decoreva-coupon-modal-overlay" data-coupon-close="true"></div>
                        <div class="decoreva-coupon-modal-panel" role="dialog" aria-modal="true" aria-label="Apply Coupon">
                            <div class="decoreva-coupon-modal-head">
                                <strong>APPLY COUPON</strong>
                                <button type="button" class="decoreva-coupon-modal-close" data-coupon-close="true" aria-label="Close coupon">×</button>
                            </div>
                            <div class="decoreva-coupon-modal-body">
                                <div class="decoreva-coupon-modal-input-row">
                                    <input id="decoreva-coupon-input" type="text" maxlength="20" placeholder="Enter coupon code" autocomplete="off">
                                    <button type="button" id="decoreva-coupon-check">CHECK</button>
                                </div>
                                <div id="decoreva-coupon-message" class="decoreva-coupon-message"></div>
                                <div class="decoreva-coupon-modal-empty">Use <strong>WELCOME10</strong> for 10% off.</div>
                            </div>
                            <div class="decoreva-coupon-modal-footer">
                                <div><span>Maximum savings:</span><strong>10% OFF</strong></div>
                                <button type="button" id="decoreva-coupon-apply">APPLY</button>
                            </div>
                        </div>`;
                    document.body.appendChild(couponModal);

                    const wishlistDrawer = document.createElement("aside");
                    wishlistDrawer.id = "decoreva-wishlist-drawer";
                    wishlistDrawer.className = "decoreva-side-drawer";
                    wishlistDrawer.setAttribute("aria-hidden", "true");
                    wishlistDrawer.innerHTML = `
                        <div class="decoreva-side-overlay" data-wishlist-close="true"></div>
                        <div class="decoreva-side-panel" role="dialog" aria-modal="true" aria-label="Wishlist">
                            <div class="decoreva-side-head">
                                <div><strong>Wishlist</strong><span id="decoreva-wishlist-label">0 items</span></div>
                                <button type="button" class="decoreva-cart-close" data-wishlist-close="true" aria-label="Close wishlist">×</button>
                            </div>
                            <div id="decoreva-wishlist-empty" class="decoreva-side-empty">Your wishlist is empty.</div>
                            <div id="decoreva-wishlist-items" class="decoreva-side-items"></div>
                        </div>
                    `;
                    document.body.appendChild(wishlistDrawer);

                    const profilePanel = document.createElement("aside");
                    profilePanel.id = "decoreva-profile-panel";
                    profilePanel.className = "decoreva-profile-panel";
                    profilePanel.setAttribute("aria-hidden", "true");
                    profilePanel.innerHTML = `
                        <div class="decoreva-profile-overlay" data-profile-close="true"></div>
                        <div class="decoreva-profile-card" role="dialog" aria-modal="true" aria-label="DECOREVA Profile">
                            <div class="decoreva-profile-head">
                                <div><strong>My Profile</strong><span>Profile & Saved Addresses</span></div>
                                <button type="button" class="decoreva-cart-close" data-profile-close="true" aria-label="Close profile">×</button>
                            </div>
                            <div class="decoreva-profile-body">
                                <div class="decoreva-profile-welcome">
                                    <strong id="decoreva-profile-welcome-title">Welcome to DECOREVA</strong>
                                    <span id="decoreva-profile-welcome-sub">Login or sign up to manage your orders and account.</span>
                                    <button type="button" id="decoreva-profile-login">LOGIN / SIGNUP</button>
                                </div>
                                <nav class="decoreva-profile-menu" aria-label="My account">
                                    <button type="button" data-profile-menu="orders"><span>My Orders</span><small>Orders & order requests</small></button>
                                    <button type="button" data-profile-menu="wishlist"><span>Wishlist</span><small>View saved products</small></button>
                                    <button type="button" data-profile-menu="coupons"><span>Coupons</span><small>Available offers</small></button>
                                    <button type="button" data-profile-menu="addresses"><span>Saved Addresses</span><small>Manage addresses</small></button>
                                    <button type="button" data-profile-menu="contact"><span>Contact Us</span><small>WhatsApp & Instagram</small></button>
                                </nav>
                                <div class="decoreva-profile-account-actions">
                                    <button type="button" id="decoreva-profile-edit" data-profile-menu="personal"><span>Edit Profile</span><small>Personal details</small></button>
                                    <button type="button" id="decoreva-profile-logout" hidden><span>Logout</span><small>Sign out of your account</small></button>
                                </div>
                                <section id="decoreva-profile-personal-section" class="decoreva-profile-section" hidden>
                                    <div class="decoreva-profile-section-title"><strong>Personal Details</strong><span>Save your details for faster checkout.</span></div>
                                    <input id="decoreva-profile-name" type="text" placeholder="Full name" autocomplete="name">
                                    <input id="decoreva-profile-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" maxlength="10" autocomplete="tel">
                                    <input id="decoreva-profile-email" type="email" placeholder="Email address (optional)" autocomplete="email">
                                    <button type="button" id="decoreva-profile-save">Save Profile</button>
                                    <div id="decoreva-profile-message" class="decoreva-profile-message"></div>
                                </section>
                                <section id="decoreva-profile-address-section" class="decoreva-profile-section" hidden>
                                    <div class="decoreva-profile-section-title profile-address-title"><div><strong>Saved Addresses</strong><span>Use a saved address during checkout.</span></div><button type="button" id="decoreva-profile-add-address">+ Add New</button></div>
                                    <div id="decoreva-profile-addresses"></div>
                                    <div id="decoreva-profile-address-form" class="decoreva-profile-address-form" hidden data-edit-index="">
                                        <strong id="decoreva-profile-address-form-title">Add New Address</strong>
                                        <select id="decoreva-profile-address-label"><option value="HOME">HOME</option><option value="OFFICE">OFFICE</option><option value="OTHER">OTHER</option></select>
                                        <input id="decoreva-profile-address-name" type="text" placeholder="Full name">
                                        <input id="decoreva-profile-address-mobile" type="tel" placeholder="Mobile number" inputmode="numeric" maxlength="10">
                                        <textarea id="decoreva-profile-address-line" rows="2" placeholder="House / Street / Area"></textarea>
                                        <div class="decoreva-profile-address-grid"><input id="decoreva-profile-address-city" type="text" placeholder="City"><input id="decoreva-profile-address-state" type="text" placeholder="State"><input id="decoreva-profile-address-pincode" type="text" placeholder="PIN code" inputmode="numeric" maxlength="6"></div>
                                        <div class="decoreva-profile-address-form-actions"><button type="button" id="decoreva-profile-address-cancel">Cancel</button><button type="button" id="decoreva-profile-address-save">Save Address</button></div>
                                        <div id="decoreva-profile-address-message" class="decoreva-profile-message"></div>
                                    </div>
                                </section>
                                <p class="decoreva-profile-note">Your profile and saved addresses are securely linked to your account when you are logged in.</p>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(profilePanel);
                }

                buildCartUI();
                renderCart();
                renderWishlist();
                updateCheckoutStepUI();

                /* Direct checkout/coupon controls for reliable clicks. */
                const checkoutDrawer = document.querySelector("#decoreva-cart-drawer");
                if (checkoutDrawer) {
                    checkoutDrawer.querySelectorAll("[data-checkout-step]").forEach(function (button) {
                        button.addEventListener("click", function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            const step = button.dataset.checkoutStep;

                            if (step === "payment") {
                                const address = document.querySelector("#decoreva-checkout-address");
                                const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
                                if (address && panel) panel.scrollTo({ top: Math.max(0, address.offsetTop - 20), behavior: "smooth" });
                                return;
                            }
                            checkoutStep = step === "address" ? "address" : "cart";
                            updateCheckoutStepUI();
                            const target = step === "address"
                                ? document.querySelector("#decoreva-checkout-address")
                                : document.querySelector("#decoreva-cart-items");
                            const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
                            if (target && panel) panel.scrollTo({ top: Math.max(0, target.offsetTop - 20), behavior: "smooth" });
                        });
                    });
                }

                const couponCheckButton = document.querySelector("#decoreva-coupon-check");
                if (couponCheckButton) {
                    couponCheckButton.addEventListener("click", function (event) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        const input = document.querySelector("#decoreva-coupon-input");
                        const message = document.querySelector("#decoreva-coupon-message");
                        const code = input ? input.value.trim().toUpperCase() : "";
                        if (!message) return;

                        if (!code) {
                            couponPreviewCode = "";
                            message.textContent = "Please enter a coupon code.";
                            message.className = "decoreva-coupon-message warning";
                            renderCart();
                            renderCheckoutSummary();
                        } else if (!COUPONS[code]) {
                            couponPreviewCode = "";
                            message.textContent = "Invalid coupon code.";
                            message.className = "decoreva-coupon-message error";
                            renderCart();
                            renderCheckoutSummary();
                        } else if (appliedCoupon === code) {
                            message.textContent = code + " is already applied.";
                            message.className = "decoreva-coupon-message success";
                        } else {
                            couponPreviewCode = code;
                            message.textContent = "Coupon code is valid — 10% discount preview shown below. Click APPLY to keep it.";
                            message.className = "decoreva-coupon-message success";
                            renderCart();
                            renderCheckoutSummary();
                        }
                    });
                }

                /* Direct handlers for the top-right shopping navigation. */
                const navCart = document.querySelector("#decoreva-nav-cart");
                const navWishlist = document.querySelector("#decoreva-wishlist-nav");
                const navProfile = document.querySelector("#decoreva-profile-nav");

                if (navCart) navCart.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    openCart();
                    updateCartCount();
                });
                if (navWishlist) navWishlist.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    openWishlist();
                    updateWishlistCount();
                });
                if (navProfile) navProfile.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    openProfile();
                });

                document.addEventListener("click", async function (event) {
                    const cartButton = event.target.closest(".decoreva-add-cart");
                    if (cartButton) {
                        event.preventDefault();
                        event.stopPropagation();
                        addToCart(cartButton.closest(".card, .featured-slide"));
                        return;
                    }

                    const wishlistButton = event.target.closest(".decoreva-wishlist");
                    if (wishlistButton) {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleWishlist(wishlistButton.closest(".card, .featured-slide"));
                        return;
                    }

                    if (event.target.closest("#decoreva-nav-cart, #decoreva-cart-button")) {
                        event.preventDefault();
                        event.stopPropagation();
                        openCart();
                        return;
                    }

                    if (event.target.closest("#decoreva-wishlist-nav")) {
                        event.preventDefault();
                        event.stopPropagation();
                        openWishlist();
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-nav")) {
                        event.preventDefault();
                        event.stopPropagation();
                        openProfile();
                        return;
                    }

                    if (event.target.closest("#decoreva-order-confirmation-close")) {
                        event.preventDefault();
                        const confirmation = document.querySelector("#decoreva-order-confirmation");
                        if (confirmation) confirmation.classList.remove("open");
                        return;
                    }

                    /* DECOREVA CART ITEM ACTIONS — FIX
                       Handles +, −, Remove and Move to Wishlist for the
                       dynamically rendered cart items. */
                    const cartAction = event.target.closest("[data-cart-action]");
                    if (cartAction) {
                        event.preventDefault();
                        event.stopPropagation();

                        const index = Number(cartAction.dataset.cartIndex);
                        const action = cartAction.dataset.cartAction;

                        if (!Number.isInteger(index) || !cart[index]) return;

                        if (action === "plus") {
                            cart[index].quantity = Number(cart[index].quantity || 0) + 1;
                        } else if (action === "minus") {
                            cart[index].quantity = Math.max(1, Number(cart[index].quantity || 1) - 1);
                        } else if (action === "remove") {
                            cart.splice(index, 1);
                        } else if (action === "wishlist") {
                            const item = cart[index];

                            if (!wishlist.some(function(saved) {
                                return saved.id === item.id;
                            })) {
                                wishlist.push(item);
                                saveWishlist();
                            }

                            cart.splice(index, 1);
                        } else {
                            return;
                        }

                        saveCart();
                        updateCartCount();
                        updateWishlistCount();
                        renderCart();
                        renderWishlist();
                        return;
                    }

                    if (event.target.closest("[data-cart-close]")) {
                        event.preventDefault();
                        closeCart();
                        return;
                    }

                    if (event.target.closest("[data-wishlist-close]")) {
                        event.preventDefault();
                        closeWishlist();
                        return;
                    }

                    if (event.target.closest("[data-profile-close]")) {
                        event.preventDefault();
                        closeProfile();
                        return;
                    }

                    if (event.target.closest("#decoreva-open-coupon, #decoreva-checkout-coupon-button")) {
                        event.preventDefault();
                        openCouponModal();
                        return;
                    }

                    if (event.target.closest("#decoreva-checkout-remove-coupon")) {
                        event.preventDefault();
                        appliedCoupon = "";
                        couponPreviewCode = "";
                        saveCoupon();
                        renderCart();
                        renderCheckoutSummary();
                        return;
                    }

                    if (event.target.closest("[data-coupon-close]")) {
                        event.preventDefault();
                        closeCouponModal();
                        return;
                    }

                    if (event.target.closest("#decoreva-coupon-check")) {
                        event.preventDefault();
                        event.stopPropagation();
                        const input = document.querySelector("#decoreva-coupon-input");
                        const message = document.querySelector("#decoreva-coupon-message");
                        const code = input ? input.value.trim().toUpperCase() : "";
                        if (!message) return;

                        if (!code) {
                            couponPreviewCode = "";
                            message.textContent = "Please enter a coupon code.";
                            message.className = "decoreva-coupon-message warning";
                            renderCart();
                            renderCheckoutSummary();
                        } else if (!COUPONS[code]) {
                            couponPreviewCode = "";
                            message.textContent = "Invalid coupon code.";
                            message.className = "decoreva-coupon-message error";
                            renderCart();
                            renderCheckoutSummary();
                        } else if (appliedCoupon === code) {
                            message.textContent = code + " is already applied.";
                            message.className = "decoreva-coupon-message success";
                        } else {
                            couponPreviewCode = code;
                            message.textContent = "Coupon code is valid — 10% discount preview shown below. Click APPLY to keep it.";
                            message.className = "decoreva-coupon-message success";
                            renderCart();
                            renderCheckoutSummary();
                        }
                        return;
                    }

                    if (event.target.closest("#decoreva-coupon-apply")) {
                        event.preventDefault();
                        applyCoupon();
                        return;
                    }

                    const stepButton = event.target.closest("[data-checkout-step]");
                    if (stepButton) {
                        event.preventDefault();
                        event.stopPropagation();
                        const step = stepButton.dataset.checkoutStep;

                        if (step === "payment") {
                            const address = document.querySelector("#decoreva-checkout-address");
                            const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
                            if (address && panel) panel.scrollTo({ top: Math.max(0, address.offsetTop - 18), behavior: "smooth" });
                            return;
                        }

                        checkoutStep = step === "address" ? "address" : "cart";
                        const d = document.querySelector("#decoreva-cart-drawer");
                        if (d) d.classList.add("decoreva-checkout-mode");
                        document.body.classList.add("decoreva-checkout-open");
                        updateCheckoutStepUI();
                        const target = step === "address"
                            ? document.querySelector("#decoreva-checkout-address")
                            : document.querySelector("#decoreva-cart-items");
                        const panel = document.querySelector("#decoreva-cart-drawer .decoreva-cart-panel");
                        if (target && panel) panel.scrollTo({ top: Math.max(0, target.offsetTop - 18), behavior: "smooth" });
                        return;
                    }


                    if (event.target.closest("#decoreva-payment-order")) {
                        event.preventDefault();
                        event.stopPropagation();

                        const address = document.querySelector("#decoreva-checkout-address");
                        if (!address || !cart.length) return;

                        const get = function (id) {
                            const el = document.querySelector(id);
                            return el ? el.value.trim() : "";
                        };

                        const complete =
                            !!get("#decoreva-address-name") &&
                            /^\\d{10}$/.test(get("#decoreva-address-mobile")) &&
                            !!get("#decoreva-address-line") &&
                            !!get("#decoreva-address-city") &&
                            !!get("#decoreva-address-state") &&
                            /^\\d{6}$/.test(get("#decoreva-address-pincode"));

                        if (!complete) {
                            const addressMessage = document.querySelector("#decoreva-address-message");
                            if (addressMessage) {
                                addressMessage.dataset.userMessage = "1";
                                addressMessage.textContent = "Please fill all delivery address details before placing your order.";
                                addressMessage.className = "decoreva-address-message error";
                            }
                            checkoutStep = "address";
                            updateCheckoutStepUI();
                            address.scrollIntoView({behavior:"smooth", block:"start"});
                            return;
                        }

                        deliveryAddress = {
                            name: get("#decoreva-address-name"),
                            mobile: get("#decoreva-address-mobile"),
                            line: get("#decoreva-address-line"),
                            city: get("#decoreva-address-city"),
                            state: get("#decoreva-address-state"),
                            pincode: get("#decoreva-address-pincode")
                        };

                        localStorage.setItem("decorevaDeliveryAddress", JSON.stringify(deliveryAddress));
                        whatsappCheckout();
                        return;
                    }

                    if (event.target.closest("#decoreva-cart-whatsapp")) {
                        event.preventDefault();

                        const drawer = document.querySelector("#decoreva-cart-drawer");
                        const addressSection = document.querySelector("#decoreva-checkout-address");
                        if (!drawer || !addressSection || !cart.length) return;

                        const get = function (id) {
                            const el = document.querySelector(id);
                            return el ? el.value.trim() : "";
                        };

                        const address = {
                            name: get("#decoreva-address-name"),
                            mobile: get("#decoreva-address-mobile"),
                            line: get("#decoreva-address-line"),
                            city: get("#decoreva-address-city"),
                            state: get("#decoreva-address-state"),
                            pincode: get("#decoreva-address-pincode")
                        };

                        const complete =
                            !!address.name &&
                            /^\d{10}$/.test(address.mobile) &&
                            !!address.line &&
                            !!address.city &&
                            !!address.state &&
                            /^\d{6}$/.test(address.pincode);

                        /* Always use the single right-side Order on WhatsApp button.
                           If address is missing, take the customer to the address
                           fields instead of doing nothing. */
                        checkoutStep = "address";
                        drawer.classList.add("decoreva-checkout-mode", "open");
                        drawer.setAttribute("aria-hidden", "false");
                        document.body.classList.add("decoreva-cart-open", "decoreva-checkout-open");
                        document.body.style.overflow = "hidden";
                        document.documentElement.style.overflow = "hidden";
                        updateCheckoutStepUI();

                        const message = document.querySelector("#decoreva-address-message");

                        if (!complete) {
                            if (message) {
                                message.dataset.userMessage = "1";
                                message.textContent =
                                    "Please fill all delivery address details before ordering on WhatsApp.";
                                message.className = "decoreva-address-message error";
                            }

                            requestAnimationFrame(function () {
                                addressSection.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });

                                const firstMissing = [
                                    "#decoreva-address-name",
                                    "#decoreva-address-mobile",
                                    "#decoreva-address-line",
                                    "#decoreva-address-city",
                                    "#decoreva-address-state",
                                    "#decoreva-address-pincode"
                                ]
                                    .map(function (id) {
                                        return document.querySelector(id);
                                    })
                                    .find(function (el) {
                                        return el && !el.value.trim();
                                    });

                                if (firstMissing) {
                                    firstMissing.focus({ preventScroll: true });
                                }
                            });
                            return;
                        }

                        deliveryAddress = address;
                        localStorage.setItem(
                            "decorevaDeliveryAddress",
                            JSON.stringify(address)
                        );

                        profile.name = address.name || profile.name;
                        profile.mobile = address.mobile || profile.mobile;

                        const exists = profile.addresses.some(function (saved) {
                            return (
                                saved.line === address.line &&
                                saved.pincode === address.pincode
                            );
                        });

                        if (!exists) {
                            profile.addresses.push({
                                label: "HOME",
                                name: address.name,
                                mobile: address.mobile,
                                line: address.line,
                                city: address.city,
                                state: address.state,
                                pincode: address.pincode,
                                default: profile.addresses.length === 0
                            });
                            saveProfile();
                        }

                        if (message) {
                            message.dataset.userMessage = "1";
                            message.textContent =
                                "Address saved. Opening WhatsApp to place your order.";
                            message.className = "decoreva-address-message success";
                        }

                        whatsappCheckout();
                    }
                }, true);

                /* Robust drawer + item actions. These use event delegation so
                   dynamically rendered wishlist/cart/recommendation buttons always work. */
                document.addEventListener("click", function (event) {
                    const navWish = event.target.closest("#decoreva-wishlist-nav");
                    if (navWish) {
                        event.preventDefault();
                        event.stopPropagation();
                        openWishlist();
                        return;
                    }

                    const wishlistAction = event.target.closest("[data-wishlist-action]");
                    if (wishlistAction) {
                        event.preventDefault();
                        const index = Number(wishlistAction.dataset.wishlistIndex);
                        if (!Number.isInteger(index) || !wishlist[index]) return;
                        if (wishlistAction.dataset.wishlistAction === "remove") {
                            wishlist.splice(index, 1);
                            saveWishlist();
                            renderWishlist();
                        }
                        return;
                    }

                    const checkoutAction = event.target.closest("[data-checkout-item-action]");
                    if (checkoutAction) {
                        event.preventDefault();
                        const index = Number(checkoutAction.dataset.checkoutItemIndex);
                        if (!Number.isInteger(index) || !cart[index]) return;
                        const action = checkoutAction.dataset.checkoutItemAction;
                        if (action === "remove") {
                            cart.splice(index, 1);
                        } else if (action === "wishlist") {
                            const item = cart[index];
                            if (!wishlist.some(function(saved){ return saved.id === item.id; })) {
                                wishlist.push(item);
                                saveWishlist();
                            }
                            cart.splice(index, 1);
                        }
                        saveCart();
                        renderCart();
                        renderWishlist();
                        return;
                    }

                    const similarView = event.target.closest("[data-similar-product-title]");
                    if (similarView) {
                        event.preventDefault();
                        const title = String(similarView.dataset.similarProductTitle || "").trim().toLowerCase();
                        const target = Array.from(document.querySelectorAll("#collection-products .card, .featured-slider .featured-slide"))
                            .find(function(card){
                                const heading = card.querySelector("h3");
                                return heading && heading.textContent.trim().replace(/\s+/g," ").toLowerCase() === title;
                            });
                        closeCart();
                        if (target) {
                            setTimeout(function(){
                                target.scrollIntoView({behavior:"smooth", block:"center"});
                            }, 60);
                        }
                        return;
                    }
                }, true);

                document.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        closeCart();
                        closeWishlist();
                        closeProfile();
                        closeCouponModal();
                    }
                });

                document.addEventListener("input", function (event) {
                    if (!event.target.matches("#decoreva-address-name, #decoreva-address-mobile, #decoreva-address-line, #decoreva-address-city, #decoreva-address-state, #decoreva-address-pincode")) return;
                    const message = document.querySelector("#decoreva-address-message");
                    if (message) message.dataset.userMessage = "";
                    updateAddressContinueState();
                });

                document.addEventListener("input", function (event) {
                    if (!event.target.matches("#decoreva-coupon-input")) return;
                    const message = document.querySelector("#decoreva-coupon-message");
                    if (!message) return;
                    if (event.target.value.trim() && event.target.value.trim().toUpperCase() !== appliedCoupon) {
                        message.textContent = "Please apply coupon code";
                        message.className = "decoreva-coupon-message warning";
                    } else if (!event.target.value.trim()) {
                        message.textContent = "";
                        message.className = "decoreva-coupon-message";
                        if (appliedCoupon) {
                            appliedCoupon = "";
                            saveCoupon();
                            renderCart();
                        }
                    }
                }, true);

                function addCardButtons() {
                    document.querySelectorAll("#collection-products .card, .featured-slide").forEach(function (card) {
                        if (!card.querySelector(":scope > .decoreva-add-cart")) {
                            const button = document.createElement("button");
                            button.type = "button";
                            button.className = "decoreva-add-cart";
                            const title = (card.querySelector("h3") || {}).textContent || "product";
                            button.setAttribute("aria-label", "Add " + title.trim() + " to cart");
                            button.title = "Add to Cart";
                            button.innerHTML = '<i class="fas fa-cart-plus" aria-hidden="true"></i>';
                            card.appendChild(button);
                        }

                        if (!card.querySelector(":scope > .decoreva-wishlist")) {
                            const button = document.createElement("button");
                            button.type = "button";
                            button.className = "decoreva-wishlist";
                            button.title = "Add to Wishlist";
                            button.innerHTML = '<i class="far fa-heart" aria-hidden="true"></i>';
                            card.appendChild(button);
                        }
                    });

                    updateWishlistButtons();
                }

                addCardButtons();
                updateCartCount();
                updateWishlistCount();
                window.setTimeout(function () {
                    updateCartCount();
                    updateWishlistCount();
                }, 0);

                /* =========================================================
                   DECOREVA — PROFILE + SAVED ADDRESSES
                   Supabase-backed for logged-in customers; local fallback for guests.
                   ========================================================= */
                document.addEventListener("click", async function (event) {
                    const profileMenu = event.target.closest("[data-profile-menu]");
                    if (profileMenu) {
                        event.preventDefault();
                        const action = profileMenu.dataset.profileMenu;
                        if (action === "orders") {
                            const msg = document.querySelector("#decoreva-profile-message");
                            if (msg) {
                                msg.textContent = "Orders are confirmed through WhatsApp after you send the order message.";
                                msg.className = "decoreva-profile-message success";
                                msg.dataset.persistent = "true";
                            }
                        } else if (action === "wishlist") {
                            closeProfile();
                            openWishlist();
                        } else if (action === "coupons") {
                            closeProfile();
                            openCouponModal();
                        } else if (action === "personal") {
                            const section = document.querySelector("#decoreva-profile-personal-section");
                            if (section) {
                                section.hidden = false;
                                section.scrollIntoView({behavior:"smooth", block:"start"});
                            }
                        } else if (action === "addresses") {
                            const section = document.querySelector("#decoreva-profile-address-section");
                            if (section) {
                                section.hidden = false;
                                section.scrollIntoView({behavior:"smooth", block:"start"});
                            }
                        } else if (action === "contact") {
                            closeProfile();
                            setTimeout(function(){
                                const contact = document.querySelector("#contact");
                                if (contact) contact.scrollIntoView({behavior:"smooth", block:"start"});
                            }, 80);
                        }
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-login")) {
                        /*
                         * Guest LOGIN / SIGNUP belongs to Supabase Auth.
                         * Do not open Personal Details here — that used to
                         * consume the click and fight with supabase-auth.js.
                         * Close the drawer immediately and let the Auth
                         * listener handle the same click.
                         */
                        event.preventDefault();
                        closeProfile();
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-save")) {
                        event.preventDefault();
                        const get = id => { const el = document.querySelector(id); return el ? el.value.trim() : ""; };
                        const name = get("#decoreva-profile-name");
                        const mobile = get("#decoreva-profile-mobile");
                        const email = get("#decoreva-profile-email");
                        const message = document.querySelector("#decoreva-profile-message");
                        if (!name || !/^\d{10}$/.test(mobile)) {
                            if (message) { message.textContent = "Please enter your name and valid 10-digit mobile number."; message.className = "decoreva-profile-message error"; }
                            return;
                        }
                        profile.name = name;
                        profile.mobile = mobile;
                        profile.email = email;
                        saveProfile();
                        if (message) { message.textContent = "Profile saved successfully."; message.className = "decoreva-profile-message success"; message.dataset.persistent = "true"; }
                        renderProfile();
                        if (message) { message.textContent = "Profile saved successfully."; message.className = "decoreva-profile-message success"; message.dataset.persistent = "true"; }
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-add-address")) {
                        event.preventDefault();
                        showProfileAddressForm();
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-address-cancel")) {
                        event.preventDefault();
                        hideProfileAddressForm();
                        return;
                    }

                    const addressAction = event.target.closest("[data-profile-address-action]");
                    if (addressAction) {
                        event.preventDefault();
                        const index = Number(addressAction.dataset.profileAddressIndex);
                        if (!Number.isInteger(index) || !profile.addresses[index]) return;
                        const action = addressAction.dataset.profileAddressAction;
                        if (action === "edit") { showProfileAddressForm(index); return; }
                        if (action === "delete") {
                            const selectedAddress = profile.addresses[index];

                            if (selectedAddress && selectedAddress.id && decorevaAddressSupabase) {
                                try {
                                    await deleteSupabaseAddress(selectedAddress);
                                    renderProfile();
                                } catch (error) {
                                    console.error("DECOREVA saved address delete error:", error);
                                    alert("Could not delete this address. Please try again.");
                                }
                                return;
                            }

                            profile.addresses.splice(index, 1);
                            if (profile.addresses.length && !profile.addresses.some(a => a.default)) profile.addresses[0].default = true;
                            saveProfile(); renderProfile(); return;
                        }

                        if (action === "default") {
                            const selectedAddress = profile.addresses[index];

                            if (selectedAddress && selectedAddress.id && decorevaAddressSupabase) {
                                try {
                                    await setSupabaseDefaultAddress(selectedAddress);
                                    renderProfile();
                                } catch (error) {
                                    console.error("DECOREVA saved address default error:", error);
                                    alert("Could not change the default address. Please try again.");
                                }
                                return;
                            }

                            profile.addresses.forEach((a, i) => a.default = i === index);
                            saveProfile(); renderProfile();
                            return;
                        }
                    }

                    if (event.target.closest("#decoreva-profile-address-save")) {
                        event.preventDefault();
                        const get = id => { const el = document.querySelector(id); return el ? el.value.trim() : ""; };
                        const address = {
                            label: get("#decoreva-profile-address-label") || "HOME",
                            name: get("#decoreva-profile-address-name") || profile.name,
                            mobile: get("#decoreva-profile-address-mobile") || profile.mobile,
                            line: get("#decoreva-profile-address-line"),
                            city: get("#decoreva-profile-address-city"),
                            state: get("#decoreva-profile-address-state"),
                            pincode: get("#decoreva-profile-address-pincode"),
                            default: false
                        };
                        const message = document.querySelector("#decoreva-profile-address-message");
                        if (!address.name || !/^\d{10}$/.test(address.mobile) || !address.line || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
                            if (message) { message.textContent = "Please fill all details with a valid 10-digit mobile and 6-digit PIN."; message.className = "decoreva-profile-message error"; }
                            return;
                        }
                        const form = document.querySelector("#decoreva-profile-address-form");
                        const editIndex = form && form.dataset.editIndex !== "" ? Number(form.dataset.editIndex) : -1;
                        const existingAddress = editIndex >= 0 && profile.addresses[editIndex]
                            ? profile.addresses[editIndex]
                            : null;

                        address.default = existingAddress
                            ? !!existingAddress.default
                            : profile.addresses.length === 0;

                        if (existingAddress && existingAddress.id) {
                            address.id = existingAddress.id;
                        }

                        const currentUser = await getDecorevaAuthUser();

                        if (currentUser && decorevaAddressSupabase) {
                            try {
                                const saved = await saveSupabaseAddress(address, editIndex);
                                if (!saved) throw new Error("Supabase address save unavailable.");

                                hideProfileAddressForm();
                                renderProfile();
                                return;
                            } catch (error) {
                                console.error("DECOREVA saved address save error:", error);
                                if (message) {
                                    message.textContent = "Could not save address to your account. Please try again.";
                                    message.className = "decoreva-profile-message error";
                                }
                                return;
                            }
                        }

                        if (editIndex >= 0 && profile.addresses[editIndex]) {
                            profile.addresses[editIndex] = address;
                        } else {
                            profile.addresses.push(address);
                        }

                        saveProfile();
                        hideProfileAddressForm();
                        renderProfile();
                        return;
                    }

                    if (event.target.closest("#decoreva-profile-panel") && event.target.closest(".decoreva-profile-card") === null) {
                        return;
                    }
                }, true);

                /* Keep checkout address and profile addresses synchronized. */
                const originalAddressMessage = document.querySelector("#decoreva-address-message");
                window.setTimeout(function () {
                    const addressButton = document.querySelector("#decoreva-save-address");
                    if (addressButton && !addressButton.dataset.profileSync) {
                        addressButton.dataset.profileSync = "true";
                        addressButton.addEventListener("click", function () {
                            window.setTimeout(function () {
                                if (!deliveryAddress) return;
                                const exists = profile.addresses.some(function (a) {
                                    return a.line === deliveryAddress.line && a.pincode === deliveryAddress.pincode;
                                });
                                if (!exists) {
                                    profile.name = deliveryAddress.name || profile.name;
                                    profile.mobile = deliveryAddress.mobile || profile.mobile;
                                    if (!profile.addresses.length) {
                                        profile.addresses.push({
                                            label: "HOME", name: deliveryAddress.name, mobile: deliveryAddress.mobile,
                                            line: deliveryAddress.line, city: deliveryAddress.city, state: deliveryAddress.state,
                                            pincode: deliveryAddress.pincode, default: true
                                        });
                                        saveProfile();
                                    }
                                }
                            }, 0);
                        }, false);
                    }
                }, 0);

                window.addEventListener("storage", function (event) {
                    if (event.key === CART_KEY) {
                        try {
                            const savedCart = JSON.parse(event.newValue || "[]");
                            cart = Array.isArray(savedCart) ? savedCart : [];
                        } catch (error) { cart = []; }
                        updateCartCount();
                        renderCart();
                    }
                    if (event.key === WISHLIST_KEY) {
                        try {
                            const savedWishlist = JSON.parse(event.newValue || "[]");
                            wishlist = Array.isArray(savedWishlist) ? savedWishlist : [];
                        } catch (error) { wishlist = []; }
                        updateWishlistCount();
                        renderWishlist();
                        updateWishlistButtons();
                    }
                });
            })();

            /* =========================================================
               DECOREVA — LIKE + RATING + REVIEWS
               SAFE ADD-ON
               - Reviews + ratings use Supabase
               - Likes remain on the existing localStorage system for now
               - No changes to cart/wishlist/variation/slider logic
               - Uses one-time initialization + delegated clicks
               ========================================================= */
            (function () {
                "use strict";

                const DECOREVA_LIKES_KEY = "decoreva_likes_v1";
                const supabaseClient = window.decorevaSupabase || null;

                let ratings = {};
                let likes = {};
                let reviewsLoaded = false;
                let reviewsLoadingPromise = null;
                let supabaseLikesLoaded = false;
                let supabaseLikedKeys = {};

                try {
                    const saved = JSON.parse(localStorage.getItem(DECOREVA_LIKES_KEY) || "{}");
                    likes = saved && typeof saved === "object" ? saved : {};
                } catch (error) {
                    likes = {};
                }

                function saveLikes() {
                    localStorage.setItem(DECOREVA_LIKES_KEY, JSON.stringify(likes));
                }

                function getCardKey(card) {
                    if (!card) return "";

                    if (card.dataset.variationProduct) {
                        return "variation:" + card.dataset.variationProduct;
                    }

                    const title = card.querySelector("h3");
                    if (title) {
                        return "product:" + title.textContent.trim().toLowerCase();
                    }

                    return "";
                }

                function getRecord(key) {
                    if (!ratings[key] || typeof ratings[key] !== "object") {
                        ratings[key] = { reviews: [] };
                    }

                    if (!Array.isArray(ratings[key].reviews)) {
                        ratings[key].reviews = [];
                    }

                    return ratings[key];
                }

                function getAverage(record) {
                    if (!record.reviews.length) return 0;

                    return record.reviews.reduce(function (total, review) {
                        return total + Number(review.rating || 0);
                    }, 0) / record.reviews.length;
                }

                function starText(value) {
                    const rounded = Math.round(Number(value) || 0);
                    let output = "";

                    for (let i = 1; i <= 5; i++) {
                        output += i <= rounded ? "★" : "☆";
                    }

                    return output;
                }

                async function loadSupabaseReviews() {
                    if (!supabaseClient) {
                        console.warn("DECOREVA: Supabase client not available for reviews.");
                        return;
                    }

                    if (reviewsLoaded) return;
                    if (reviewsLoadingPromise) return reviewsLoadingPromise;

                    reviewsLoadingPromise = (async function () {
                        try {
                            const result = await supabaseClient
                                .from("product_reviews")
                                .select("id, product_key, user_id, rating, review_text, created_at")
                                .order("created_at", { ascending: true });

                            if (result.error) {
                                console.error("DECOREVA reviews load error:", result.error);
                                return;
                            }

                            ratings = {};

                            (result.data || []).forEach(function (review) {
                                if (!review || !review.product_key) return;

                                getRecord(review.product_key).reviews.push({
                                    id: review.id,
                                    user_id: review.user_id,
                                    rating: Number(review.rating || 0),
                                    text: review.review_text || "",
                                    date: review.created_at || ""
                                });
                            });

                            reviewsLoaded = true;
                            updateAllRatingRows();
                        } catch (error) {
                            console.error("DECOREVA reviews load exception:", error);
                        } finally {
                            reviewsLoadingPromise = null;
                        }
                    })();

                    return reviewsLoadingPromise;
                }

                function createRatingRow(card) {
                    if (!card || card.querySelector(":scope > .decoreva-rating-row")) return;

                    const key = getCardKey(card);
                    if (!key) return;

                    const row = document.createElement("div");
                    row.className = "decoreva-rating-row";
                    row.dataset.ratingKey = key;

                    const likeButton = document.createElement("button");
                    likeButton.type = "button";
                    likeButton.className = "decoreva-like-button";
                    likeButton.dataset.ratingAction = "like";
                    likeButton.setAttribute("aria-label", "Like product");
                    likeButton.setAttribute("aria-pressed", "false");

                    const ratingButton = document.createElement("button");
                    ratingButton.type = "button";
                    ratingButton.className = "decoreva-rating-button";
                    ratingButton.dataset.ratingAction = "review";
                    ratingButton.setAttribute("aria-label", "Open ratings and reviews");

                    const stars = document.createElement("span");
                    stars.className = "decoreva-rating-stars";

                    const ratingLabel = document.createElement("span");
                    ratingLabel.className = "decoreva-rating-text";

                    ratingButton.appendChild(stars);
                    ratingButton.appendChild(ratingLabel);
                    row.appendChild(likeButton);
                    row.appendChild(ratingButton);

                    card.appendChild(row);
                    updateRatingRow(card);
                }

                function updateRatingRow(card) {
                    if (!card) return;

                    const row = card.querySelector(":scope > .decoreva-rating-row");
                    if (!row) return;

                    const key = getCardKey(card);
                    if (!key) return;

                    const record = getRecord(key);
                    const average = getAverage(record);
                    const reviewCount = record.reviews.length;
                    const likeCount = Number(likes[key] || 0);

                    const likeButton = row.querySelector(".decoreva-like-button");
                    const ratingButton = row.querySelector(".decoreva-rating-button");
                    const stars = row.querySelector(".decoreva-rating-stars");
                    const ratingLabel = row.querySelector(".decoreva-rating-text");

                    if (likeButton) {
                        const liked = supabaseLikesLoaded
                            ? !!supabaseLikedKeys[key]
                            : row.dataset.liked === "1";
                        row.dataset.liked = liked ? "1" : "";
                        likeButton.innerHTML =
                            (liked ? "♥" : "♡") +
                            ' <span>Like</span> <b>' +
                            likeCount +
                            "</b>";
                        likeButton.classList.toggle("active", liked);
                        likeButton.setAttribute("aria-pressed", liked ? "true" : "false");
                    }

                    if (stars) {
                        stars.textContent = starText(average);
                    }

                    if (ratingLabel) {
                        ratingLabel.textContent = reviewCount
                            ? average.toFixed(1) + " (" + reviewCount + ")"
                            : "New (0)";
                    }

                    if (ratingButton) {
                        ratingButton.setAttribute(
                            "aria-label",
                            reviewCount
                                ? "View " + reviewCount + " reviews"
                                : "Write the first review"
                        );
                    }
                }

                function updateAllRatingRows() {
                    document.querySelectorAll(
                        "#collection-products .card, .featured-slider .featured-slide"
                    ).forEach(function (card) {
                        createRatingRow(card);
                        updateRatingRow(card);
                    });
                }

                function initializeRatingRows() {
                    updateAllRatingRows();
                    loadSupabaseReviews();
                    loadSupabaseLikes(false);
                }

                async function getCurrentUser() {
                    if (!supabaseClient || !supabaseClient.auth) return null;

                    try {
                        const result = await supabaseClient.auth.getUser();
                        return result && result.data ? result.data.user : null;
                    } catch (error) {
                        console.error("DECOREVA auth check error:", error);
                        return null;
                    }
                }

                async function loadSupabaseLikes(force) {
                    if (!supabaseClient) return false;
                    if (supabaseLikesLoaded && !force) return true;

                    try {
                        const result = await supabaseClient
                            .from("product_likes")
                            .select("product_key, user_id");

                        if (result.error) {
                            console.error("DECOREVA likes load error:", result.error);
                            return false;
                        }

                        const counts = {};
                        const likedKeys = {};
                        const user = await getCurrentUser();

                        (result.data || []).forEach(function (like) {
                            if (!like || !like.product_key) return;
                            counts[like.product_key] = Number(counts[like.product_key] || 0) + 1;
                            if (user && like.user_id === user.id) {
                                likedKeys[like.product_key] = true;
                            }
                        });

                        likes = counts;
                        supabaseLikedKeys = likedKeys;
                        supabaseLikesLoaded = true;
                        updateAllRatingRows();
                        return true;
                    } catch (error) {
                        console.error("DECOREVA likes load exception:", error);
                        return false;
                    }
                }

                async function openReviewModal(card) {
                    const key = getCardKey(card);
                    if (!key) return;

                    await loadSupabaseReviews();

                    const title = card.querySelector("h3");
                    const productName = title
                        ? title.textContent.trim()
                        : "DECOREVA Product";

                    const record = getRecord(key);
                    let modal = document.querySelector("#decoreva-review-modal");

                    if (!modal) {
                        modal = document.createElement("div");
                        modal.id = "decoreva-review-modal";
                        modal.className = "decoreva-review-modal";
                        modal.setAttribute("aria-hidden", "true");

                        modal.innerHTML =
                            '<div class="decoreva-review-overlay" data-review-close></div>' +
                            '<div class="decoreva-review-card" role="dialog" aria-modal="true" aria-label="Ratings and Reviews">' +
                                '<div class="decoreva-review-head">' +
                                    '<div>' +
                                        '<strong>Ratings & Reviews</strong>' +
                                        '<span class="decoreva-review-product"></span>' +
                                    '</div>' +
                                    '<button type="button" class="decoreva-review-close" data-review-close aria-label="Close">×</button>' +
                                '</div>' +
                                '<div class="decoreva-review-summary"></div>' +
                                '<div class="decoreva-review-list"></div>' +
                                '<form class="decoreva-review-form">' +
                                    '<strong>Write a Review</strong>' +
                                    '<div class="decoreva-review-stars-input" aria-label="Choose rating"></div>' +
                                    '<input class="decoreva-review-name" type="text" maxlength="40" placeholder="Your name" required>' +
                                    '<textarea class="decoreva-review-text" maxlength="500" placeholder="Write your review" required></textarea>' +
                                    '<button type="submit" class="decoreva-review-submit">Submit Review</button>' +
                                '</form>' +
                            '</div>';

                        document.body.appendChild(modal);
                    }

                    modal.dataset.ratingKey = key;
                    modal.dataset.ratingCardKey = key;
                    modal.querySelector(".decoreva-review-product").textContent = productName;

                    const average = getAverage(record);
                    const count = record.reviews.length;

                    modal.querySelector(".decoreva-review-summary").textContent =
                        count
                            ? starText(average) + "  " + average.toFixed(1) + " · " +
                              count + " review" + (count === 1 ? "" : "s")
                            : "No reviews yet — be the first to review this product.";

                    const list = modal.querySelector(".decoreva-review-list");
                    list.replaceChildren();

                    if (!count) {
                        const empty = document.createElement("div");
                        empty.className = "decoreva-review-empty";
                        empty.textContent = "No reviews yet.";
                        list.appendChild(empty);
                    } else {
                        record.reviews.slice().reverse().forEach(function (review) {
                            const item = document.createElement("div");
                            item.className = "decoreva-review-item";

                            const top = document.createElement("div");
                            top.className = "decoreva-review-item-top";

                            const name = document.createElement("strong");
                            name.textContent = "Customer";

                            const stars = document.createElement("span");
                            stars.textContent = starText(review.rating);

                            const text = document.createElement("p");
                            text.textContent = review.text || "";

                            top.appendChild(name);
                            top.appendChild(stars);
                            item.appendChild(top);
                            item.appendChild(text);
                            list.appendChild(item);
                        });
                    }

                    const user = await getCurrentUser();
                    const form = modal.querySelector(".decoreva-review-form");
                    const nameInput = form.querySelector(".decoreva-review-name");
                    const textInput = form.querySelector(".decoreva-review-text");
                    const submitButton = form.querySelector(".decoreva-review-submit");

                    if (!user) {
                        nameInput.value = "";
                        nameInput.disabled = true;
                        textInput.value = "";
                        textInput.disabled = true;
                        submitButton.disabled = true;
                        submitButton.textContent = "Login to Review";
                    } else {
                        nameInput.disabled = false;
                        textInput.disabled = false;
                        submitButton.disabled = false;
                        submitButton.textContent = "Submit Review";

                        try {
                            const metadata = user.user_metadata || {};
                            nameInput.value = String(metadata.full_name || "");
                        } catch (error) {
                            nameInput.value = "";
                        }
                    }

                    const starsInput = modal.querySelector(".decoreva-review-stars-input");
                    starsInput.replaceChildren();
                    let selectedRating = 0;

                    for (let i = 1; i <= 5; i++) {
                        const button = document.createElement("button");
                        button.type = "button";
                        button.className = "decoreva-review-star-choice";
                        button.textContent = "★";
                        button.dataset.value = String(i);
                        button.setAttribute("aria-label", i + " star");
                        button.disabled = !user;

                        button.addEventListener("click", function () {
                            selectedRating = i;

                            starsInput.querySelectorAll("button").forEach(function (item, index) {
                                item.classList.toggle("active", index < selectedRating);
                            });
                        });

                        starsInput.appendChild(button);
                    }

                    form.onsubmit = async function (event) {
                        event.preventDefault();

                        const currentUser = await getCurrentUser();
                        if (!currentUser) {
                            alert("Please login to submit a review.");
                            return;
                        }

                        const name = nameInput.value.trim();
                        const text = textInput.value.trim();

                        if (!selectedRating) {
                            alert("Please select a star rating.");
                            return;
                        }

                        if (!name || !text) {
                            alert("Please enter your name and review.");
                            return;
                        }

                        if (!supabaseClient) {
                            alert("Review service is temporarily unavailable. Please try again.");
                            return;
                        }

                        submitButton.disabled = true;
                        submitButton.textContent = "Submitting...";

                        try {
                            const result = await supabaseClient
                                .from("product_reviews")
                                .insert({
                                    product_key: key,
                                    user_id: currentUser.id,
                                    rating: selectedRating,
                                    review_text: text
                                })
                                .select("id, product_key, user_id, rating, review_text, created_at")
                                .single();

                            if (result.error) {
                                console.error("DECOREVA review insert error:", result.error);
                                alert("Could not submit your review. Please try again.");
                                return;
                            }

                            const newReview = result.data;
                            getRecord(key).reviews.push({
                                id: newReview.id,
                                user_id: newReview.user_id,
                                rating: Number(newReview.rating || 0),
                                text: newReview.review_text || "",
                                date: newReview.created_at || ""
                            });

                            reviewsLoaded = true;
                            updateAllRatingRows();
                            nameInput.value = String(currentUser.user_metadata?.full_name || name);
                            textInput.value = "";
                            selectedRating = 0;
                            starsInput.querySelectorAll("button").forEach(function (item) {
                                item.classList.remove("active");
                            });

                            await openReviewModal(card);
                        } catch (error) {
                            console.error("DECOREVA review submit exception:", error);
                            alert("Could not submit your review. Please try again.");
                        } finally {
                            submitButton.disabled = false;
                            submitButton.textContent = "Submit Review";
                        }
                    };

                    modal.classList.add("open");
                    modal.setAttribute("aria-hidden", "false");
                    document.documentElement.style.overflow = "hidden";
                    document.body.style.overflow = "hidden";
                }

                function closeReviewModal() {
                    const modal = document.querySelector("#decoreva-review-modal");
                    if (!modal) return;

                    modal.classList.remove("open");
                    modal.setAttribute("aria-hidden", "true");

                    if (!document.body.classList.contains("decoreva-cart-open")) {
                        document.documentElement.style.overflow = "";
                        document.body.style.overflow = "";
                    }
                }

                document.addEventListener("click", async function (event) {
                    const likeButton = event.target.closest(".decoreva-like-button");

                    if (likeButton) {
                        event.preventDefault();
                        event.stopPropagation();

                        const card = likeButton.closest(".card, .featured-slide");
                        const row = likeButton.closest(".decoreva-rating-row");
                        const key = getCardKey(card);

                        if (!card || !row || !key) return;

                        const currentUser = await getCurrentUser();

                        if (currentUser && supabaseClient) {
                            const loaded = await loadSupabaseLikes(true);
                            if (!loaded) {
                                alert("Like service is temporarily unavailable. Please try again.");
                                return;
                            }

                            const liked = !!supabaseLikedKeys[key];

                            try {
                                if (liked) {
                                    const result = await supabaseClient
                                        .from("product_likes")
                                        .delete()
                                        .eq("user_id", currentUser.id)
                                        .eq("product_key", key);

                                    if (result.error) throw result.error;
                                    delete supabaseLikedKeys[key];
                                } else {
                                    const result = await supabaseClient
                                        .from("product_likes")
                                        .insert({
                                            product_key: key,
                                            user_id: currentUser.id
                                        });

                                    if (result.error) throw result.error;
                                    supabaseLikedKeys[key] = true;
                                }

                                await loadSupabaseLikes(true);
                            } catch (error) {
                                console.error("DECOREVA like update error:", error);
                                alert("Could not update your like. Please try again.");
                            }

                            return;
                        }

                        const liked = row.dataset.liked === "1";

                        if (liked) {
                            likes[key] = Math.max(0, Number(likes[key] || 0) - 1);
                            row.dataset.liked = "";
                        } else {
                            likes[key] = Number(likes[key] || 0) + 1;
                            row.dataset.liked = "1";
                        }

                        saveLikes();
                        updateRatingRow(card);
                        return;
                    }

                    const ratingButton = event.target.closest(".decoreva-rating-button");

                    if (ratingButton) {
                        event.preventDefault();
                        event.stopPropagation();

                        const card = ratingButton.closest(".card, .featured-slide");
                        if (card) openReviewModal(card);
                        return;
                    }

                    if (event.target.closest("[data-review-close]")) {
                        event.preventDefault();
                        event.stopPropagation();
                        closeReviewModal();
                    }
                }, true);

                document.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        closeReviewModal();
                    }
                });

                initializeRatingRows();

                /* Featured slides can be rebuilt on resize. Re-check only on resize;
                   there is deliberately NO DOM MutationObserver. */
                let resizeTimer = 0;
                window.addEventListener("resize", function () {
                    window.clearTimeout(resizeTimer);
                    resizeTimer = window.setTimeout(function () {
                        initializeRatingRows();
                    }, 180);
                });
            })();
        });


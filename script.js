/* =========================================================
       DECOREVA WALL ART
       CLEAN FINAL SCRIPT
       Featured + Collection Sliders + Lightbox + Search + Sort
       ========================================================= */

    document.addEventListener("DOMContentLoaded", function () {
        "use strict";

        /* =====================================================
           BASIC HELPERS
           ===================================================== */

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

        /* =====================================================
           REMOVE FAMILY KEYHOLDER
           ===================================================== */

        document.querySelectorAll("#collection-products .card").forEach(function (card) {
            const title = card.querySelector("h3");

            if (!title) return;

            if (title.textContent.trim().toLowerCase() === "family keyholder") {
                card.remove();
            }
        });

        /* =====================================================
           COLLECTION PRODUCT SLIDER
           ===================================================== */

        function updateDots(slider, images, currentIndex) {
            if (!slider) return;

            const container = slider.querySelector(".slider-dots");
            if (!container) return;

            container.innerHTML = "";

            images.forEach(function (_, index) {
                const dot = document.createElement("span");

                dot.className =
                    "slider-dot" +
                    (index === currentIndex ? " active" : "");

                dot.setAttribute("role", "button");
                dot.setAttribute("tabindex", "0");
                dot.setAttribute("aria-label", "View image " + (index + 1));

                dot.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    showSliderImage(slider, index);
                });

                dot.addEventListener("keydown", function (event) {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        showSliderImage(slider, index);
                    }
                });

                container.appendChild(dot);
            });
        }

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

        /* =====================================================
           PERFORMANCE — LAZY COLLECTION IMAGE LOADING
           Only images near the viewport are downloaded.
           This is the biggest mobile-speed improvement.
           ===================================================== */

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

            /* Build dots without downloading the image. */
            updateDots(slider, images, getSliderIndex(slider));

            if (sliderObserver) {
                sliderObserver.observe(slider);
            } else {
                showSliderImage(slider, getSliderIndex(slider));
            }
        });

        /* =====================================================
           LIGHTBOX
           ===================================================== */

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


        /* =====================================================
           LIGHTBOX BUTTON PRESS FEEDBACK
           Small visual press effect for mouse + touch.
           Does not change slider behaviour.
           ===================================================== */
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
      /* =====================================================
       FEATURED PRODUCT LIGHTBOX
       SAFE VERSION
       ===================================================== */

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

                /* Get product images */
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

                /* Try slide data-images */
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

                /* Fallback */
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

        /* =====================================================
           COLLECTION LIGHTBOX
           ===================================================== */

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

        /* Direct product-image lightbox fallback. */
        document
            .querySelectorAll("#collection-products .slider-image")
            .forEach(function (image) {

                image.addEventListener("click", function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    const slider =
                        image.closest(".image-slider");

                    if (!slider) return;

                    const images = getSliderImages(slider);
                    const index = getSliderIndex(slider);

                    if (!images.length) return;

                    openLightbox(images, index);
                });
            });

        /* =====================================================
           LIGHTBOX CLOSE
           ===================================================== */

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

        /* =====================================================
           LIGHTBOX NEXT
           ===================================================== */

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

        /* =====================================================
           LIGHTBOX PREVIOUS
           ===================================================== */

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

        /* =====================================================
           CLOSE LIGHTBOX OUTSIDE IMAGE
           ===================================================== */

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

        /* =====================================================
           LIGHTBOX KEYBOARD
           ===================================================== */

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

        /* =====================================================
           SEARCH
           ===================================================== */

        const productSearch =
            document.querySelector("#productSearch");

        function filterProducts() {
            if (!productSearch) return;

            const searchText =
                productSearch.value.toLowerCase().trim();

            const cards =
                document.querySelectorAll("#collection-products .card");

            /* Search mode shows matching products across all pages. */
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

            /* Empty search:
               show pagination again and return to page 1. */
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

        /* =====================================================
           VOICE SEARCH
           ===================================================== */

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

        /* =====================================================
           SORT PRODUCTS
           ===================================================== */

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
                /* Keep the original product order for Clear All. */
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

            /* Keep pagination in the same order as the sorted DOM. */
            decorevaProducts = Array.from(
                productsContainer.querySelectorAll(".card")
            );

            if (typeof decorevaShowPage === "function") {
                decorevaShowPage(1);
            }

            /* Do not force-load every product image after sorting.
               IntersectionObserver will load only images near the viewport. */
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
    /* =====================================================
       CLEAR ALL — SORT + SEARCH + PAGINATION
       ===================================================== */

    function clearAllCollectionFilters() {

        /* Clear search */
        if (productSearch) {
            productSearch.value = "";
        }

        /* Restore original product order */
        if (productsContainer && originalProductOrder.length) {
            originalProductOrder.forEach(function (card) {
                productsContainer.appendChild(card);
            });
        }

        /* Reset Sort Products label */
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

        /* Remove active sort option */
        sortOptions.forEach(function (item) {
            item.classList.remove("active");
        });

        if (customSort) {
            customSort.classList.remove("open");
        }

        /* Return to normal Collection page 1 */
        if (typeof decorevaShowPage === "function") {
            decorevaShowPage(1);
        }

        /* Scroll to Collection */
        requestAnimationFrame(function () {
            scrollToCollectionTitle("smooth");
        });
    }


    /* =====================================================
       CLEAR ALL BUTTON
       ===================================================== */

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
        /* =====================================================
           FEATURED PRODUCTS SLIDER
           ===================================================== */

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

            /* =================================================
               FEATURED MOBILE SWIPE
               ================================================= */

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

            /* =================================================
               RESPONSIVE FEATURED REBUILD
               ================================================= */

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

        /* Collection scroll helper */
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
        
        
        /* =====================================================
           MOBILE MENU
           ===================================================== */

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

        /* =====================================================
           NAVIGATION — SINGLE SAFE HANDLER
           Prevent duplicate Collection/Home handlers.
           ===================================================== */

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

                        /* Restore pagination when Collection is opened from navigation. */
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

                        /* Keep pagination visible/stateful while returning Home. */
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

                        /* Do not hide Collection pagination when opening Contact/About. */
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

        /* =====================================================
           HOME
           ===================================================== */

        document
            .querySelectorAll(
                'a[href="#home"]'
            )
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

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

        /* =====================================================
           SEARCH BOX
           ===================================================== */

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

        /* =====================================================
           SLIDER BUTTON SAFETY
           ===================================================== */

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

        /* =====================================================
           PREVENT IMAGE DRAG
           ===================================================== */

        document
            .querySelectorAll("img")
            .forEach(function (image) {

                image.setAttribute(
                    "draggable",
                    "false"
                );
            });

        /* =====================================================
           FINAL COLLECTION SLIDER INITIALIZATION
           ===================================================== */

        document
            .querySelectorAll(
                "#collection-products .image-slider"
            )
            .forEach(function (slider) {

                const images =
                    getSliderImages(slider);

                if (images.length) {

                    showSliderImage(
                        slider,
                        getSliderIndex(slider)
                    );
                }
            });

        /* =====================================================
           ESC CLOSE SORT MENU
           ===================================================== */

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

        /* =====================================================
           CLEANUP
           ===================================================== */

        window.addEventListener(
            "beforeunload",
            function () {

                clearInterval(
                    featuredTimer
                );
            }
        );
    /* =====================================================
       DECOREVA PREMIUM 4-PAGE PAGINATION
       20 + 20 + 20 + 8 PRODUCTS
       ===================================================== */

    let decorevaProducts = Array.from(
        document.querySelectorAll("#collection-products .card")
    );

    const decorevaPerPage = 20;
    const decorevaTotalPages = Math.max(
        1,
        Math.ceil(decorevaProducts.length / decorevaPerPage)
    );

    let decorevaCurrentPage = 1;


    /* ---------- PAGINATION STYLE ---------- */

    function decorevaPaginationStyle(nav) {

        nav.style.display = "flex";
        nav.style.justifyContent = "center";
        nav.style.alignItems = "center";
        nav.style.gap = "22px";
        nav.style.margin = "28px 0";
        nav.style.padding = "8px 0";
        nav.style.fontFamily = "inherit";
    }


    /* ---------- CREATE PAGINATION ---------- */

    function createDecorevaPagination() {

        const nav = document.createElement("div");

        nav.className = "decoreva-pagination";

        decorevaPaginationStyle(nav);


        /* PREVIOUS ARROW */

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


        /* PAGE NUMBERS */

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


        /* NEXT ARROW */

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


    /* ---------- LOAD VISIBLE COLLECTION SLIDERS ---------- */

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


    /* ---------- SHOW PAGE ---------- */

    function decorevaShowPage(page) {
        decorevaCurrentPage = page;
        sessionStorage.setItem("decorevaPage", page);

        const aboutSection = document.querySelector("#about");
        if (aboutSection) aboutSection.style.display = "none";


        const start =
            (page - 1) * decorevaPerPage;

        const end =
            start + decorevaPerPage;


        /* SHOW ONLY CURRENT PAGE */

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


        /* Load only images that are now near the viewport. */
        if (typeof window.decorevaLoadVisibleSliders === "function") {
            window.decorevaLoadVisibleSliders();
        }

        /* Scroll to Collection top only when user changes page. */
    if (window.decorevaPageNavigation) {
        requestAnimationFrame(function () {
            scrollToCollectionTitle("auto");
        });
    }

        /* UPDATE PAGINATION */

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


                    /* PAGE NUMBERS */

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


                    /* FIRST BUTTON = PREVIOUS */

                    const previousButton =
                        buttons[0];


                    /* LAST BUTTON = NEXT */

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

        /* ---------- END decorevaShowPage ---------- */


    /* ---------- ADD ABOVE + BELOW ---------- */

    const decorevaGrid =
        document.querySelector(
            "#collection-products"
        );

    if (
        decorevaGrid &&
        decorevaProducts.length > 0
    ) {

        /* Remove any old pagination bars first. */
        decorevaGrid.parentNode
            .querySelectorAll(".decoreva-pagination")
            .forEach(function (nav) {
                nav.remove();
            });

        const paginationAbove =
            createDecorevaPagination();

        const paginationBelow =
            createDecorevaPagination();

        /* ABOVE PRODUCTS */
        decorevaGrid.parentNode.insertBefore(
            paginationAbove,
            decorevaGrid
        );

        /* BELOW PRODUCTS */
        decorevaGrid.insertAdjacentElement(
            "afterend",
            paginationBelow
        );

        /* RESTORE LAST COLLECTION PAGE */
        const savedPage =
            Number(sessionStorage.getItem("decorevaPage")) || 1;
        decorevaShowPage(savedPage);
    }


        /* =====================================================
           DECOREVA — REUSABLE PRODUCT VARIATION SYSTEM
           4-variation cards: Sherawali 2, Sherawali 3, Ganesha 2, Hanuman 2, Krishna 1
           ===================================================== */

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

        /* =====================================================
           REUSABLE VARIATION SYSTEM
           Same structure for every variation card.
           ===================================================== */

        document.querySelectorAll(".decoreva-variation-card").forEach(function (card) {
            card.classList.add("sherawali-variation-card");

            const options = card.querySelector(".variation-options");
            if (options) options.classList.add("sherawali-variations");

            card.querySelectorAll(".variation-button").forEach(function (button) {
                button.classList.add("sherawali-variation");
            });

            const actions = card.querySelector(".variation-actions");
            if (actions) actions.classList.add("sherawali-actions");

            const amazon = card.querySelector(".variation-amazon-button");
            if (amazon) amazon.classList.add("sherawali-amazon-button");

            const whatsapp = card.querySelector(".variation-whatsapp-button");
            if (whatsapp) whatsapp.classList.add("sherawali-whatsapp-button");
        });

        document.querySelectorAll(".decoreva-variation-card").forEach(function (card) {
            const product = decorevaVariationProducts[card.dataset.variationProduct];
            if (!product) return;

            const slider = card.querySelector(".image-slider");
            const image = card.querySelector(".slider-image");
            const price = card.querySelector(".price");
            const size = card.querySelector(".size");
            const amazon = card.querySelector(".variation-amazon-button, .sherawali-amazon-button");
            const whatsapp = card.querySelector(".variation-whatsapp-button, .sherawali-whatsapp-button");
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
                        encodeURIComponent("Hello DECOREVA, I want to buy " + variation.whatsapp);
                }

                buttons.forEach(function (button) {
                    button.classList.toggle("active", button.dataset.variation === key);
                });

                updateDots(slider, variation.images, 0);
            }

            card._decorevaApplyVariation = applyVariation;
            applyVariation(product.defaultVariation);
        });

        /* One reusable capture handler for every variation button. */
        const variationContainer = document.querySelector("#collection-products");

        if (variationContainer) {
            variationContainer.addEventListener("click", function (event) {
                const button = event.target.closest(".variation-button, .sherawali-variation");
                if (!button || !variationContainer.contains(button)) return;

                const card = button.closest(".decoreva-variation-card");
                if (!card || typeof card._decorevaApplyVariation !== "function") return;

                event.preventDefault();
                event.stopPropagation();
                card._decorevaApplyVariation(button.dataset.variation);
            }, true);
        }

    });
    

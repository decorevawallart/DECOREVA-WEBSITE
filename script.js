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
                    rootMargin: "650px 0px",
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
            window.decorevaFestivalMode = false;

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

                card.style.display =
                    name.includes(searchText) ? "" : "none";
            });

            if (typeof window.decorevaLoadVisibleSliders === "function") {
                window.decorevaLoadVisibleSliders();
            }

            return;
        }

        /* Empty search returns to page 1. */
        if (typeof window.resetFestivalProducts === "function") {
            window.resetFestivalProducts();
        } else if (typeof decorevaShowPage === "function") {
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
                        location.reload();
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

    /* =====================================================
   FESTIVAL COLLECTION
   DYNAMIC PRODUCT FILTER
   ===================================================== */

window.decorevaFestivalMode = false;

/* =====================================================
   FESTIVAL BACK TO MAIN COLLECTION BUTTON
   ===================================================== */
function ensureFestivalBackButton() {

    const grid = document.querySelector("#collection-products");
    if (!grid) return null;

    let button = document.querySelector("#festival-back-main");

    if (button) return button;

    button = document.createElement("button");
    button.type = "button";
    button.id = "festival-back-main";
    button.className = "festival-back-main festival-back-visible";
    button.innerHTML = "<span aria-hidden=\"true\">←</span> Back to Main Collection";

    button.addEventListener("click", function () {
        window.resetFestivalProducts();
    });

    grid.parentNode.insertBefore(button, grid);
    return button;
}

function removeFestivalBackButton() {
    const button = document.querySelector("#festival-back-main");

    if (button) {
        button.remove();
    }
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

window.showFestivalProducts = function (festival) {

    const products = Array.from(
        document.querySelectorAll("#collection-products .card")
    );

    if (!products.length) return;

    window.decorevaFestivalMode = true;

    /* Hide normal pagination */
    document
        .querySelectorAll(".decoreva-pagination")
        .forEach(function (nav) {
            nav.style.display = "none";
        });

    /* Clear search */
    const searchInput =
        document.querySelector("#productSearch");

    if (searchInput) {
        searchInput.value = "";
    }

    products.forEach(function (card) {

        const title = card.querySelector("h3");

        if (!title) {
            card.style.display = "none";
            return;
        }

        const name =
            title.textContent
                .trim()
                .toLowerCase();

        let matched = false;


        /* =========================================
           ONAM
           ALL WALL ART PRODUCTS
           EXCEPT KEYHOLDERS
           ========================================= */

        if (festival === "onam") {

            matched =
                !name.includes("keyholder") &&
                !name.includes("key holder");
        }


        /* =========================================
           RAKSHA BANDHAN
           ALL KEYHOLDERS
           ========================================= */

        else if (festival === "raksha") {

            matched =
                name.includes("keyholder") ||
                name.includes("key holder");
        }


        /* =========================================
           JANMASHTAMI
           ALL KRISHNA PRODUCTS
           ========================================= */

        else if (festival === "janmashtami") {

            matched =
                name.includes("krishna");
        }


        /* =========================================
           GANESH CHATURTHI
           ALL GANESHA PRODUCTS
           ========================================= */

        else if (festival === "ganesh") {

            matched =
                name.includes("ganesha");
        }


        card.style.display =
            matched ? "" : "none";
    });


    /* Add a clear way back to the normal Collection. */
    const backButton = ensureFestivalBackButton();

    /* Scroll to the filtered products. The back button stays immediately above them. */
    const section = document.querySelector("#collection-products");

    if (section) {
        setTimeout(function () {
            const target = backButton || section;
            const offset = window.innerWidth <= 760 ? 64 : 82;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: Math.max(0, top),
                behavior: "smooth"
            });
        }, 100);
    }
};


/* =====================================================
   RESET FESTIVAL FILTER
   ===================================================== */

window.resetFestivalProducts = function () {

    window.decorevaFestivalMode = false;
    removeFestivalBackButton();

    const products = Array.from(
        document.querySelectorAll(
            "#collection-products .card"
        )
    );

    products.forEach(function (card) {
        card.style.display = "";
    });


    document
        .querySelectorAll(".decoreva-pagination")
        .forEach(function (nav) {
            nav.style.display = "flex";
        });


    if (typeof decorevaShowPage === "function") {
        decorevaShowPage(1);
    }
};

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
       NAVIGATION
       ===================================================== */

    document
        .querySelectorAll(
            '#main-nav a[href^="#"]'
        )
        .forEach(function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    const id =
                        link.getAttribute("href");

                    if (!id || id === "#") {
                        return;
                    }

                    const target =
                        document.querySelector(id);

                    if (!target) return;

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    history.replaceState(
                        null,
                        "",
                        id
                    );
                }
            );
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

    if (searchContainer) {

        searchContainer.style.width = "100%";
        searchContainer.style.maxWidth = "520px";
        searchContainer.style.margin = "0 auto 30px";
        searchContainer.style.position = "relative";
    }

    if (searchBox) {

        searchBox.style.position = "relative";
        searchBox.style.width = "100%";
    }

    if (productSearch) {

        productSearch.style.width = "100%";
        productSearch.style.height = "54px";
        productSearch.style.paddingRight = "55px";
        productSearch.style.boxSizing = "border-box";
        productSearch.style.borderRadius = "28px";
        productSearch.style.outline = "none";
    }

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

const decorevaProducts = Array.from(
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
        function () {

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
            function () {

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
        function () {

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
            rect.bottom >= -650 &&
            rect.top <= window.innerHeight + 650
        ) {
            showSliderImage(slider, getSliderIndex(slider));
        }
    });
};


/* ---------- SHOW PAGE ---------- */

function decorevaShowPage(page) {
    if (window.decorevaFestivalMode) {
        return;
    }
    decorevaCurrentPage = page;


    const start =
        (page - 1) * decorevaPerPage;

    const end =
        start + decorevaPerPage;


    /* SHOW ONLY CURRENT PAGE */

    decorevaProducts.forEach(
        function (card, index) {

            card.style.display =
                index >= start && index < end
                    ? ""
                    : "none";

        }
    );


    /* Load only images that are now near the viewport. */
    if (typeof window.decorevaLoadVisibleSliders === "function") {
        window.decorevaLoadVisibleSliders();
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


/* ---------- ADD ABOVE + BELOW ---------- */

const decorevaGrid =
    document.querySelector(
        "#collection-products"
    );


if (
    decorevaGrid &&
    decorevaProducts.length > 0
) {

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


    /* START PAGE 1 */

    decorevaShowPage(1);
}

}

});
/* =====================================================
   COLLECTION NAVIGATION — ALWAYS OPEN COLLECTION TOP
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const collectionLink = Array.from(
        document.querySelectorAll("#main-nav a")
    ).find(function (link) {
        return link.textContent.trim() === "Collection";
    });

    if (!collectionLink) return;

    collectionLink.addEventListener("click", function (event) {
        event.preventDefault();

        window.decorevaFestivalMode = false;

        const searchInput =
            document.querySelector("#productSearch");

        if (searchInput) {
            searchInput.value = "";
        }

        document
            .querySelectorAll(".decoreva-pagination")
            .forEach(function (nav) {
                nav.style.display = "flex";
            });

        if (typeof window.resetFestivalProducts === "function") {
            window.resetFestivalProducts();
        } else if (typeof decorevaShowPage === "function") {
            decorevaShowPage(1);
        }

        scrollToCollectionTitle("smooth");

        history.replaceState(
            null,
            "",
            window.location.pathname + "#collection-title"
        );
    });

});


/* =====================================================
   INITIAL LOAD — ALWAYS OPEN FROM TOP
   Prevent browser refresh / hard-refresh scroll restoration.
   ===================================================== */

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

function decorevaForceTop() {
    if (window.location.hash) {
        history.replaceState(
            null,
            "",
            window.location.pathname
        );
    }

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });
}

window.addEventListener("pageshow", function (event) {
    if (event.persisted) return;

    decorevaForceTop();
    setTimeout(decorevaForceTop, 50);
    setTimeout(decorevaForceTop, 250);
    setTimeout(decorevaForceTop, 600);
});

window.addEventListener("load", function () {
    decorevaForceTop();
    setTimeout(decorevaForceTop, 50);
    setTimeout(decorevaForceTop, 250);
    setTimeout(decorevaForceTop, 600);
});
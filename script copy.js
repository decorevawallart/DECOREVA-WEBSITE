/* =========================================================
   DECOREVA WALL ART — CLEAN SCRIPT.JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =====================================================
       PRODUCT IMAGE SLIDERS
       ===================================================== */

    function getSliderImages(slider) {
        if (!slider) return [];

        try {
            return JSON.parse(slider.dataset.images || "[]");
        } catch (e) {
            console.error("DECOREVA slider data error:", e);
            return [];
        }
    }

    function getSliderIndex(slider) {
        const value = parseInt(slider?.dataset.index || "0", 10);
        return Number.isNaN(value) ? 0 : value;
    }

    function updateDots(slider, images, index) {
        const dots = slider?.querySelector(".slider-dots");
        if (!dots) return;

        dots.innerHTML = "";

        images.forEach(function (_, i) {
            const dot = document.createElement("span");

            dot.className = "slider-dot" + (
                i === index ? " active" : ""
            );

            dot.setAttribute("role", "button");
            dot.setAttribute(
                "aria-label",
                "View image " + (i + 1)
            );

            dot.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                showSliderImage(slider, i);
            });

            dots.appendChild(dot);
        });
    }

    function showSliderImage(slider, index) {
        if (!slider) return;

        const images = getSliderImages(slider);
        const image = slider.querySelector(".slider-image");

        if (!images.length || !image) return;

        index = ((index % images.length) + images.length) % images.length;

        slider.dataset.index = index;
        image.src = images[index];

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

    document.querySelectorAll(".image-slider").forEach(function (slider) {
        const images = getSliderImages(slider);

        if (images.length) {
            showSliderImage(
                slider,
                getSliderIndex(slider)
            );
        }
    });


    /* =====================================================
       LIGHTBOX
       ===================================================== */

    const lightbox = document.querySelector(".lightbox");
    const lightboxImg = document.querySelector("#lightbox-img");
    const lightboxClose = document.querySelector(".lightbox .close");
    const lightboxPrev = document.querySelector(".lightbox-prev");
    const lightboxNext = document.querySelector(".lightbox-next");

    let lightboxImages = [];
    let lightboxIndex = 0;

    function openLightbox(images, index) {
        if (!lightbox || !lightboxImg || !images.length) return;

        lightboxImages = images;
        lightboxIndex = index || 0;

        lightboxImg.src = lightboxImages[lightboxIndex];

        lightbox.classList.add("active");
        document.body.classList.add("lightbox-open");
    }

    function closeLightbox() {
        if (!lightbox) return;

        lightbox.classList.remove("active");
        document.body.classList.remove("lightbox-open");
    }

    function showLightboxImage(index) {
        if (!lightboxImages.length || !lightboxImg) return;

        index = (
            (index % lightboxImages.length) +
            lightboxImages.length
        ) % lightboxImages.length;

        lightboxIndex = index;
        lightboxImg.src = lightboxImages[index];
    }

    document.querySelectorAll(
        ".products .slider-image"
    ).forEach(function (image) {

        image.addEventListener("click", function () {

            const slider = image.closest(".image-slider");
            if (!slider) return;

            const images = getSliderImages(slider);

            openLightbox(
                images,
                getSliderIndex(slider)
            );
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeLightbox();
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            showLightboxImage(lightboxIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            showLightboxImage(lightboxIndex + 1);
        });
    }

    if (lightbox) {
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener("keydown", function (e) {

        if (
            !lightbox ||
            !lightbox.classList.contains("active")
        ) {
            return;
        }

        if (e.key === "Escape") {
            closeLightbox();
        }

        if (e.key === "ArrowLeft") {
            showLightboxImage(lightboxIndex - 1);
        }

        if (e.key === "ArrowRight") {
            showLightboxImage(lightboxIndex + 1);
        }
    });


    /* =====================================================
       SEARCH
       ===================================================== */

    const productSearch =
        document.querySelector("#productSearch");

    function filterProducts() {

        const value =
            productSearch?.value
                .toLowerCase()
                .trim() || "";

        document.querySelectorAll(
            ".products .card"
        ).forEach(function (card) {

            const title = card.querySelector("h3");

            if (!title) return;

            const name =
                title.textContent
                    .toLowerCase();

            card.style.display =
                !value || name.includes(value)
                    ? ""
                    : "none";
        });
    }

    if (productSearch) {
        productSearch.addEventListener(
            "input",
            filterProducts
        );
    }


    /* =====================================================
       PRODUCT SORTING
       ===================================================== */

    const productsContainer =
        document.querySelector(".products");

    const sortSelect =
        document.querySelector("#productSort");

    const customSort =
        document.querySelector(".custom-sort");

    const customSortButton =
        document.querySelector(".custom-sort-button");

    const sortOptions =
        customSort
            ? customSort.querySelectorAll("[data-value]")
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
            price.textContent.replace(/[^\d.]/g, "")
        ) || 0;
    }

    function getName(card) {
        const title = card.querySelector("h3");

        return title
            ? title.textContent.trim().toLowerCase()
            : "";
    }

    function sortProducts(value) {

        if (!productsContainer) return;

        const cards = getCards();

        cards.sort(function (a, b) {

            if (value === "price-low") {
                return getPrice(a) - getPrice(b);
            }

            if (value === "price-high") {
                return getPrice(b) - getPrice(a);
            }

            if (value === "name-az") {
                return getName(a).localeCompare(getName(b));
            }

            if (value === "name-za") {
                return getName(b).localeCompare(getName(a));
            }

            return 0;
        });

        cards.forEach(function (card) {
            productsContainer.appendChild(card);
        });
    }

    function updateSortLabel(value) {

        const option = Array.from(sortOptions)
            .find(function (item) {
                return item.dataset.value === value;
            });

        const label =
            customSortButton?.querySelector(".sort-label");

        if (label && option) {
            label.textContent =
                option.textContent.trim();
        }
    }

    if (customSortButton && customSort) {

        customSortButton.addEventListener(
            "click",
            function (e) {

                e.preventDefault();
                e.stopPropagation();

                customSort.classList.toggle("open");
            }
        );

        sortOptions.forEach(function (option) {

            option.addEventListener(
                "click",
                function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    const value =
                        option.dataset.value;

                    sortProducts(value);
                    updateSortLabel(value);

                    if (sortSelect) {
                        sortSelect.value = value;
                    }

                    customSort.classList.remove("open");
                }
            );
        });

        document.addEventListener(
            "click",
            function (e) {

                if (!customSort.contains(e.target)) {
                    customSort.classList.remove("open");
                }
            }
        );
    }


    /* =====================================================
       FEATURED PRODUCTS
       DESKTOP = 4 CARDS
       MOBILE = 4 CARDS
       ===================================================== */

    const featuredSlider =
        document.querySelector(".featured-slider");

    const featuredSlides =
        Array.from(
            document.querySelectorAll(".featured-slide")
        );

    const featuredPrev =
        document.querySelector(".featured-prev");

    const featuredNext =
        document.querySelector(".featured-next");

    const featuredDots =
        Array.from(
            document.querySelectorAll(".featured-dot")
        );

    let featuredTrack = null;
    let featuredPosition = 0;
    let featuredCloneCount = 0;
    let featuredRealIndex = 0;
    let featuredAnimating = false;
    let featuredTimer = null;
    let featuredResizeTimer = null;


    function getFeaturedVisibleCount() {

        /*
         * Keep 4 cards visible on mobile as requested.
         * CSS controls their exact size.
         */

        return 4;
    }


    function getFeaturedGap() {

        if (!featuredTrack) return 0;

        const styles =
            window.getComputedStyle(
                featuredTrack
            );

        return parseFloat(
            styles.columnGap ||
            styles.gap ||
            "12"
        ) || 12;
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


    function setFeaturedPosition(animate) {

        if (!featuredTrack) return;

        featuredTrack.style.transition =
            animate
                ? "transform .55s ease"
                : "none";

        featuredTrack.style.transform =
            "translate3d(" +
            (
                -featuredPosition *
                getFeaturedStep()
            ) +
            "px,0,0)";
    }


    function updateFeaturedDots() {

        if (!featuredDots.length) return;

        const total =
            featuredSlides.length;

        if (!total) return;

        featuredRealIndex =
            (
                (
                    featuredPosition -
                    featuredCloneCount
                ) %
                total +
                total
            ) % total;

        featuredDots.forEach(
            function (dot, index) {

                dot.classList.toggle(
                    "active",
                    index === featuredRealIndex
                );
            }
        );
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

        const visible =
            getFeaturedVisibleCount();

        if (!featuredTrack) {

            featuredTrack =
                document.createElement("div");

            featuredTrack.className =
                "featured-track";

            featuredSlides.forEach(
                function (slide) {
                    featuredTrack.appendChild(slide);
                }
            );

            featuredSlider.insertBefore(
                featuredTrack,
                featuredSlider.firstChild
            );

        } else {

            clearFeaturedClones();
        }


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


    function nextFeaturedSlide() {

        if (featuredAnimating) return;

        featuredAnimating = true;

        featuredPosition++;

        setFeaturedPosition(true);
        updateFeaturedDots();
    }


    function previousFeaturedSlide() {

        if (featuredAnimating) return;

        featuredAnimating = true;

        featuredPosition--;

        setFeaturedPosition(true);
        updateFeaturedDots();
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

        featuredPosition =
            featuredCloneCount +
            index;

        setFeaturedPosition(true);
        updateFeaturedDots();
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
            setInterval(function () {
                nextFeaturedSlide();
            }, 4500);
    }


    function restartFeaturedAutoPlay() {
        startFeaturedAutoPlay();
    }


    if (
        featuredSlider &&
        featuredSlides.length
    ) {

        buildFeaturedLoop();


        /* ===============================
           ARROWS
           =============================== */

        if (featuredPrev) {

            featuredPrev.addEventListener(
                "click",
                function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    previousFeaturedSlide();
                    restartFeaturedAutoPlay();
                }
            );
        }


        if (featuredNext) {

            featuredNext.addEventListener(
                "click",
                function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    nextFeaturedSlide();
                    restartFeaturedAutoPlay();
                }
            );
        }


        /* ===============================
           DOTS
           =============================== */

        featuredDots.forEach(
            function (dot, index) {

                dot.addEventListener(
                    "click",
                    function (e) {

                        e.preventDefault();
                        e.stopPropagation();

                        goToFeatured(index);
                        restartFeaturedAutoPlay();
                    }
                );
            }
        );


        /* ===============================
           TRANSITION END
           =============================== */

        featuredTrack.addEventListener(
            "transitionend",
            function (e) {

                if (
                    e.propertyName !==
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
                }

                updateFeaturedDots();
            }
        );


        /* ===============================
           MOUSE PAUSE
           =============================== */

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


        /* ===============================
           MOBILE SWIPE
           =============================== */

        let touchStartX = 0;
        let touchStartY = 0;

        featuredSlider.addEventListener(
            "touchstart",
            function (e) {

                const touch =
                    e.changedTouches[0];

                touchStartX =
                    touch.screenX;

                touchStartY =
                    touch.screenY;

                clearInterval(featuredTimer);
            },
            { passive: true }
        );


        featuredSlider.addEventListener(
            "touchend",
            function (e) {

                const touch =
                    e.changedTouches[0];

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
            { passive: true }
        );


        /* ===============================
           RESIZE
           =============================== */

        window.addEventListener(
            "resize",
            function () {

                clearTimeout(
                    featuredResizeTimer
                );

                featuredResizeTimer =
                    setTimeout(function () {

                        clearInterval(
                            featuredTimer
                        );

                        clearFeaturedClones();

                        featuredAnimating =
                            false;

                        buildFeaturedLoop();

                        startFeaturedAutoPlay();

                    }, 200);
            }
        );


        startFeaturedAutoPlay();
    }


    /* =====================================================
       FEATURED IMAGE LIGHTBOX
       ===================================================== */

    const featuredLightboxImages =
        featuredSlides
            .map(function (slide) {

                const image =
                    slide.querySelector(
                        ".featured-image-box img"
                    );

                return image
                    ? image.src
                    : null;

            })
            .filter(Boolean);


    document.querySelectorAll(
        ".featured-image-box img"
    ).forEach(function (image) {

        image.addEventListener(
            "click",
            function (e) {

                e.preventDefault();
                e.stopPropagation();

                let index =
                    featuredLightboxImages
                        .indexOf(image.src);

                if (index < 0) {
                    index = 0;
                }

                openLightbox(
                    featuredLightboxImages,
                    index
                );
            }
        );
    });


    /* =====================================================
       FESTIVAL COLLECTION FILTER
       ===================================================== */

    window.showFestivalProducts =
        function (festival) {

            const products =
                document.querySelectorAll(
                    "#collection .products .card"
                );

            if (!products.length) return;


            const festivalProducts = {

                onam: [
                    "Welcome Keyholder",
                    "Happy Home Keyholder"
                ],

                raksha: [
                    "Give Me a Hug Keyholder",
                    "My Room My Rules Keyholder"
                ],

                janmashtami: [
                    "Khatushyam Temple"
                ],

                ganesh: [
                    "Ganesha Wallart"
                ]
            };


            const selected =
                festivalProducts[festival] || [];


            products.forEach(function (card) {

                const title =
                    card.querySelector("h3");

                if (!title) return;

                const name =
                    title.textContent
                        .trim()
                        .toLowerCase();

                const matched =
                    selected.some(function (item) {

                        return name.includes(
                            item.toLowerCase()
                        );
                    });

                card.style.display =
                    matched ? "" : "none";
            });


            const heading =
                document.querySelector(
                    "#collection > h2"
                );


            const headings = {

                onam:
                    "Onam Collection",

                raksha:
                    "Raksha Bandhan Collection",

                janmashtami:
                    "Janmashtami Collection",

                ganesh:
                    "Ganesh Chaturthi Collection"
            };


            if (heading) {

                heading.textContent =
                    headings[festival] ||
                    "Our Collection";
            }


            const section =
                document.querySelector(
                    "#collection .products"
                );

            if (section) {

                setTimeout(function () {

                    window.scrollTo({
                        top:
                            section.getBoundingClientRect().top +
                            window.pageYOffset -
                            65,

                        behavior: "smooth"
                    });

                }, 150);
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
        document.querySelector(
            "#main-nav"
        );


    if (menuButton && nav) {

        menuButton.addEventListener(
            "click",
            function (e) {

                e.preventDefault();
                e.stopPropagation();

                const open =
                    nav.classList.toggle(
                        "mobile-open"
                    );

                document.body.classList.toggle(
                    "menu-open",
                    open
                );

                menuButton.setAttribute(
                    "aria-expanded",
                    open ? "true" : "false"
                );
            }
        );


        nav.querySelectorAll("a").forEach(
            function (link) {

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
            }
        );
    }


    /* =====================================================
       NAVIGATION
       ===================================================== */

    document.querySelectorAll(
        '#main-nav a[href^="#"]'
    ).forEach(function (link) {

        link.addEventListener(
            "click",
            function (e) {

                const id =
                    link.getAttribute("href");

                if (!id || id === "#") return;

                const target =
                    document.querySelector(id);

                if (!target) return;

                e.preventDefault();

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
       HOME → TOP
       ===================================================== */

    document.querySelectorAll(
        'a[href="#home"]'
    ).forEach(function (link) {

        link.addEventListener(
            "click",
            function (e) {

                e.preventDefault();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    });


    /* =====================================================
       PREVENT IMAGE DRAG
       ===================================================== */

    document.querySelectorAll("img")
        .forEach(function (image) {
            image.setAttribute(
                "draggable",
                "false"
            );
        });


    /* =====================================================
       CLEANUP
       ===================================================== */

    window.addEventListener(
        "beforeunload",
        function () {
            clearInterval(featuredTimer);
        }
    );

});
// ===============================
// HOME - FORCE TRUE PAGE TOP
// ===============================
document.addEventListener("click", function (e) {
    const homeLink = e.target.closest('a[href="#home"]');

    if (!homeLink) return;

    e.preventDefault();
    e.stopPropagation();

    // Remove hash first
    history.replaceState(null, "", window.location.pathname);

    // Force both possible scroll containers to top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);

    // Extra force after browser anchor handling
    requestAnimationFrame(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    });
}, true);
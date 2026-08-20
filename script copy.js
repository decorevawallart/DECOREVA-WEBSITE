/* =========================================================
   DECOREVA WALL ART
   FINAL CLEAN SCRIPT.JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. PRODUCT IMAGE SLIDER
       ===================================================== */

    function getSliderImages(slider) {
        if (!slider) return [];

        try {
            return JSON.parse(slider.dataset.images || "[]");
        } catch (error) {
            console.error("Slider image data error:", error);
            return [];
        }
    }

    function getSliderIndex(slider) {
        if (!slider) return 0;

        const index = parseInt(
            slider.dataset.index || "0",
            10
        );

        return Number.isNaN(index) ? 0 : index;
    }

    function updateDots(slider, images, currentIndex) {

        if (!slider) return;

        const dotsContainer =
            slider.querySelector(".slider-dots");

        if (!dotsContainer) return;

        dotsContainer.innerHTML = "";

        images.forEach(function (image, index) {

            const dot = document.createElement("span");

            dot.className = "slider-dot";

            if (index === currentIndex) {
                dot.classList.add("active");
            }

            dot.setAttribute("role", "button");

            dot.setAttribute(
                "aria-label",
                "View image " + (index + 1)
            );

            dot.tabIndex = 0;

            dot.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    showSliderImage(
                        slider,
                        index
                    );
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
                        event.stopPropagation();

                        showSliderImage(
                            slider,
                            index
                        );
                    }
                }
            );

            dotsContainer.appendChild(dot);
        });
    }


    function showSliderImage(slider, index) {

        if (!slider) return;

        const images = getSliderImages(slider);

        if (!images.length) return;

        if (index < 0) {
            index = images.length - 1;
        }

        if (index >= images.length) {
            index = 0;
        }

        const image =
            slider.querySelector(".slider-image");

        if (!image) return;

        slider.dataset.index = index;

        image.src = images[index];

        updateDots(
            slider,
            images,
            index
        );
    }


    window.changeImage = function (
        button,
        direction
    ) {

        if (!button) return;

        const slider =
            button.closest(".image-slider");

        if (!slider) return;

        const images =
            getSliderImages(slider);

        if (!images.length) return;

        let index =
            getSliderIndex(slider);

        index += direction;

        if (index < 0) {
            index = images.length - 1;
        }

        if (index >= images.length) {
            index = 0;
        }

        showSliderImage(
            slider,
            index
        );
    };


    document
        .querySelectorAll(".image-slider")
        .forEach(function (slider) {

            const images =
                getSliderImages(slider);

            const index =
                getSliderIndex(slider);

            if (images.length) {

                showSliderImage(
                    slider,
                    index
                );
            }
        });


    /* =====================================================
       2. LIGHTBOX
       ===================================================== */

    const lightbox =
        document.querySelector(".lightbox");

    const lightboxImg =
        document.querySelector("#lightbox-img");

    const lightboxClose =
        document.querySelector(
            ".lightbox .close"
        );

    const lightboxPrev =
        document.querySelector(
            ".lightbox-prev"
        );

    const lightboxNext =
        document.querySelector(
            ".lightbox-next"
        );

    let lightboxImages = [];

    let lightboxIndex = 0;


    function openLightbox(
        images,
        index = 0
    ) {

        if (
            !lightbox ||
            !lightboxImg ||
            !images ||
            !images.length
        ) {
            return;
        }

        lightboxImages = images;

        lightboxIndex = index;

        if (
            lightboxIndex < 0 ||
            lightboxIndex >= lightboxImages.length
        ) {
            lightboxIndex = 0;
        }

        lightboxImg.src =
            lightboxImages[lightboxIndex];

        lightbox.classList.add("active");

        document.body.classList.add(
            "lightbox-open"
        );
    }


    function closeLightbox() {

        if (!lightbox) return;

        lightbox.classList.remove("active");

        document.body.classList.remove(
            "lightbox-open"
        );
    }


    function showLightboxImage(index) {

        if (
            !lightboxImages.length ||
            !lightboxImg
        ) {
            return;
        }

        if (index < 0) {
            index =
                lightboxImages.length - 1;
        }

        if (
            index >= lightboxImages.length
        ) {
            index = 0;
        }

        lightboxIndex = index;

        lightboxImg.src =
            lightboxImages[
                lightboxIndex
            ];
    }


    document
        .querySelectorAll(
            ".products .slider-image"
        )
        .forEach(function (image) {

            image.addEventListener(
                "click",
                function () {

                    const slider =
                        image.closest(
                            ".image-slider"
                        );

                    if (!slider) return;

                    const images =
                        getSliderImages(slider);

                    const index =
                        getSliderIndex(slider);

                    openLightbox(
                        images,
                        index
                    );
                }
            );
        });


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

                if (
                    event.target === lightbox
                ) {
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
                !lightbox.classList.contains(
                    "active"
                )
            ) {
                return;
            }

            if (event.key === "Escape") {
                closeLightbox();
            }

            if (event.key === "ArrowRight") {
                showLightboxImage(
                    lightboxIndex + 1
                );
            }

            if (event.key === "ArrowLeft") {
                showLightboxImage(
                    lightboxIndex - 1
                );
            }
        }
    );


    /* =====================================================
       3. SEARCH
       ===================================================== */

    const productSearch =
        document.querySelector(
            "#productSearch"
        );

    function filterProducts() {

        if (!productSearch) return;

        const searchText =
            productSearch.value
                .toLowerCase()
                .trim();

        document
            .querySelectorAll(
                ".products .card"
            )
            .forEach(function (card) {

                const productName =
                    card.querySelector("h3");

                if (!productName) return;

                const name =
                    productName.textContent
                        .toLowerCase();

                const match =
                    !searchText ||
                    name.includes(searchText);

                card.style.display =
                    match ? "" : "none";
            });
    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );
    }


    /* =====================================================
       4. SORTING
       ===================================================== */

    const productsContainer =
        document.querySelector(
            ".products"
        );

    const sortSelect =
        document.querySelector(
            "#productSort"
        );

    const customSort =
        document.querySelector(
            ".custom-sort"
        );

    const customSortButton =
        document.querySelector(
            ".custom-sort-button"
        );

    const customSortArrow =
        document.querySelector(
            ".custom-sort-arrow"
        );

    const sortOptions =
        customSort
            ? customSort.querySelectorAll(
                "[data-value]"
            )
            : [];


    function getCards() {

        if (!productsContainer) {
            return [];
        }

        return Array.from(
            productsContainer.querySelectorAll(
                ".card"
            )
        );
    }


    function getPrice(card) {

        const priceElement =
            card.querySelector(".price");

        if (!priceElement) return 0;

        const value =
            priceElement.textContent
                .replace(/[^\d.]/g, "");

        return parseFloat(value) || 0;
    }


    function getName(card) {

        const nameElement =
            card.querySelector("h3");

        return nameElement
            ? nameElement.textContent
                .trim()
                .toLowerCase()
            : "";
    }


    function sortProducts(value) {

        if (!productsContainer) {
            return;
        }

        const cards = getCards();

        cards.sort(function (a, b) {

            if (value === "price-low") {
                return getPrice(a) -
                    getPrice(b);
            }

            if (value === "price-high") {
                return getPrice(b) -
                    getPrice(a);
            }

            if (value === "name-az") {
                return getName(a)
                    .localeCompare(
                        getName(b)
                    );
            }

            if (value === "name-za") {
                return getName(b)
                    .localeCompare(
                        getName(a)
                    );
            }

            return 0;
        });


        cards.forEach(function (card) {

            productsContainer.appendChild(
                card
            );
        });
    }


    function updateSortUI(value) {

        sortOptions.forEach(
            function (option) {

                option.classList.toggle(
                    "active",
                    option.dataset.value ===
                    value
                );
            }
        );

        if (!customSortButton) return;

        const active =
            Array.from(sortOptions)
                .find(function (option) {

                    return (
                        option.dataset.value ===
                        value
                    );
                });

        const label =
            active
                ? active.textContent.trim()
                : "Sort Products";

        const text =
            customSortButton.querySelector(
                ".sort-label"
            );

        if (text) {
            text.textContent = label;
        }
    }


    if (
        customSort &&
        customSortButton
    ) {

        customSortButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                customSort.classList.toggle(
                    "open"
                );
            }
        );


        sortOptions.forEach(
            function (option) {

                option.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

                        const value =
                            option.dataset.value;

                        if (!value) return;

                        sortProducts(
                            value
                        );

                        updateSortUI(
                            value
                        );

                        if (sortSelect) {
                            sortSelect.value =
                                value;
                        }

                        customSort.classList.remove(
                            "open"
                        );
                    }
                );
            }
        );


        document.addEventListener(
            "click",
            function (event) {

                if (
                    !customSort.contains(
                        event.target
                    )
                ) {

                    customSort.classList.remove(
                        "open"
                    );
                }
            }
        );
    }


    if (sortSelect) {

        updateSortUI(
            sortSelect.value ||
            "default"
        );
    }


    /* =====================================================
       5. FEATURED PRODUCTS
       EXACTLY 4 CARDS DESKTOP
       1 CARD MOBILE
       ===================================================== */

    const featuredSlider =
        document.querySelector(
            ".featured-slider"
        );

    const featuredSlides =
        Array.from(
            document.querySelectorAll(
                ".featured-slide"
            )
        );

    const featuredDots =
        Array.from(
            document.querySelectorAll(
                ".featured-dot"
            )
        );

    const featuredPrev =
        document.querySelector(
            ".featured-prev"
        );

    const featuredNext =
        document.querySelector(
            ".featured-next"
        );


    let featuredTimer = null;


    if (
        featuredSlider &&
        featuredSlides.length
    ) {

        let featuredTrack = null;

        let featuredPosition = 0;

        let featuredAnimating = false;

        let featuredCloneCount = 0;

        let featuredRealIndex = 0;

        let featuredResizeTimer = null;


        function getFeaturedVisibleCount() {

            return window.innerWidth <= 760
                ? 1
                : 4;
        }


        function getFeaturedGap() {

            if (!featuredTrack) {
                return 18;
            }

            const styles =
                window.getComputedStyle(
                    featuredTrack
                );

            return (
                parseFloat(
                    styles.columnGap ||
                    styles.gap ||
                    "18"
                ) || 18
            );
        }


        function getFeaturedStep() {

            if (!featuredTrack) {
                return 0;
            }

            const card =
                featuredTrack.querySelector(
                    ".featured-slide"
                );

            if (!card) {
                return 0;
            }

            return (
                card.getBoundingClientRect()
                    .width +
                getFeaturedGap()
            );
        }


        function setFeaturedPosition(
            animate
        ) {

            if (!featuredTrack) {
                return;
            }

            featuredTrack.style.transition =
                animate
                    ? "transform .68s cubic-bezier(.22,.61,.36,1)"
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

            const total =
                featuredSlides.length;

            if (!total) {
                return;
            }

            featuredRealIndex =
                (
                    (
                        featuredPosition -
                        featuredCloneCount
                    ) %
                    total +
                    total
                ) %
                total;


            featuredDots.forEach(
                function (
                    dot,
                    index
                ) {

                    dot.classList.toggle(
                        "active",
                        index ===
                        featuredRealIndex
                    );
                }
            );
        }


        function clearFeaturedClones() {

            if (!featuredTrack) {
                return;
            }

            featuredTrack
                .querySelectorAll(
                    ".featured-clone"
                )
                .forEach(
                    function (clone) {
                        clone.remove();
                    }
                );
        }


        function buildFeaturedLoop() {

            const visibleCount =
                getFeaturedVisibleCount();


            if (!featuredTrack) {

                featuredTrack =
                    document.createElement(
                        "div"
                    );

                featuredTrack.className =
                    "featured-track";


                featuredSlides.forEach(
                    function (slide) {

                        featuredTrack.appendChild(
                            slide
                        );
                    }
                );


                featuredSlider.insertBefore(
                    featuredTrack,
                    featuredPrev || null
                );

            } else {

                clearFeaturedClones();
            }


            featuredCloneCount =
                Math.min(
                    visibleCount,
                    featuredSlides.length
                );


            const prependClones =
                featuredSlides
                    .slice(
                        -featuredCloneCount
                    )
                    .map(
                        function (slide) {

                            const clone =
                                slide.cloneNode(
                                    true
                                );

                            clone.classList.add(
                                "featured-clone"
                            );

                            return clone;
                        }
                    );


            const appendClones =
                featuredSlides
                    .slice(
                        0,
                        featuredCloneCount
                    )
                    .map(
                        function (slide) {

                            const clone =
                                slide.cloneNode(
                                    true
                                );

                            clone.classList.add(
                                "featured-clone"
                            );

                            return clone;
                        }
                    );


            prependClones
                .reverse()
                .forEach(
                    function (clone) {

                        featuredTrack.insertBefore(
                            clone,
                            featuredTrack.firstChild
                        );
                    }
                );


            appendClones.forEach(
                function (clone) {

                    featuredTrack.appendChild(
                        clone
                    );
                }
            );


            featuredPosition =
                featuredCloneCount +
                featuredRealIndex;

            featuredAnimating = false;


            requestAnimationFrame(
                function () {

                    setFeaturedPosition(
                        false
                    );

                    updateFeaturedDots();
                }
            );
        }


        function nextFeaturedSlide() {

            if (featuredAnimating) {
                return;
            }

            featuredAnimating = true;

            featuredPosition += 1;

            setFeaturedPosition(
                true
            );

            updateFeaturedDots();
        }


        function previousFeaturedSlide() {

            if (featuredAnimating) {
                return;
            }

            featuredAnimating = true;

            featuredPosition -= 1;

            setFeaturedPosition(
                true
            );

            updateFeaturedDots();
        }


        function goToFeatured(
            index
        ) {

            const total =
                featuredSlides.length;

            if (
                !total ||
                featuredAnimating
            ) {
                return;
            }


            index =
                (
                    index %
                    total +
                    total
                ) %
                total;


            featuredAnimating = true;

            featuredPosition =
                featuredCloneCount +
                index;


            setFeaturedPosition(
                true
            );

            updateFeaturedDots();
        }


        function startFeaturedAutoPlay() {

            clearInterval(
                featuredTimer
            );


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


        featuredDots.forEach(
            function (
                dot,
                index
            ) {

                dot.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

                        goToFeatured(
                            index
                        );

                        restartFeaturedAutoPlay();
                    }
                );
            }
        );


        featuredSlider.addEventListener(
            "mouseenter",
            function () {

                clearInterval(
                    featuredTimer
                );
            }
        );


        featuredSlider.addEventListener(
            "mouseleave",
            function () {

                startFeaturedAutoPlay();
            }
        );


        buildFeaturedLoop();


        featuredTrack.addEventListener(
            "transitionend",
            function (event) {

                if (
                    event.propertyName !==
                    "transform"
                ) {
                    return;
                }


                featuredAnimating =
                    false;


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

                    setFeaturedPosition(
                        false
                    );

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

                    setFeaturedPosition(
                        false
                    );
                }


                updateFeaturedDots();
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

                clearInterval(
                    featuredTimer
                );
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
                    Math.abs(dx) > 45 &&
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

                            const oldIndex =
                                featuredRealIndex;


                            clearInterval(
                                featuredTimer
                            );


                            if (featuredTrack) {

                                featuredTrack.style.transition =
                                    "none";

                                clearFeaturedClones();
                            }


                            featuredAnimating =
                                false;

                            featuredRealIndex =
                                oldIndex;


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
   6. FEATURED IMAGE → LIGHTBOX
   NEXT / PREVIOUS FEATURED PRODUCTS
   ===================================================== */

const featuredLightboxImages = featuredSlides
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


document
    .querySelectorAll(
        ".featured-image-box img"
    )
    .forEach(
        function (image) {

            image.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    let index =
                        featuredLightboxImages.indexOf(
                            image.src
                        );

                    if (index < 0) {
                        index = 0;
                    }

                    openLightbox(
                        featuredLightboxImages,
                        index
                    );
                }
            );

        }
    );


    /* =====================================================
       7. PREVENT IMAGE DRAG
       ===================================================== */

    document
        .querySelectorAll("img")
        .forEach(
            function (image) {

                image.setAttribute(
                    "draggable",
                    "false"
                );
            }
        );


    /* =====================================================
       8. HOME → ABSOLUTE TOP
       ===================================================== */

    document
        .querySelectorAll(
            'a[href="#home"]'
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });
                    }
                );
            }
        );


    /* =====================================================
       9. CLEANUP
       ===================================================== */

    window.addEventListener(
        "beforeunload",
        function () {

            clearInterval(
                featuredTimer
            );
        }
    );

});
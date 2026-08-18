// ========================================
// DECOREVA WALL ART
// COMPLETE PRODUCT SCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // LIGHTBOX ELEMENTS
    // ========================================

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    const closeBtn = document.querySelector(".close");
    const lightboxPrev = document.querySelector(".lightbox-prev");
    const lightboxNext = document.querySelector(".lightbox-next");

    let lightboxImages = [];
    let lightboxIndex = 0;


    // ========================================
    // CREATE / UPDATE SLIDER DOTS
    // ========================================

    function updateDots(slider, images, currentIndex) {

    const dotsContainer =
        slider.querySelector(".slider-dots");

    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    images.forEach(function (image, index) {

        const dot =
            document.createElement("span");

        dot.className = "slider-dot";

        if (index === currentIndex) {
            dot.classList.add("active");
        }

        // Make dot clickable
        dot.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                const img =
                    slider.querySelector(
                        ".slider-image"
                    );

                if (!img) return;

                img.src = images[index];

                slider.dataset.index =
                    index;

                // Update active dot
                updateDots(
                    slider,
                    images,
                    index
                );

            }
        );

        dotsContainer.appendChild(dot);

    });

}

    // ========================================
    // PRODUCT SLIDER
    // ========================================

    window.changeImage = function (button, direction) {

        const slider =
            button.closest(".image-slider");

        if (!slider) return;

        const img =
            slider.querySelector(".slider-image");

        if (!img) return;

        let images = [];

        try {

            images =
                JSON.parse(
                    slider.dataset.images || "[]"
                );

        } catch (error) {

            console.error(
                "Slider image error:",
                error
            );

            return;
        }

        if (!images.length) return;

        let currentIndex =
            parseInt(
                slider.dataset.index || "0",
                10
            );

        if (isNaN(currentIndex)) {
            currentIndex = 0;
        }

        currentIndex += direction;

        if (currentIndex < 0) {
            currentIndex = images.length - 1;
        }

        if (currentIndex >= images.length) {
            currentIndex = 0;
        }

        img.src = images[currentIndex];

        slider.dataset.index =
            currentIndex;

        updateDots(
            slider,
            images,
            currentIndex
        );

    };


    // ========================================
    // INITIALIZE ALL SLIDERS
    // ========================================

    document
        .querySelectorAll(".image-slider")
        .forEach(function (slider) {

            let images = [];

            try {

                images =
                    JSON.parse(
                        slider.dataset.images || "[]"
                    );

            } catch (error) {

                return;
            }

            if (!images.length) return;

            let currentIndex =
                parseInt(
                    slider.dataset.index || "0",
                    10
                );

            if (isNaN(currentIndex)) {
                currentIndex = 0;
            }

            const img =
                slider.querySelector(".slider-image");

            if (img && images[currentIndex]) {
                img.src = images[currentIndex];
            }

            updateDots(
                slider,
                images,
                currentIndex
            );

        });


    // ========================================
    // OPEN LIGHTBOX
    // ========================================

    document
        .querySelectorAll(".card img")
        .forEach(function (img) {

            img.addEventListener(
                "click",
                function () {

                    if (!lightbox || !lightboxImg) {
                        return;
                    }

                    const slider =
                        img.closest(".image-slider");

                    if (
                        slider &&
                        slider.dataset.images
                    ) {

                        try {

                            lightboxImages =
                                JSON.parse(
                                    slider.dataset.images
                                );

                        } catch (error) {

                            lightboxImages =
                                [img.src];

                        }

                        lightboxIndex =
                            parseInt(
                                slider.dataset.index || "0",
                                10
                            );

                        if (isNaN(lightboxIndex)) {
                            lightboxIndex = 0;
                        }

                    } else {

                        lightboxImages =
                            [img.src];

                        lightboxIndex = 0;

                    }

                    if (
                        lightboxImages[
                            lightboxIndex
                        ]
                    ) {

                        lightboxImg.src =
                            lightboxImages[
                                lightboxIndex
                            ];

                    }

                    lightbox.style.display =
                        "flex";

                }
            );

        });


    // ========================================
    // LIGHTBOX NEXT
    // ========================================

    if (lightboxNext) {

        lightboxNext.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex++;

                if (
                    lightboxIndex >=
                    lightboxImages.length
                ) {

                    lightboxIndex = 0;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }
        );

    }


    // ========================================
    // LIGHTBOX PREVIOUS
    // ========================================

    if (lightboxPrev) {

        lightboxPrev.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex--;

                if (lightboxIndex < 0) {

                    lightboxIndex =
                        lightboxImages.length - 1;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }
        );

    }


    // ========================================
    // CLOSE LIGHTBOX
    // ========================================

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            function () {

                if (lightbox) {
                    lightbox.style.display =
                        "none";
                }

            }
        );

    }


    // ========================================
    // CLICK OUTSIDE LIGHTBOX
    // ========================================

    if (lightbox) {

        lightbox.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    lightbox
                ) {

                    lightbox.style.display =
                        "none";

                }

            }
        );

    }


    // ========================================
    // KEYBOARD CONTROLS
    // ========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (!lightbox) return;

            if (
                lightbox.style.display !==
                "flex"
            ) {
                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex++;

                if (
                    lightboxIndex >=
                    lightboxImages.length
                ) {

                    lightboxIndex = 0;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                if (!lightboxImages.length) {
                    return;
                }

                lightboxIndex--;

                if (lightboxIndex < 0) {

                    lightboxIndex =
                        lightboxImages.length - 1;

                }

                lightboxImg.src =
                    lightboxImages[
                        lightboxIndex
                    ];

            }


            if (
                event.key ===
                "Escape"
            ) {

                lightbox.style.display =
                    "none";

            }

        }
    );


    // ========================================
    // PRODUCT SEARCH
    // MOBILE + DESKTOP
    // ========================================

    const productSearch =
        document.getElementById(
            "productSearch"
        );

    function filterProducts() {

        if (!productSearch) return;

        const searchText =
            productSearch.value
                .toLowerCase()
                .trim();

        const cards =
            document.querySelectorAll(
                ".products .card"
            );

        cards.forEach(function (card) {

            const productName =
                card.querySelector("h3");

            if (!productName) return;

            const name =
                productName.textContent
                    .toLowerCase()
                    .trim();

            if (
                searchText === "" ||
                name.includes(searchText)
            ) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    }


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );

        productSearch.addEventListener(
            "keyup",
            filterProducts
        );

        productSearch.addEventListener(
            "change",
            filterProducts
        );

    }
// ========================================
// PRODUCT SORTING
// CUSTOM DROPDOWN + NATIVE SELECT
// ========================================

const productsContainer =
    document.querySelector(".products");

const customSort =
    document.querySelector(".custom-sort");

const customSortButton =
    document.querySelector(".custom-sort-button");

const customSortMenu =
    document.querySelector(".custom-sort-menu");

const sortSelect =
    document.getElementById("productSort");


// Save original product order ONCE
const originalCards =
    productsContainer
        ? Array.from(
            productsContainer.querySelectorAll(".card")
        )
        : [];


// ========================================
// GET PRODUCT NAME
// ========================================

function getProductName(card) {

    const name =
        card.querySelector("h3");

    return name
        ? name.textContent
            .trim()
            .toLowerCase()
        : "";
}


// ========================================
// SORT PRODUCTS
// ========================================

function sortProducts(sortValue) {

    if (!productsContainer) {
        return;
    }

    // DEFAULT
    if (sortValue === "default") {

        originalCards.forEach(function(card) {

            productsContainer.appendChild(card);

        });

        return;
    }


    const cards =
        Array.from(
            productsContainer.querySelectorAll(".card")
        );


    // PRICE: LOW TO HIGH
    if (sortValue === "low-high") {

        cards.sort(function(a, b) {

            return getPrice(a) - getPrice(b);

        });
    }


    // PRICE: HIGH TO LOW
    else if (sortValue === "high-low") {

        cards.sort(function(a, b) {

            return getPrice(b) - getPrice(a);

        });
    }


    // NAME: A TO Z
    else if (sortValue === "az") {

        cards.sort(function(a, b) {

            return getProductName(a)
                .localeCompare(
                    getProductName(b)
                );

        });
    }


    // NAME: Z TO A
    else if (sortValue === "za") {

        cards.sort(function(a, b) {

            return getProductName(b)
                .localeCompare(
                    getProductName(a)
                );

        });
    }


    // Put sorted cards back
    cards.forEach(function(card) {

        productsContainer.appendChild(card);

    });
}


// ========================================
// CUSTOM DROPDOWN
// ========================================

if (
    customSort &&
    customSortButton &&
    customSortMenu
) {

    const options =
        customSortMenu.querySelectorAll(
            "button[data-value]"
        );


    // OPEN / CLOSE DROPDOWN
    customSortButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            customSort.classList.toggle("open");

        }
    );


    // SORT OPTION CLICK
    options.forEach(function(option) {

        option.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();


                const value =
                    this.getAttribute(
                        "data-value"
                    );


                const text =
                    this.textContent.trim();


                if (!value) {
                    return;
                }


                // Sort products
                sortProducts(value);


                // Update button text
                const buttonText =
                    customSortButton.querySelector(
                        "span:first-child"
                    );

                if (buttonText) {

                    buttonText.textContent =
                        text;

                }


                // Remove active from all options
                options.forEach(function(item) {

                    item.classList.remove(
                        "active"
                    );

                });


                // Add active to selected option
                this.classList.add("active");


                // Sync hidden native select
                if (sortSelect) {

                    sortSelect.value =
                        value;

                }


                // Close dropdown
                customSort.classList.remove(
                    "open"
                );

            }
        );

    });


    // CLOSE WHEN CLICKING OUTSIDE
    document.addEventListener(
        "click",
        function(event) {

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


// ========================================
// NATIVE SELECT SUPPORT
// ========================================

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        function() {

            const value =
                this.value;


            // Sort products
            sortProducts(value);


            // Update custom dropdown
            if (
                customSort &&
                customSortButton &&
                customSortMenu
            ) {

                const option =
                    customSortMenu.querySelector(
                        'button[data-value="' +
                        value +
                        '"]'
                    );


                if (option) {

                    const buttonText =
                        customSortButton.querySelector(
                            "span:first-child"
                        );

                    if (buttonText) {

                        buttonText.textContent =
                            option.textContent.trim();

                    }


                    customSortMenu
                        .querySelectorAll(
                            "button[data-value]"
                        )
                        .forEach(
                            function(item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    option.classList.add(
                        "active"
                    );

                }

            }

        }
    );

}
    // ========================================
    // GET PRODUCT PRICE
    // ========================================

    function getPrice(card) {

        const priceElement =
            card.querySelector(".price");

        if (!priceElement) {

            const text =
                card.textContent || "";

            const match =
                text.match(
                    /₹\s*([0-9,]+)/
                );

            if (!match) return 0;

            return parseFloat(
                match[1]
                    .replace(/,/g, "")
            );

        }

        return parseFloat(
            priceElement.textContent
                .replace(/[^\d.]/g, "")
        ) || 0;

    }


    // ========================================
    // DEBUG MESSAGE
    // ========================================

    console.log(
        "DECOREVA script loaded successfully"
    );

});
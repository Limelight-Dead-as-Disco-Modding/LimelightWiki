"use strict";

const body = document.body;
const sidebar = document.getElementById("documentationSidebar");
const menuToggle = document.getElementById("menuToggle");
const navigationLinks = document.querySelectorAll(".navigation-link");
const lightboxTriggers = document.querySelectorAll("[data-lightbox]");

let activeLightbox = null;
let lightboxReturnFocus = null;

function setSidebarOpen(isOpen) {
    body.classList.toggle("sidebar-open", isOpen);

    if (menuToggle) {
        menuToggle.setAttribute(
            "aria-expanded",
            isOpen.toString()
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close documentation navigation"
                : "Open documentation navigation"
        );
    }
}

function updateActiveNavigationLink() {
    const currentPage = body.dataset.page || "home";

    const pageByFile = {
        "index.html": "home",
        "getting-started.html": "getting-started",
        "mod-compatibility.html": "mod-compatibility",
        "arenakit.html": "arenakit",
        "live-loader.html": "live-loader",
        "profiles.html": "profiles",
        "xlr8-loader.html": "xlr8-loader",
        "nexus-mods.html": "nexus-mods",
        "multiplayer.html": "multiplayer",
        "project-encore.html": "project-encore",
        "development-journey.html": "development-journey",
        "testing-bug-reports.html": "testing-bug-reports",
        "troubleshooting.html": "troubleshooting",
        "privacy.html": "privacy",
        "credits.html": "credits"
    };

    navigationLinks.forEach(link => {
        const linkFile = link
            .getAttribute("href")
            ?.split("#")[0]
            ?.split("?")[0]
            ?.split("/")
            .pop();

        const isCurrentPage =
            (pageByFile[linkFile] || linkFile?.replace(/\.html$/i, "")) ===
            currentPage;

        link.classList.toggle("active", isCurrentPage);

        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function closeLightbox() {
    if (!activeLightbox) {
        return;
    }

    activeLightbox.remove();
    activeLightbox = null;
    body.classList.remove("lightbox-open");

    lightboxReturnFocus?.focus();
    lightboxReturnFocus = null;
}

function openLightbox(trigger) {
    const sourceImage = trigger.querySelector("img");

    if (!sourceImage) {
        return;
    }

    lightboxReturnFocus = trigger;

    const overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Enlarged documentation screenshot");

    const image = document.createElement("img");
    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;

    const caption = document.createElement("p");
    caption.className = "image-lightbox-caption";
    caption.textContent = trigger.dataset.lightboxCaption || sourceImage.alt;

    const closeButton = document.createElement("button");
    closeButton.className = "image-lightbox-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close enlarged screenshot");
    closeButton.textContent = "\u00d7";

    closeButton.addEventListener("click", closeLightbox);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeLightbox();
        }
    });

    overlay.append(image, caption, closeButton);
    document.body.append(overlay);

    activeLightbox = overlay;
    body.classList.add("lightbox-open");
    closeButton.focus();
}

if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", event => {
        event.stopPropagation();

        const isCurrentlyOpen =
            body.classList.contains("sidebar-open");

        setSidebarOpen(!isCurrentlyOpen);
    });

    // I close the menu after navigation so it never covers the next page.
    navigationLinks.forEach(link => {
        link.addEventListener("click", () => {
            setSidebarOpen(false);
        });
    });

    document.addEventListener("click", event => {
        if (!body.classList.contains("sidebar-open")) {
            return;
        }

        const clickedInsideSidebar =
            sidebar.contains(event.target);

        const clickedMenuButton =
            menuToggle.contains(event.target);

        if (!clickedInsideSidebar && !clickedMenuButton) {
            setSidebarOpen(false);
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            body.classList.contains("sidebar-open")
        ) {
            setSidebarOpen(false);
            menuToggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 820) {
            setSidebarOpen(false);
        }
    });
}

lightboxTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
        openLightbox(trigger);
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeLightbox) {
        closeLightbox();
    }
});

// I calculate this from the current file so copied page layouts stay accurate.
updateActiveNavigationLink();

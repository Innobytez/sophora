const galleryItems = [
  "artists/carmeners/assets/the-carmeners-jpg.webp",
  "artists/carmeners/assets/the-carmeners-logo.jpeg",
  "artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg",
  "assets/artist-placeholder.svg"
];

const galleryCard = document.querySelector(".hero-photo-card");
const currentImage = document.querySelector(".gallery-image-current");
const nextImage = document.querySelector(".gallery-image-next");
const legacyImage = document.getElementById("gallery-image") || document.getElementById("para-gallery-image");
const whatsappContact = document.querySelector("[data-whatsapp-contact]");
const whatsappLabel = document.querySelector("[data-whatsapp-label]");
const siteNav = document.querySelector(".site-nav");
const menuToggle = document.querySelector(".menu-toggle");

function hydrateWhatsappContact() {
  if (!whatsappContact) return;
  const display = "+56 9 2047 4645";
  const waNumber = "56920474645";
  whatsappContact.href = `https://wa.me/${waNumber}`;
  whatsappContact.target = "_blank";
  whatsappContact.rel = "noreferrer";
  whatsappContact.setAttribute("aria-label", `Enviar WhatsApp a ${display}`);
  if (whatsappLabel) whatsappLabel.textContent = display;
}

function startGallery() {
  if (galleryCard && currentImage && nextImage && galleryItems.length) {
    let activeIndex = 0;
    let visibleImage = currentImage;
    let hiddenImage = nextImage;

    visibleImage.src = galleryItems[activeIndex];
    visibleImage.classList.add("is-active");

    window.setInterval(() => {
      const nextIndex = (activeIndex + 1) % galleryItems.length;
      const revealLoadedImage = () => {
        hiddenImage.classList.add("is-active");
        visibleImage.classList.remove("is-active");

        const previousVisibleImage = visibleImage;
        visibleImage = hiddenImage;
        hiddenImage = previousVisibleImage;
        activeIndex = nextIndex;
      };

      hiddenImage.addEventListener("load", revealLoadedImage, { once: true });
      hiddenImage.src = galleryItems[nextIndex];
      if (hiddenImage.complete) {
        hiddenImage.removeEventListener("load", revealLoadedImage);
        revealLoadedImage();
      }
    }, 3600);
    return;
  }

  if (!legacyImage || !galleryItems.length) return;
  let activeIndex = 0;
  legacyImage.src = galleryItems[activeIndex];

  window.setInterval(() => {
    activeIndex = (activeIndex + 1) % galleryItems.length;
    legacyImage.src = galleryItems[activeIndex];
  }, 3600);
}

function hydrateMenuToggle() {
  if (!siteNav || !menuToggle) return;
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  siteNav.querySelectorAll(".primary-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menú");
    });
  });
}

hydrateWhatsappContact();
hydrateMenuToggle();
startGallery();

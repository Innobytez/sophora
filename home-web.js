const galleryItems = [
  "artists/carmeners/assets/the-carmeners-jpg.webp",
  "artists/carmeners/assets/the-carmeners-logo.jpeg",
  "artists/alexander-roberts/assets/alexander-roberts-casual-headshot.jpg",
  "assets/artist-placeholder.svg"
];

const image = document.getElementById("gallery-image") || document.getElementById("para-gallery-image");
const whatsappContact = document.querySelector("[data-whatsapp-contact]");
const whatsappLabel = document.querySelector("[data-whatsapp-label]");

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
  if (!image || !galleryItems.length) return;
  let activeIndex = 0;
  image.src = galleryItems[activeIndex];

  window.setInterval(() => {
    activeIndex = (activeIndex + 1) % galleryItems.length;
    image.style.opacity = "0";
    window.setTimeout(() => {
      image.src = galleryItems[activeIndex];
      image.style.opacity = "1";
    }, 260);
  }, 3600);
}

hydrateWhatsappContact();
startGallery();

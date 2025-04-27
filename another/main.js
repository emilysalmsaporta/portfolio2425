const sheetsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwZa15N3-LUE4A1BKj4sW-ZIr2XM9fGMIHQ_7D4DksJJPLjwXVWVItW-0gcD6kuSw2FyGCC1AEl1Q6/pub?output=csv";

const backColors = [
  "#FFD1DC", "#B5EAD7", "#C7CEEA", "#FFDAC1", "#E2F0CB", "#FFB7B2"
];

const fetchCSV = async () => {
  const response = await fetch(sheetsURL);
  return response.text();
};

const csvToJson = (csvString) => {
  const result = [];
  const lines = [];
  let currentLine = '';
  let insideQuotes = false;

  for (const char of csvString) {
    if (char === '"') insideQuotes = !insideQuotes;
    if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  const headers = lines.shift().split(',').map(h => h.trim());

  for (const line of lines) {
    const values = [];
    let current = '';
    insideQuotes = false;

    for (const char of line) {
      if (char === '"') insideQuotes = !insideQuotes;
      else if (char === ',' && !insideQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj = {};
    headers.forEach((header, i) => {
      let value = (values[i] || '').replace(/\r/g, '');
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      obj[header] = value;
    });

    result.push(obj);
  }

  return result;
};

const sanitizeName = (name) => {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_\-]/g, '_');
};

const createProjectElements = (data) => {
  const container = document.querySelector(".projets");

  const duplicated = data.flatMap(item => [item, { ...item }]);
  const shuffled = duplicated.sort(() => Math.random() - 0.5);

  let flippedCards = [];
  let matchedTitles = new Set();

  shuffled.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    container.appendChild(card);

    const inner = document.createElement("div");
    inner.classList.add("card-inner");
    card.appendChild(inner);

    // FRONT
    const front = document.createElement("div");
    front.classList.add("card-front");
    inner.appendChild(front);

    const img = document.createElement("img");
    img.src = `img/${sanitizeName(item.titre)}.png`;
    img.onerror = () => {
      img.src = `https://via.placeholder.com/400x250?text=${sanitizeName(item.titre)}`;
    };
    front.appendChild(img);

    const title = document.createElement("h1");
    title.textContent = item.titre;
    front.appendChild(title);

    // BACK
    const back = document.createElement("div");
    back.classList.add("card-back");
    back.style.backgroundColor = gsap.utils.random(backColors);

    // Big center ?
    const bigQuestion = document.createElement("div");
    bigQuestion.classList.add("big-question");
    bigQuestion.textContent = "?";
    back.appendChild(bigQuestion);

    // Frame of small ?
    const frame = document.createElement("div");
    frame.classList.add("frame-questions");

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const span = document.createElement("span");
        const isBorder = row === 0 || row === 4 || col === 0 || col === 4;

        if (isBorder) {
          span.textContent = "?";

          // Alternate flipping
          if ((row + col) % 2 === 1) {
            span.classList.add("flipped");
          }
        } else {
          span.textContent = "";
        }

        frame.appendChild(span);
      }
    }

    back.appendChild(frame);
    inner.appendChild(back);

    // Entrance Animations
    gsap.set(card, {
      backgroundColor: "transparent",
      transformOrigin: "center",
      scale: 0.3,
      opacity: 0,
      rotation: gsap.utils.random(-25, 25),
      x: gsap.utils.random(-200, 200),
      y: gsap.utils.random(-200, 200)
    });

    gsap.to(card, {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      rotation: 0,
      duration: 1,
      ease: "power3.out",
      delay: index * 0.07
    });

    // Breathing animation for big ?
    gsap.to(bigQuestion, {
      scale: 1.1,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: "power1.inOut"
    });

    // Card Flip
    gsap.set(inner, { rotateY: 180 });
    let isFlipped = false;

    card.addEventListener("click", () => {
      if (isFlipped || flippedCards.length >= 2 || matchedTitles.has(item.titre)) return;

      isFlipped = true;
      gsap.to(inner, { rotateY: 0, duration: 0.6, ease: "power2.inOut" });

      flippedCards.push({
        card,
        item,
        inner,
        reset: () => {
          isFlipped = false;
          gsap.to(inner, { rotateY: 180, duration: 0.6, ease: "power2.inOut" });
        }
      });

      if (flippedCards.length === 2) {
        const [first, second] = flippedCards;

        setTimeout(() => {
          if (first.item.titre === second.item.titre) {
            matchedTitles.add(first.item.titre);
            flippedCards = [];
            setTimeout(() => openModal(first.item), 400);
          } else {
            first.reset();
            second.reset();
            flippedCards = [];
          }
        }, 1000);
      }
    });

    // Big "?" Pulse on Hover
    card.addEventListener("mouseenter", () => {
      gsap.to(bigQuestion, { scale: 1.2, duration: 0.5, ease: "power1.inOut" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(bigQuestion, { scale: 1.1, duration: 0.5, ease: "power1.inOut" });
    });

  });
};

const openModal = (item) => {
  const header = document.querySelector("header");
  const projets = document.querySelector(".projets");

  header.classList.add("fixed");
  projets.classList.add("fixed");

  const overlay = document.createElement("div");
  overlay.classList.add("overlay");
  document.body.appendChild(overlay);

  const wrap = document.createElement("div");
  wrap.classList.add("wrap");
  overlay.appendChild(wrap);

  const fiche = document.createElement("div");
  fiche.classList.add("fiche");
  wrap.appendChild(fiche);

  const close = document.createElement("div");
  close.textContent = "×";
  close.classList.add("close");
  overlay.appendChild(close);

  close.addEventListener("click", () => {
    gsap.to(overlay, { opacity: 0, duration: 1, onComplete: () => overlay.remove() });
    header.classList.remove("fixed");
    projets.classList.remove("fixed");
  });

  const img = document.createElement("img");
  img.src = `img/${sanitizeName(item.titre)}.png`;
  img.onerror = () => {
    img.src = `https://via.placeholder.com/700x400?text=${sanitizeName(item.titre)}`;
  };
  fiche.appendChild(img);

  const title = document.createElement("h1");
  title.textContent = item.titre;
  fiche.appendChild(title);

  const modalContent = document.createElement("div");
  modalContent.innerHTML = item.modale;
  fiche.appendChild(modalContent);

  if (item.images && item.images.trim() !== "") {
    const gallery = document.createElement("div");
    gallery.classList.add("gallery");

    item.images.split(",").forEach(image => {
      const img = document.createElement("img");
      img.src = `img/${sanitizeName(item.titre)}/${image.trim()}`;
      gallery.appendChild(img);
    });

    fiche.appendChild(gallery);
  }

  gsap.from(overlay, { opacity: 0, duration: 0.4 });
};

const init = async () => {
  const csvText = await fetchCSV();
  let data = csvToJson(csvText);

  data = data
    .filter(item => item.titre && item.titre.trim() !== '')
    .slice(0, 6);

  createProjectElements(data);
};

init();

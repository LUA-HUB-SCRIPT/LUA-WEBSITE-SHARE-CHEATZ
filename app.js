
const grid = document.getElementById("linkGrid");
const searchInput = document.getElementById("searchInput");
const filters = document.getElementById("filters");
const emptyState = document.getElementById("emptyState");

let allLinks = [];
let activeCategory = "all";

const icons = {
  software: "▣",
  game: "◈",
  tools: "⚙",
  media: "▶",
  other: "↗"
};

function detectCategory(name) {
  const n = name.toLowerCase();

  if (/roblox|game|minecraft|downhill/.test(n)) return "Game";
  if (/sound|audio|music|mp3|mp4/.test(n)) return "Media";
  if (/tool|utility|helper/.test(n)) return "Tools";
  if (/app|software|exe|apk|assistant/.test(n)) return "Software";

  return "Other";
}

function detectIcon(category) {
  return icons[category.toLowerCase()] || icons.other;
}

function parseTXT(content) {
  const links = [];
  const blocks = content.split(/\r?\n\s*\r?\n/);

  blocks.forEach(block => {
    const name = block.match(/^\s*nama\s*=\s*(.+)$/im);
    const url = block.match(/^\s*link\s*=\s*(https?:\/\/\S+)\s*$/im);

    if (!name || !url) return;

    try {
      const parsed = new URL(url[1]);

      if (!["http:", "https:"].includes(parsed.protocol)) return;

      links.push({
        name: name[1].trim(),
        url: parsed.href,
        category: detectCategory(name[1])
      });
    } catch {
      // Lewati URL yang tidak valid.
    }
  });

  return links;
}

async function loadLinks() {
  try {
    const response = await fetch("sc.txt?v=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("sc.txt tidak ditemukan");
    }

    const text = await response.text();
    allLinks = parseTXT(text);

    document.getElementById("totalLinks").textContent = allLinks.length;
    document.getElementById("totalCategories").textContent =
      new Set(allLinks.map(x => x.category)).size;

    createFilters();
    renderLinks();

  } catch (error) {
    grid.innerHTML = `
      <div class="loading">
        <p>Gagal memuat sc.txt.</p>
        <p>Pastikan file sc.txt tersedia di repository.</p>
      </div>`;
  }
}

function createFilters() {
  const categories = [...new Set(allLinks.map(x => x.category))];

  filters.innerHTML = `
    <button class="filter active" data-category="all">All links</button>
    ${categories.map(category => `
      <button class="filter" data-category="${category}">
        ${category}
      </button>
    `).join("")}
  `;

  filters.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;

      filters.querySelectorAll(".filter").forEach(b =>
        b.classList.toggle("active", b === button)
      );

      renderLinks();
    });
  });
}

function renderLinks() {
  const query = searchInput.value.toLowerCase().trim();

  const filtered = allLinks.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    const matchesCategory =
      activeCategory === "all" ||
      item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  document.getElementById("resultCount").textContent =
    `${filtered.length} RESULTS`;

  grid.innerHTML = "";

  emptyState.hidden = filtered.length !== 0;

  filtered.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "link-card";
    card.style.animationDelay = `${index * 45}ms`;

    const icon = document.createElement("div");
    icon.className = "file-icon";
    icon.textContent = detectIcon(item.category);

    const category = document.createElement("div");
    category.className = "file-category";
    category.textContent = item.category.toUpperCase();

    const name = document.createElement("h3");
    name.className = "file-name";
    name.textContent = item.name;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const source = document.createElement("span");
    source.className = "source";
    source.textContent = new URL(item.url).hostname;

    const link = document.createElement("a");
    link.className = "open-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open link ↗";

    footer.append(source, link);
    card.append(icon, category, name, footer);
    grid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderLinks);

loadLinks();

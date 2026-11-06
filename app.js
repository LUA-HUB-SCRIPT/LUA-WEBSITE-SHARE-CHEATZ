(() => {
  "use strict";
  const cfg = window.LUAHUB_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const grid = $("linkGrid"), status = $("apiStatus"), form = $("submitForm");
  const urlInput = $("linkInput"), charCount = $("charCount");
  const API = `${String(cfg.SUPABASE_URL || "").replace(/\/$/, "")}/functions/v1/links`;
  let allLinks = [];

  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function setStatus(message, error = false) {
    status.textContent = "";
    const dot = document.createElement("span"); dot.className = "status-dot";
    status.append(dot, document.createTextNode(" " + message));
    status.classList.toggle("error", error);
  }
  function headers() {
    return { "Content-Type": "application/json", "apikey": cfg.SUPABASE_ANON_KEY || "" };
  }
  function safeHost(value) {
    try { return new URL(value).hostname; } catch { return "Community link"; }
  }
  function renderLinks(items) {
    grid.replaceChildren();
    $("linkCount").textContent = String(items.length).padStart(2, "0");
    if (!items.length) {
      $("emptyState").classList.remove("hidden");
      return;
    }
    $("emptyState").classList.add("hidden");
    items.forEach(item => {
      const card = document.createElement("article"); card.className = "link-card";
      const top = document.createElement("div"); top.className = "link-card-top";
      const icon = document.createElement("span"); icon.className = "link-icon"; icon.textContent = "↗";
      const tag = document.createElement("span"); tag.className = "approved-tag"; tag.textContent = "✓ APPROVED";
      top.append(icon, tag);
      const title = document.createElement("h3"); title.textContent = item.title || safeHost(item.url);
      const desc = document.createElement("p"); desc.textContent = item.url;
      const open = document.createElement("a"); open.className = "open-link";
      open.href = item.url; open.target = "_blank"; open.rel = "noopener noreferrer";
      open.append(document.createTextNode("OPEN LINK"), document.createTextNode(" ↗"));
      card.append(top, title, desc, open); grid.append(card);
    });
  }
  async function loadLinks() {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes("PASTE_")) {
      grid.innerHTML = '<div class="loading-card">Tambahkan Supabase Publishable/anon key di file <b>config.js</b>, lalu deploy ulang.</div>';
      setStatus("API belum dikonfigurasi", true); return;
    }
    setStatus("Mengambil link publik...");
    try {
      const res = await fetch(API, { headers: { apikey: cfg.SUPABASE_ANON_KEY } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil data.");
      allLinks = Array.isArray(data.links) ? data.links : [];
      renderLinks(allLinks); setStatus("API terhubung • daftar link diperbarui");
    } catch (err) {
      grid.innerHTML = '<div class="loading-card">Tidak bisa terhubung. Periksa URL, key, dan Edge Function Supabase.</div>';
      setStatus(err.message || "Koneksi API gagal", true);
    }
  }
  $("searchInput").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    renderLinks(allLinks.filter(x => `${x.title || ""} ${x.url || ""}`.toLowerCase().includes(q)));
  });
  $("refreshBtn").addEventListener("click", loadLinks);
  urlInput.addEventListener("input", () => charCount.textContent = `${urlInput.value.length}/${cfg.MAX_URL_LENGTH || 20}`);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const url = urlInput.value.trim();
    const message = $("formMessage"), btn = $("submitBtn");
    message.className = "form-message"; message.textContent = "";
    if ($("website").value) return;
    if (url.length > (cfg.MAX_URL_LENGTH || 20)) {
      message.textContent = `URL maksimal ${cfg.MAX_URL_LENGTH || 20} karakter.`; message.classList.add("error"); return;
    }
    let parsed;
    try { parsed = new URL(url); } catch { parsed = null; }
    if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
      message.textContent = "Masukkan URL valid yang diawali http:// atau https://."; message.classList.add("error"); return;
    }
    if (!cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes("PASTE_")) {
      message.textContent = "API belum dikonfigurasi oleh admin."; message.classList.add("error"); return;
    }
    btn.disabled = true; btn.textContent = "Mengirim...";
    try {
      const res = await fetch(API, { method: "POST", headers: headers(), body: JSON.stringify({ url, website: $("website").value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pengiriman gagal.");
      message.textContent = "Link terkirim! Tunggu persetujuan admin sebelum muncul di Explore.";
      form.reset(); charCount.textContent = `0/${cfg.MAX_URL_LENGTH || 20}`;
      toast("Link berhasil dikirim untuk ditinjau.");
    } catch (err) {
      message.textContent = err.message || "Terjadi kesalahan. Coba lagi nanti."; message.classList.add("error");
    } finally { btn.disabled = false; btn.innerHTML = 'Kirim link <span>↗</span>'; }
  });
  $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
  document.querySelectorAll(".nav-link").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));
  loadLinks();
})();
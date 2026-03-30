let selectedFont = "",
  selectedPalette = "",
  selectedAI = "ChatGPT (GPT-4o)",
  selectedPromptStyle = "detail",
  selectedComplexity = 1,
  currentTab = "raw",
  generatedPrompt = "";

// THEME
function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  document.getElementById("toggleThumb").textContent = isLight ? "🌙" : "☀️";
  localStorage.setItem("theme", isLight ? "dark" : "light");
}
(function () {
  const saved = localStorage.getItem("theme");
  const pref = window.matchMedia("(prefers-color-scheme:dark)").matches
    ? "dark"
    : "light";
  const t = saved || pref;
  document.documentElement.setAttribute("data-theme", t);
  const th = document.getElementById("toggleThumb");
  if (th) th.textContent = t === "dark" ? "🌙" : "☀️";
})();

function selectFont(el) {
  document
    .querySelectorAll(".font-item")
    .forEach((f) => f.classList.remove("selected"));
  el.classList.add("selected");
  selectedFont = el.dataset.font;
}
function selectPalette(el) {
  document
    .querySelectorAll(".palette-item")
    .forEach((p) => p.classList.remove("selected"));
  el.classList.add("selected");
  selectedPalette = el.dataset.palette;
}

function selectPill(el, type) {
  el.parentElement
    .querySelectorAll(".pill")
    .forEach((p) => p.classList.remove("selected"));
  el.classList.add("selected");
  if (type === "ai") selectedAI = el.dataset.ai;
  if (type === "style") {
    selectedPromptStyle = el.dataset.style;
    const d = {
      ringkas:
        "Ringkas — prompt padat dan to-the-point, ideal untuk context window kecil.",
      detail:
        "Detail — prompt lengkap dengan spesifikasi teknis jelas, cocok untuk sebagian besar project.",
      "ultra-detail":
        "Ultra Detail — prompt sangat komprehensif, ideal untuk project kompleks yang butuh presisi tinggi.",
    };
    document.getElementById("styleDesc").textContent = d[el.dataset.style];
  }
}

const compDescs = {
  1: "Simple — website bersih dengan fungsionalitas dasar, ideal untuk landing page cepat.",
  2: "Standard — website profesional lengkap dengan animasi dan fitur umum yang solid.",
  3: "Advanced — website kompleks dengan interaksi kaya, animasi canggih, dan UX premium.",
  4: "Premium — website kelas dunia, semua fitur terbaik, performa maksimal, detail tak tertinggal.",
};
function setComplexity(n) {
  selectedComplexity = n;
  for (let i = 1; i <= 4; i++)
    document.getElementById("comp-" + i).classList.toggle("active", i === n);
  document.getElementById("compDesc").textContent = compDescs[n];
}

function getChecked(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(
    (cb) => cb.value,
  );
}

function switchTab(tab, btn) {
  currentTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const raw = document.getElementById("output-textarea");
  const prev = document.getElementById("preview-output");
  if (tab === "raw") {
    raw.style.display = "block";
    prev.style.display = "none";
  } else {
    raw.style.display = "none";
    prev.style.display = "block";
    renderPreview(generatedPrompt);
  }
}

function renderPreview(prompt) {
  const c = document.getElementById("preview-output");
  if (!prompt) {
    c.innerHTML = "";
    return;
  }
  const lines = prompt.split("\n");
  let html = "";
  let inSec = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (i === 0) {
      html += `<div class="preview-intro">${line}</div>`;
      continue;
    }
    if (/^[📌📄🎨🖌️🔤⚙️✨💬🤖📦🏆🧩🧠⚠️]/.test(line)) {
      if (inSec) html += "</div>";
      html += `<div class="preview-section"><div class="preview-heading">${line}</div>`;
      inSec = true;
    } else if (line.startsWith("•") || line.startsWith("→")) {
      html += `<div class="preview-item"><span class="preview-bullet">▸</span><span>${line.replace(/^[•→]\s*/, "")}</span></div>`;
    } else if (line.match(/^\d+\./)) {
      html += `<div class="preview-item"><span class="preview-bullet">▸</span><span>${line}</span></div>`;
    } else if (inSec) {
      html += `<div class="preview-item" style="color:var(--text-muted);font-style:italic">${line}</div>`;
    }
  }
  if (inSec) html += "</div>";
  c.innerHTML = html;
}

function calcScore() {
  let s = 0;
  const ids = ["projectName", "projectGoal", "targetUser"];
  ids.forEach((id) => {
    if (document.getElementById(id).value.trim()) s++;
  });
  if (document.getElementById("industry").value) s++;
  const secs = getChecked("section").length;
  s += secs >= 3 ? 2 : secs > 0 ? 1 : 0;
  if (getChecked("style").length > 0) s++;
  if (getChecked("visual").length > 0) s++;
  if (getChecked("mode").length > 0) s++;
  if (selectedFont) s++;
  if (selectedPalette || document.getElementById("customColor").value) s++;
  if (document.getElementById("cssFramework").value) s++;
  if (document.getElementById("jsFramework").value) s++;
  const feats = getChecked("feature").length;
  s += feats >= 3 ? 2 : feats > 0 ? 1 : 0;
  if (document.getElementById("tone").value) s++;
  if (document.getElementById("language").value) s++;
  if (document.getElementById("codeStructure").value) s++;
  if (getChecked("quality").length >= 3) s++;
  if (document.getElementById("customInstruction").value.trim().length > 20)
    s++;
  return Math.round((s / 20) * 100);
}

function generatePrompt() {
  const v = (id) => document.getElementById(id).value.trim();
  const projectName = v("projectName"),
    projectGoal = v("projectGoal"),
    targetUser = v("targetUser"),
    industry = v("industry");
  const sections = getChecked("section"),
    styles = getChecked("style"),
    visuals = getChecked("visual"),
    modes = getChecked("mode"),
    effects = getChecked("effect");
  const font = selectedFont,
    fontWeight = v("fontWeight"),
    headingStyle = v("headingStyle");
  const paletteVal = selectedPalette,
    customColor = v("customColor");
  const cssFramework = v("cssFramework"),
    jsFramework = v("jsFramework"),
    libs = getChecked("lib");
  const features = getChecked("feature"),
    tone = v("tone"),
    language = v("language"),
    brandPersona = v("brandPersona");
  const codeStructure = v("codeStructure"),
    boilerplate = v("boilerplate"),
    qualities = getChecked("quality");
  const custom = v("customInstruction");
  const isUltra = selectedPromptStyle === "ultra-detail",
    isRingkas = selectedPromptStyle === "ringkas";
  const compLabel = {
    1: "Simple",
    2: "Standard",
    3: "Advanced",
    4: "Premium",
  };
  const compDetail = {
    1: "Fungsionalitas inti saja, hindari kompleksitas berlebihan.",
    2: "Fitur-fitur standar dengan kualitas solid dan konsisten.",
    3: "Animasi kaya, interaksi halus, dan pengalaman pengguna yang premium.",
    4: "Standar tertinggi: desain, performa, aksesibilitas, dan UX. Tidak ada detail yang boleh terlewat.",
  };

  let p = [];

  // INTRO
  if (isRingkas) {
    p.push(`Buat website one page profesional. Target AI: ${selectedAI}.`);
  } else {
    p.push(
      `Kamu adalah senior full-stack developer dan UI/UX designer berpengalaman. Buatkan website one page profesional berdasarkan spesifikasi teknis berikut secara menyeluruh dan akurat. Jangan bertanya, jangan tambahkan yang tidak diminta — langsung hasilkan kode lengkap yang siap digunakan.`,
    );
    if (!isRingkas)
      p.push(
        `[Dioptimalkan untuk: ${selectedAI} | Prompt Style: ${selectedPromptStyle.toUpperCase()} | Complexity: ${compLabel[selectedComplexity]}]`,
      );
  }
  p.push("");

  // PROJECT OVERVIEW
  if (projectName || projectGoal || targetUser || industry) {
    p.push("📌 PROJECT OVERVIEW:");
    if (projectName) p.push(`• Nama Project: "${projectName}"`);
    if (projectGoal) p.push(`• Tujuan Website: ${projectGoal}`);
    if (targetUser) p.push(`• Target Pengguna: ${targetUser}`);
    if (industry) p.push(`• Industri/Niche: ${industry}`);
    if (selectedComplexity > 1)
      p.push(
        `• Tingkat Kompleksitas: ${compLabel[selectedComplexity]} — ${compDetail[selectedComplexity]}`,
      );
    if (brandPersona)
      p.push(
        `• Brand Persona: Desain harus mencerminkan karakter "${brandPersona}"`,
      );
    p.push("");
  }

  // PAGE STRUCTURE
  if (sections.length > 0) {
    p.push("📄 PAGE STRUCTURE:");
    p.push(
      "Susun halaman dengan section berikut secara berurutan dari atas ke bawah:",
    );
    sections.forEach((s, i) => p.push(`${i + 1}. ${s}`));
    if (!isRingkas) {
      p.push("");
      p.push("Ketentuan struktur:");
      p.push(
        '• Setiap section memiliki ID anchor sesuai nama (e.g. id="hero", id="about")',
      );
      p.push("• Navbar berisi link ke semua section menggunakan anchor href");
      p.push("• Footer berisi copyright, navigasi ringkas, dan sosial media");
      if (isUltra) {
        p.push("• Padding vertikal section: minimal 80px desktop, 60px mobile");
        p.push(
          "• Container max-width 1200px centered dengan padding horizontal 24px",
        );
        p.push(
          "• Section genap/ganjil boleh memiliki background berbeda untuk ritme visual",
        );
      }
    }
    p.push("");
  }

  // DESIGN SYSTEM
  if (styles.length || visuals.length || modes.length || effects.length) {
    p.push("🎨 DESIGN SYSTEM:");
    if (styles.length) {
      p.push("Base Style:");
      styles.forEach((s) => p.push(`• ${s}`));
    }
    if (visuals.length) {
      p.push("Visual Treatment:");
      visuals.forEach((v) => p.push(`• ${v}`));
    }
    if (modes.length) {
      p.push("Color Mode:");
      modes.forEach((m) => p.push(`• ${m}`));
    }
    if (effects.length) {
      p.push("Motion & Effects:");
      effects.forEach((e) => p.push(`• ${e}`));
    }
    if (!isRingkas) {
      p.push("");
      p.push("Prinsip desain wajib:");
      p.push("• Spacing sistem berbasis 8px (8, 16, 24, 32, 48, 64, 80, 96px)");
      p.push("• Border radius konsisten: small=6px, medium=12px, large=20px");
      p.push(
        "• Semua warna dan ukuran menggunakan CSS Custom Properties (:root variables)",
      );
      if (isUltra) {
        p.push(
          "• Z-index hierarchy: base=1, card=10, dropdown=100, modal=500, toast=1000",
        );
        p.push(
          "• Setiap komponen harus konsisten visual di seluruh halaman tanpa inkonsistensi",
        );
      }
    }
    p.push("");
  }

  // COLOR PALETTE
  if (customColor || paletteVal) {
    p.push("🖌️ COLOR PALETTE:");
    if (customColor) {
      p.push("Gunakan skema warna kustom berikut:");
      p.push(`• ${customColor}`);
    } else {
      p.push("Gunakan palet warna berikut secara konsisten di seluruh desain:");
      p.push(`• ${paletteVal}`);
    }
    if (!isRingkas) {
      p.push(
        "• Definisikan semua warna sebagai CSS Custom Properties di :root {}",
      );
      p.push(
        "• Pastikan semua kombinasi teks-background memenuhi WCAG contrast ratio 4.5:1",
      );
    }
    p.push("");
  }

  // TYPOGRAPHY
  if (font || fontWeight || headingStyle) {
    p.push("🔤 TYPOGRAPHY:");
    if (font)
      p.push(
        `• Font utama: "${font}" — import dari Google Fonts via CDN link di <head>`,
      );
    if (fontWeight) p.push(`• Font weight preference: ${fontWeight}`);
    if (headingStyle) p.push(`• Heading style: ${headingStyle}`);
    if (!isRingkas) {
      p.push("• Type scale:");
      p.push("  H1: 56–72px desktop / 36–48px mobile — hero headline");
      p.push("  H2: 40–48px desktop / 28–36px mobile — section heading");
      p.push("  H3: 24–32px — sub-judul dan card title");
      p.push("  Body: 16–18px, line-height 1.7");
      p.push("  Caption: 12–14px — meta info dan label");
      p.push("• Letter-spacing heading: -0.02em hingga -0.04em");
    }
    p.push("");
  }

  // TECH STACK
  if (cssFramework || jsFramework || libs.length) {
    p.push("⚙️ TECH STACK:");
    if (cssFramework) p.push(`• CSS: ${cssFramework}`);
    if (jsFramework) p.push(`• JavaScript: ${jsFramework}`);
    if (libs.length) {
      p.push("• Library tambahan (semua via CDN):");
      libs.forEach((l) => p.push(`  → ${l}`));
    }
    if (!isRingkas) {
      p.push("• Semua dependency via CDN — tidak ada npm atau build tool");
      p.push("• Script JS menggunakan defer attribute");
      if (isUltra)
        p.push("• Inisialisasi semua library setelah DOMContentLoaded event");
    }
    p.push("");
  }

  // FUNCTIONAL FEATURES
  if (features.length > 0) {
    p.push("✨ FUNCTIONAL FEATURES:");
    p.push("Implementasikan semua fitur berikut secara penuh dan fungsional:");
    features.forEach((f) => p.push(`• ${f}`));
    p.push("");
  }

  // BEHAVIOR
  if (
    !isRingkas &&
    (effects.length || features.length || selectedComplexity >= 3)
  ) {
    p.push("🧠 BEHAVIOR & INTERACTION:");
    p.push(
      "• Durasi animasi: 200–400ms micro interaction, 400–700ms entrance animation",
    );
    p.push("• Easing: cubic-bezier(0.4, 0, 0.2, 1) untuk semua transisi");
    p.push(
      "• Setiap elemen interaktif harus memiliki :hover, :focus, :active state yang jelas",
    );
    if (features.some((f) => f.includes("scroll spy")))
      p.push(
        "• Scroll spy menggunakan Intersection Observer API, threshold: 0.6",
      );
    if (features.some((f) => f.includes("form")))
      p.push(
        "• Form: validasi onBlur, animasi shake pada error, success state dengan warna hijau",
      );
    if (isUltra) {
      p.push(
        "• prefers-reduced-motion: matikan semua animasi jika user memintanya",
      );
      p.push(
        "• Keyboard navigation: Tab, Enter, Escape berfungsi penuh di semua komponen",
      );
    }
    p.push("");
  }

  // CONTENT
  if (tone || language || brandPersona) {
    p.push("💬 CONTENT & COPYWRITING:");
    if (tone) p.push(`• Tone of voice: ${tone}`);
    if (language) p.push(`• Bahasa konten: ${language}`);
    if (!isRingkas) {
      p.push(
        "• Gunakan placeholder content realistis dan relevan (bukan Lorem Ipsum)",
      );
      p.push("• Headline harus benefit-driven, spesifik, dan persuasif");
      p.push(
        '• CTA button: bahasa aktif dan urgency — "Mulai Sekarang", "Hubungi Kami", dll',
      );
    }
    p.push("");
  }

  // OUTPUT INSTRUCTION
  if (codeStructure || boilerplate || qualities.length) {
    p.push("📦 OUTPUT INSTRUCTION:");
    if (codeStructure) p.push(`• Struktur file: ${codeStructure}`);
    if (boilerplate) p.push(`• HTML Boilerplate: ${boilerplate}`);
    if (qualities.length) {
      p.push("Standar kualitas kode:");
      qualities.forEach((q) => p.push(`• ${q}`));
    }
    if (!isRingkas) {
      p.push(
        "• File dapat langsung dijalankan di browser lokal tanpa server atau build tool",
      );
      p.push(
        "• Gambar: gunakan picsum.photos sebagai placeholder (e.g. https://picsum.photos/800/600)",
      );
      if (isUltra) {
        p.push(
          "• CSS order: reset/base → variables → layout → components → utilities → responsive",
        );
        p.push(
          "• JS order: constants → utility functions → component functions → event listeners → init",
        );
      }
    }
    p.push("");
  }

  // CUSTOM
  if (custom) {
    p.push("🧩 INSTRUKSI TAMBAHAN:");
    p.push(custom);
    p.push("");
  }

  // CLOSING
  p.push("⚠️ MANDATORY RULES:");
  p.push(
    "• Hasilkan kode LENGKAP dan FUNGSIONAL — tidak ada bagian kosong, TODO, atau placeholder kode",
  );
  p.push(
    "• Jangan meminta klarifikasi — ikuti spesifikasi dan generate langsung",
  );
  p.push("• Kode harus langsung bisa dijalankan di browser tanpa modifikasi");
  if (selectedComplexity >= 3)
    p.push(
      "• Perhatikan SETIAP detail visual — spacing, tipografi, warna, dan animasi harus konsisten sempurna",
    );

  generatedPrompt = p.join("\n");

  // SHOW
  const textarea = document.getElementById("output-textarea");
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("statsBar").style.display = "flex";
  document.getElementById("outputTabs").style.display = "flex";
  document.getElementById("qualityBar").style.display = "block";
  textarea.value = generatedPrompt;

  if (currentTab === "raw") {
    textarea.style.display = "block";
    document.getElementById("preview-output").style.display = "none";
  } else {
    textarea.style.display = "none";
    document.getElementById("preview-output").style.display = "block";
    renderPreview(generatedPrompt);
  }

  const words = generatedPrompt.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById("statWords").textContent = words.toLocaleString("id");
  document.getElementById("statChars").textContent =
    generatedPrompt.length.toLocaleString("id");
  document.getElementById("statSections").textContent = (
    generatedPrompt.match(/^[📌📄🎨🖌️🔤⚙️✨💬🤖📦🏆🧩🧠⚠️]/gm) || []
  ).length;

  const score = calcScore();
  document.getElementById("qualityScore").textContent = score + "%";
  setTimeout(() => {
    document.getElementById("qualityFill").style.width = score + "%";
  }, 100);

  if (window.innerWidth < 960)
    document
      .querySelector(".output-panel")
      .scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyOutput() {
  if (!generatedPrompt) return;
  navigator.clipboard.writeText(generatedPrompt).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "⎘ Copy";
      btn.classList.remove("copied");
    }, 2000);
  });
}

function clearOutput() {
  generatedPrompt = "";
  document.getElementById("output-textarea").value = "";
  document.getElementById("output-textarea").style.display = "none";
  document.getElementById("preview-output").innerHTML = "";
  document.getElementById("preview-output").style.display = "none";
  document.getElementById("emptyState").style.display = "flex";
  document.getElementById("statsBar").style.display = "none";
  document.getElementById("outputTabs").style.display = "none";
  document.getElementById("qualityBar").style.display = "none";
  document.getElementById("qualityFill").style.width = "0%";
  currentTab = "raw";
  document
    .querySelectorAll(".tab-btn")
    .forEach((b, i) => b.classList.toggle("active", i === 0));
}

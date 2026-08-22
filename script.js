/* ==========================================================================
   Google Play Description Formatter - Core Script & AI Sanitizer Engine
   ========================================================================== */

// Element References
const editor = document.getElementById("editor");
const previewApp = document.getElementById("previewApp");
const previewWeb = document.getElementById("previewWeb");
const output = document.getElementById("output");

const shortCountText = document.getElementById("shortCountText");
const releaseCountText = document.getElementById("releaseCountText");
const longCountText = document.getElementById("longCountText");
const shortProgressBar = document.getElementById("shortProgressBar");
const releaseProgressBar = document.getElementById("releaseProgressBar");
const longProgressBar = document.getElementById("longProgressBar");
const countTagsCheckbox = document.getElementById("countTagsCheckbox");

const phoneMockup = document.getElementById("phoneMockup");
const webMockup = document.getElementById("webMockup");
const tabApp = document.getElementById("tabApp");
const tabWeb = document.getElementById("tabWeb");

const palette = document.getElementById("palette");
const currentColorBar = document.getElementById("currentColorBar");
const customColorInput = document.getElementById("customColorInput");
const linkModal = document.getElementById("linkModal");
const toast = document.getElementById("toast");

let savedRange = null;
let currentPreviewPlatform = "app";

/* ==========================================================================
   Selection Management
   ========================================================================== */
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0);
  }
}

function restoreSelection() {
  if (!savedRange) return false;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
  return true;
}

editor.addEventListener("mouseup", saveSelection);
editor.addEventListener("keyup", saveSelection);
editor.addEventListener("focus", saveSelection);

/* ==========================================================================
   Formatting Toolbar Commands
   ========================================================================== */
function format(cmd) {
  editor.focus();
  restoreSelection();
  document.execCommand(cmd, false, null);
  update();
}

function wrapTag(tag) {
  editor.focus();
  restoreSelection();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) {
    const el = document.createElement(tag);
    el.textContent = "Text";
    range.insertNode(el);
  } else {
    const content = range.extractContents();
    const el = document.createElement(tag);
    el.appendChild(content);
    range.insertNode(el);
  }
  update();
}

function applyHeading(tag) {
  editor.focus();
  restoreSelection();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const content = range.extractContents();

  const headingEl = document.createElement(tag);
  const boldEl = document.createElement("b");

  if (content.textContent.trim().length === 0) {
    boldEl.textContent = "Header Title";
  } else {
    boldEl.appendChild(content);
  }
  headingEl.appendChild(boldEl);
  range.insertNode(headingEl);

  update();
}

function insertBulletList() {
  editor.focus();
  restoreSelection();
  document.execCommand("insertText", false, "• ");
  update();
}

function insertEmoji(emoji) {
  editor.focus();
  restoreSelection();
  document.execCommand("insertText", false, emoji);
  update();
}

/* Color Picker */
function togglePalette() {
  palette.classList.toggle("hidden");
}

function applyColor(color) {
  editor.focus();
  restoreSelection();

  if (currentColorBar) {
    currentColorBar.style.backgroundColor = color;
  }

  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    const font = document.createElement("font");
    font.setAttribute("color", color);
    font.textContent = "Colored Text";
    range.insertNode(font);
  } else {
    const content = range.extractContents();
    const font = document.createElement("font");
    font.setAttribute("color", color);
    font.appendChild(content);
    range.insertNode(font);
  }

  palette.classList.add("hidden");
  update();
}

palette.addEventListener("click", (e) => {
  if (e.target.dataset.color) {
    applyColor(e.target.dataset.color);
  }
});

document.getElementById("applyCustomColorBtn").addEventListener("click", () => {
  const customColor = customColorInput.value;
  applyColor(customColor);
});

// Close palette on click outside
document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".color-picker-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    palette.classList.add("hidden");
  }
});

/* Link Modal */
function openLinkModal() {
  saveSelection();
  const sel = window.getSelection();
  const text = sel ? sel.toString() : "";
  document.getElementById("linkText").value = text;
  document.getElementById("linkUrl").value = "https://";
  linkModal.classList.remove("hidden");
}

function closeLinkModal() {
  linkModal.classList.add("hidden");
}

function submitLinkModal() {
  const url = document.getElementById("linkUrl").value.trim();
  const text = document.getElementById("linkText").value.trim() || url;

  if (!url) return;

  closeLinkModal();
  editor.focus();
  restoreSelection();

  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.textContent = text;

  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(a);
  }

  update();
}

/* ==========================================================================
   AI & HTML Sanitization Engine (Fix ChatGPT & Gemini Tags)
   ========================================================================== */

/**
 * Stage 1: Pre-process Markdown syntax to HTML
 */
function parseMarkdown(text) {
  if (!text) return "";

  let html = text;

  // Convert Code Blocks & Inline Code to plain text
  html = html.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""));
  html = html.replace(/`([^`]+)`/g, "$1");

  // Headers (# Heading -> <h1><b>Heading</b></h1>)
  html = html.replace(/^### (.*$)/gim, "<h3><b>$1</b></h3>");
  html = html.replace(/^## (.*$)/gim, "<h2><b>$1</b></h2>");
  html = html.replace(/^# (.*$)/gim, "<h1><b>$1</b></h1>");

  // Bold & Italic
  html = html.replace(/\*\*\s?([^\*]+)\s?\*\*/g, "<b>$1</b>");
  html = html.replace(/__\s?([^__]+)\s?__/g, "<b>$1</b>");
  html = html.replace(/\*\s?([^\*]+)\s?\*/g, "<i>$1</i>");
  html = html.replace(/_\s?([^_]+)\s?_/g, "<i>$1</i>");

  // Markdown Links [Text](URL) -> <a href="URL">Text</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes (> Quote)
  html = html.replace(/^>\s?(.*$)/gim, "<blockquote>$1</blockquote>");

  // Markdown Bullet Lists (- Item or * Item or 1. Item) -> • Item
  html = html.replace(/^\s*[\*\-\+]\s+(.*$)/gim, "• $1");
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, "• $1");

  return html;
}

/**
 * Stage 2: Deep HTML Sanitizer & Play Console Tag Enforcement
 */
function sanitize(inputHtml) {
  if (!inputHtml) return "";

  let str = inputHtml;

  // 1. Remove comments
  str = str.replace(/<!---->|<!--[\s\S]*?-->/g, "");

  // 2. Remove AI footnote, carousel elements, and custom angular tags completely
  str = str.replace(/<source-footnote[\s\S]*?<\/source-footnote>/gi, "");
  str = str.replace(/<sources-carousel-inline[\s\S]*?<\/sources-carousel-inline>/gi, "");
  str = str.replace(/<sources-carousel[\s\S]*?<\/sources-carousel>/gi, "");
  str = str.replace(/<footnote[\s\S]*?<\/footnote>/gi, "");
  str = str.replace(/<citation-chip[\s\S]*?<\/citation-chip>/gi, "");

  // 3. Remove custom elements with hyphens (except locale tags like en-US)
  str = str.replace(/<([a-z0-9]+-[a-z0-9-]+)[^>]*>[\s\S]*?<\/\1>/gi, (match, tagName) => {
    if (/^[a-z]{2,3}-[a-z]{2,4}$/i.test(tagName)) {
      return match; // Preserve <en-US> locale tags
    }
    return ""; // Drop custom Angular/web component elements
  });

  // 4. Clean empty spans around bullet points and reconnect orphaned bullet lines
  str = str.replace(/•\s*<span[^>]*>\s*<\/span>\s*/gi, "• ");
  str = str.replace(/•\s*\n+\s*(<b>|<[a-z0-9]+>|[A-Za-z0-9])/gi, "• $1");

  // 5. DOM parsing pass for tag normalization
  if (
    /^\s*#|[\*\-_]{2,}|\[.*\]\(.*\)/.test(str) &&
    !/<[a-z][\s\S]*>/i.test(str)
  ) {
    str = parseMarkdown(str);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(str, "text/html");

  // Purge unwanted elements from DOM
  const dropSelectors = "img, script, style, iframe, center, button, input, source-footnote, footnote, citation-chip, sources-carousel-inline, sources-carousel, c-wiz, g-wiz";
  doc.body.querySelectorAll(dropSelectors).forEach((el) => el.remove());

  // Convert LI to bullet points
  doc.body.querySelectorAll("li").forEach((li) => {
    const bulletText = document.createTextNode("• ");
    const newlineText = document.createTextNode("\n");
    li.replaceWith(bulletText, ...li.childNodes, newlineText);
  });

  // Convert P to linebreaks
  doc.body.querySelectorAll("p").forEach((p) => {
    const spacingText = document.createTextNode("\n\n");
    p.replaceWith(...p.childNodes, spacingText);
  });

  // Convert UL/OL to linebreaks
  doc.body.querySelectorAll("ul, ol").forEach((ul) => {
    const newlineText = document.createTextNode("\n");
    ul.replaceWith(...ul.childNodes, newlineText);
  });

  // Unwrap unsupported container tags (SPAN, DIV, SECTION, ARTICLE, TABLE, etc.) repeatedly
  let hasContainers = true;
  let maxLoop = 50;
  while (hasContainers && maxLoop > 0) {
    maxLoop--;
    const containers = [...doc.body.querySelectorAll("span, div, section, article, header, footer, table, tbody, tr, td, th")];
    if (containers.length === 0) {
      hasContainers = false;
      break;
    }
    let unwrappedAny = false;
    containers.forEach((container) => {
      const isLocale = /^[A-Z]{2,3}(-[A-Z]{2,4})?$/i.test(container.tagName);
      if (!isLocale) {
        container.replaceWith(...container.childNodes);
        unwrappedAny = true;
      }
    });
    if (!unwrappedAny) break;
  }

  // Normalize STRONG -> B, EM -> I, H4-H6 -> H3
  doc.body.querySelectorAll("strong").forEach((el) => {
    const b = document.createElement("b");
    b.innerHTML = el.innerHTML;
    el.replaceWith(b);
  });
  doc.body.querySelectorAll("em").forEach((el) => {
    const i = document.createElement("i");
    i.innerHTML = el.innerHTML;
    el.replaceWith(i);
  });
  doc.body.querySelectorAll("h4, h5, h6").forEach((el) => {
    const h3 = document.createElement("h3");
    h3.innerHTML = el.innerHTML;
    el.replaceWith(h3);
  });

  // Ensure H1-H3 headers have inner <b>
  doc.body.querySelectorAll("h1, h2, h3").forEach((h) => {
    if (!h.querySelector("b")) {
      const b = document.createElement("b");
      b.innerHTML = h.innerHTML;
      h.innerHTML = "";
      h.appendChild(b);
    }
  });

  // Clean attributes on all elements: keep only href on <a> and color on <font>
  doc.body.querySelectorAll("*").forEach((node) => {
    const tag = node.tagName.toUpperCase();
    const attrs = [...node.attributes];
    attrs.forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      if (tag === "FONT" && attrName === "color") {
        const val = attr.value.trim();
        if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val) || /^[a-zA-Z]+$/.test(val)) {
          return;
        }
      }
      if (tag === "A" && attrName === "href") {
        let hrefVal = attr.value.trim();
        if (!/^https?:\/\//i.test(hrefVal) && !/^mailto:/i.test(hrefVal)) {
          hrefVal = "https://" + hrefVal;
          node.setAttribute("href", hrefVal);
        }
        return;
      }
      node.removeAttribute(attr.name);
    });
  });

  let cleanHtml = doc.body.innerHTML;

  // Clean empty tags
  let prev;
  do {
    prev = cleanHtml;
    cleanHtml = cleanHtml.replace(/<(font|b|i|u|small|sup|sub|blockquote)>\s*<\/\1>/gi, "");
  } while (cleanHtml !== prev);

  // Re-connect orphaned bullet points after tag unwrapping
  cleanHtml = cleanHtml.replace(/•\s*\n+\s*(<b>|<[a-z0-9]+>|[A-Za-z0-9])/gi, "• $1");
  cleanHtml = cleanHtml.replace(/•\s*(?=\n|•|$)/g, "");

  // Preserve uppercase region codes in locale tags (<en-us> -> <en-US>, <es-es> -> <es-ES>, <pt-br> -> <pt-BR>)
  cleanHtml = cleanHtml.replace(/<\/?([a-z]{2,3})-([a-z]{2,4})>/gi, (match, lang, region) => {
    const isClosing = match.startsWith("</");
    const tag = `${lang.toLowerCase()}-${region.toUpperCase()}`;
    return isClosing ? `</${tag}>` : `<${tag}>`;
  });

  // Final string normalization
  cleanHtml = cleanHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/ \./g, ".")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanHtml;
}

/* ==========================================================================
   Update & Live Rendering Pipeline
   ========================================================================== */
function update() {
  const rawContent = editor.innerHTML;
  const sanitizedHtml = sanitize(rawContent);

  // Update Previews
  previewApp.innerHTML = sanitizedHtml;
  previewWeb.innerHTML = sanitizedHtml;

  // Process HTML Entity Encoding Toggle (& vs &amp;)
  const encodeEntitiesCheckbox = document.getElementById("encodeEntitiesCheckbox");
  const encodeEntities = encodeEntitiesCheckbox ? encodeEntitiesCheckbox.checked : true;

  let finalConsoleOutput = sanitizedHtml;
  if (encodeEntities) {
    // Encode raw '&' into '&amp;' (if not already part of an HTML entity)
    finalConsoleOutput = finalConsoleOutput.replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#[xX][0-9a-fA-F]+;)/g, "&amp;");
  } else {
    // Decode '&amp;' back to raw '&'
    finalConsoleOutput = finalConsoleOutput.replace(/&amp;/g, "&");
  }

  // Update Console Output Textarea
  output.value = finalConsoleOutput;

  // Update Counters & Progress Bars
  updateCounters(finalConsoleOutput);
}

/* ==========================================================================
   Counters & Progress Bars
   ========================================================================== */
function updateCounters(cleanHtml) {
  const includeTags = countTagsCheckbox.checked;

  let length = 0;
  if (includeTags) {
    length = cleanHtml.length;
  } else {
    // Strip HTML tags for visual text length
    length = cleanHtml.replace(/<[^>]+>/g, "").length;
  }

  // Short Description (80 Limit)
  shortCountText.textContent = `${length} / 80`;
  const shortPct = Math.min(100, (length / 80) * 100);
  shortProgressBar.style.width = `${shortPct}%`;

  if (length > 80) {
    shortProgressBar.className = "progress-fill over";
    shortCountText.className = "count-val over";
  } else if (length >= 68) {
    shortProgressBar.className = "progress-fill warning";
    shortCountText.className = "count-val";
  } else {
    shortProgressBar.className = "progress-fill";
    shortCountText.className = "count-val";
  }

  // Release Notes (500 Limit)
  if (releaseCountText && releaseProgressBar) {
    releaseCountText.textContent = `${length} / 500`;
    const releasePct = Math.min(100, (length / 500) * 100);
    releaseProgressBar.style.width = `${releasePct}%`;

    if (length > 500) {
      releaseProgressBar.className = "progress-fill over";
      releaseCountText.className = "count-val over";
    } else if (length >= 450) {
      releaseProgressBar.className = "progress-fill warning";
      releaseCountText.className = "count-val";
    } else {
      releaseProgressBar.className = "progress-fill";
      releaseCountText.className = "count-val";
    }
  }

  // Long Description (4000 Limit)
  longCountText.textContent = `${length} / 4000`;
  const longPct = Math.min(100, (length / 4000) * 100);
  longProgressBar.style.width = `${longPct}%`;

  if (length > 4000) {
    longProgressBar.className = "progress-fill over";
    longCountText.className = "count-val over";
  } else if (length >= 3600) {
    longProgressBar.className = "progress-fill warning";
    longCountText.className = "count-val";
  } else {
    longProgressBar.className = "progress-fill";
    longCountText.className = "count-val";
  }
}

/* ==========================================================================
   AI Action Tools
   ========================================================================== */
document.getElementById("cleanAiBtn").addEventListener("click", () => {
  const currentHtml = editor.innerHTML;
  const cleaned = sanitize(currentHtml);
  editor.innerHTML = cleaned;
  update();
  showToast("✨ AI text cleaned & Play Store formatted!");
});

document.getElementById("convertMarkdownBtn").addEventListener("click", () => {
  const rawText = editor.innerText || editor.textContent;
  const converted = parseMarkdown(rawText);
  const cleaned = sanitize(converted);
  editor.innerHTML = cleaned;
  update();
  showToast("📝 Converted Markdown to Play Store HTML!");
});

const formatReleaseNotesBtn = document.getElementById("formatReleaseNotesBtn");
if (formatReleaseNotesBtn) {
  formatReleaseNotesBtn.addEventListener("click", () => {
    let currentHtml = editor.innerHTML;
    let cleaned = sanitize(currentHtml);

    if (!/<[a-z]{2,3}(-[a-z]{2,4})?>/i.test(cleaned)) {
      if (!cleaned.trim()) {
        cleaned = "Enter or paste your release notes for en-US here";
      }
      cleaned = `<en-US>\n${cleaned}\n</en-US>`;
    }

    editor.innerHTML = cleaned;
    update();
    showToast("🚀 Formatted as Standard <en-US> Play Release Notes!");
  });
}

const formatCompactReleaseNotesBtn = document.getElementById("formatCompactReleaseNotesBtn");
if (formatCompactReleaseNotesBtn) {
  formatCompactReleaseNotesBtn.addEventListener("click", async () => {
    let currentText = editor.innerText || editor.textContent;
    if (!currentText.trim()) {
      const defaultText = "<en-US>\n• <b>Performance:</b> Faster load times & stability improvements.\n• <b>Bug Fixes:</b> Solved minor UI crashes.\n</en-US>";
      editor.innerHTML = sanitize(defaultText);
      update();
      showToast("⚡ Formatted as Compact <en-US> Release Notes!");
      return;
    }

    if (getGeminiApiKey()) {
      const originalBtnText = formatCompactReleaseNotesBtn.innerHTML;
      formatCompactReleaseNotesBtn.disabled = true;
      formatCompactReleaseNotesBtn.innerHTML = `<span class="spinner"></span> Compacting...`;
      try {
        const prompt = `Condense the following release notes / text into ULTRA-SHORT, SUPER CONCISE Google Play Store Release Notes wrapped in <en-US>...</en-US> tags.
STRICT LIMIT: MAXIMUM 3 bullet points, under 250 characters total length. Format: • <b>Title:</b> Short sentence.

INPUT TEXT:
${currentText}`;
        const rawAi = await callGeminiApi(prompt);
        const cleaned = sanitize(rawAi);
        editor.innerHTML = cleaned;
        update();
        showToast("⚡ Generated Compact <en-US> Release Notes!");
      } catch (err) {
        let cleaned = sanitize(editor.innerHTML);
        if (!/<[a-z]{2,3}(-[a-z]{2,4})?>/i.test(cleaned)) {
          cleaned = `<en-US>\n${cleaned}\n</en-US>`;
        }
        editor.innerHTML = cleaned;
        update();
        showToast("⚡ Formatted as <en-US> Release Notes!");
      } finally {
        formatCompactReleaseNotesBtn.disabled = false;
        formatCompactReleaseNotesBtn.innerHTML = originalBtnText;
      }
    } else {
      let cleaned = sanitize(editor.innerHTML);
      if (!/<[a-z]{2,3}(-[a-z]{2,4})?>/i.test(cleaned)) {
        cleaned = `<en-US>\n${cleaned}\n</en-US>`;
      }
      editor.innerHTML = cleaned;
      update();
      showToast("⚡ Formatted as <en-US> Release Notes!");
    }
  });
}

document.getElementById("bestPracticesBtn").addEventListener("click", () => {
  let cleaned = sanitize(editor.innerHTML);

  // Wrap any plain <h1>Header</h1> in <b>
  cleaned = cleaned.replace(/<h1>(?!\s*<b>)(.*?)<\/h1>/gi, "<h1><b>$1</b></h1>");
  cleaned = cleaned.replace(/<h2>(?!\s*<b>)(.*?)<\/h2>/gi, "<h2><b>$1</b></h2>");
  cleaned = cleaned.replace(/<h3>(?!\s*<b>)(.*?)<\/h3>/gi, "<h3><b>$1</b></h3>");

  editor.innerHTML = cleaned;
  update();
  showToast("✨ ASO Best Practices Applied!");
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (editor.innerHTML.trim() && !confirm("Are you sure you want to clear all text?")) {
    return;
  }
  editor.innerHTML = "";
  update();
  showToast("Cleared editor.");
});

/* ==========================================================================
   Platform Switcher (App vs Web View)
   ========================================================================== */
function switchPreviewPlatform(platform) {
  currentPreviewPlatform = platform;

  if (platform === "app") {
    tabApp.classList.add("active");
    tabWeb.classList.remove("active");

    phoneMockup.classList.remove("hidden");
    webMockup.classList.add("hidden");
  } else {
    tabWeb.classList.add("active");
    tabApp.classList.remove("active");

    webMockup.classList.remove("hidden");
    phoneMockup.classList.add("hidden");
  }
}

/* ==========================================================================
   Copy & Download Handlers
   ========================================================================== */
function copyOutputHTML() {
  const val = output.value;
  if (!val) {
    showToast("Nothing to copy!");
    return;
  }
  navigator.clipboard.writeText(val).then(() => {
    showToast("📋 Play Store HTML copied to clipboard!");
  });
}

function copyPlainText() {
  const cleanHtml = output.value;
  const plainText = cleanHtml.replace(/<[^>]+>/g, "");
  if (!plainText) {
    showToast("Nothing to copy!");
    return;
  }
  navigator.clipboard.writeText(plainText).then(() => {
    showToast("📄 Plain text copied to clipboard!");
  });
}

function downloadText() {
  const val = output.value;
  if (!val) {
    showToast("Nothing to download!");
    return;
  }
  const blob = new Blob([val], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "google_play_description.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("💾 File downloaded!");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

/* ==========================================================================
   Theme Management
   ========================================================================== */
const themeToggleBtn = document.getElementById("themeToggleBtn");

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

themeToggleBtn.addEventListener("click", toggleTheme);

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

/* ==========================================================================
   Event Listeners
   ========================================================================== */
editor.addEventListener("input", update);
countTagsCheckbox.addEventListener("change", update);

editor.addEventListener("paste", (e) => {
  setTimeout(() => {
    const rawContent = editor.innerHTML;
    const cleaned = sanitize(rawContent);
    editor.innerHTML = cleaned;
    update();
  }, 10);
});

// Initial update on page load
update();

/* ==========================================================================
   Gemini API Key Management & Free Tier AI Engine
   ========================================================================== */

const apiKeyModal = document.getElementById("apiKeyModal");
const commitModal = document.getElementById("commitModal");
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const geminiModelSelect = document.getElementById("geminiModelSelect");
const keyStatusText = document.getElementById("keyStatusText");
const apiKeyBadgeText = document.getElementById("apiKeyBadgeText");

function getGeminiApiKey() {
  return localStorage.getItem("gemini_api_key") || "";
}

function setGeminiApiKey(key) {
  if (key) {
    localStorage.setItem("gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("gemini_api_key");
  }
  updateApiKeyStatusUI();
}

function getGeminiModel() {
  const model = localStorage.getItem("gemini_model");
  // If stored model is deprecated (e.g. gemini-2.0-flash), default to gemini-1.5-flash
  if (!model || model === "gemini-2.0-flash" || model === "gemini-2.0-flash-lite") {
    return "gemini-1.5-flash";
  }
  return model;
}

function setGeminiModel(model) {
  if (model) {
    localStorage.setItem("gemini_model", model);
  }
}

function updateApiKeyStatusUI() {
  const key = getGeminiApiKey();
  const model = getGeminiModel();
  if (key) {
    if (keyStatusText) {
      keyStatusText.textContent = `Saved (${model}) ✓`;
      keyStatusText.className = "status-saved";
    }
    if (apiKeyBadgeText) {
      apiKeyBadgeText.textContent = `🔑 Key Saved (${model}) ✓`;
    }
  } else {
    if (keyStatusText) {
      keyStatusText.textContent = "No Key Saved";
      keyStatusText.className = "status-missing";
    }
    if (apiKeyBadgeText) {
      apiKeyBadgeText.textContent = "🔑 Gemini Key";
    }
  }
}

function openApiKeyModal() {
  const currentKey = getGeminiApiKey();
  const currentModel = getGeminiModel();
  if (geminiApiKeyInput) {
    geminiApiKeyInput.value = currentKey;
  }
  if (geminiModelSelect) {
    geminiModelSelect.value = currentModel;
  }
  updateApiKeyStatusUI();
  apiKeyModal.classList.remove("hidden");
}

function closeApiKeyModal() {
  apiKeyModal.classList.add("hidden");
}

function saveApiKeyModal() {
  const key = geminiApiKeyInput.value.trim();
  const model = geminiModelSelect ? geminiModelSelect.value : "gemini-1.5-flash";
  if (!key) {
    showToast("Please enter a valid Gemini API Key!");
    return;
  }
  setGeminiApiKey(key);
  setGeminiModel(model);
  closeApiKeyModal();
  showToast(`🔑 Saved Key & Model (${model})!`);
}

function removeApiKey() {
  setGeminiApiKey("");
  if (geminiApiKeyInput) geminiApiKeyInput.value = "";
  showToast("API Key removed.");
}

function toggleApiKeyVisibility() {
  const btn = document.getElementById("toggleApiKeyVisibilityBtn");
  if (geminiApiKeyInput.type === "password") {
    geminiApiKeyInput.type = "text";
    btn.textContent = "Hide";
  } else {
    geminiApiKeyInput.type = "password";
    btn.textContent = "Show";
  }
}

document.getElementById("apiKeyBtn")?.addEventListener("click", openApiKeyModal);

/* Commit Modal Controls */
function openCommitModal() {
  commitModal.classList.remove("hidden");
  document.getElementById("commitInput").focus();
}

function closeCommitModal() {
  commitModal.classList.add("hidden");
}

document.getElementById("aiCommitBtn")?.addEventListener("click", () => {
  if (!getGeminiApiKey()) {
    openApiKeyModal();
    showToast("Please enter your Gemini API key first!");
    return;
  }
  openCommitModal();
});

/* ==========================================================================
   Gemini API Call Engine
   ========================================================================== */
const GEMINI_SYSTEM_INSTRUCTION = `You are an expert Google Play Store ASO (App Store Optimization) copywriter.
Your task is to write high-converting, professional app descriptions and release notes for Google Play Store.

CRITICAL PLAY STORE HTML TAG RULES:
1. ONLY use supported Google Play HTML tags: <b>, <i>, <u>, <font color="#HEX">, <small>, <sup>, <sub>, <blockquote>, <h1>, <h2>, <h3>, <a>, and <en-US> locale tags.
2. DO NOT use <span>, <div>, <p>, <ul>, <ol>, <li>, <code>, <pre>, style, or custom CSS classes.
3. For bullet lists, use standard bullet symbol '• ' (e.g. • <b>Feature Title:</b> Description).
4. Keep content clean, concise, and structured.`;

async function callGeminiApi(prompt, systemInstruction = GEMINI_SYSTEM_INSTRUCTION, requestedModel = null) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    openApiKeyModal();
    throw new Error("Gemini API Key missing. Please set your free API key.");
  }

  const model = requestedModel || getGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  let response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `Gemini API Error (HTTP ${response.status})`;

    // If model is deprecated or unavailable, auto-fallback to gemini-1.5-flash or gemini-2.5-flash
    if (msg.includes("no longer available") || msg.includes("NOT_FOUND") || msg.includes("not found")) {
      const fallbackModel = model === "gemini-1.5-flash" ? "gemini-2.5-flash" : "gemini-1.5-flash";
      console.warn(`Model ${model} unavailable. Falling back to ${fallbackModel}...`);
      setGeminiModel(fallbackModel);
      return await callGeminiApi(prompt, systemInstruction, fallbackModel);
    }

    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No output generated from Gemini API.");
  }

  return text;
}

/* ==========================================================================
   AI Action Functions
   ========================================================================== */

/* 1. Commit Messages -> Release Notes */
async function submitCommitReleaseNotes() {
  const commitsText = document.getElementById("commitInput").value.trim();
  if (!commitsText) {
    showToast("Please paste commit messages or changelog first!");
    return;
  }

  const btn = document.getElementById("generateCommitReleaseNotesBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generating...`;

  const versionRadio = document.querySelector('input[name="releaseNoteVersion"]:checked');
  const version = versionRadio ? versionRadio.value : "standard";

  try {
    let prompt = "";
    if (version === "compact") {
      prompt = `Convert the following raw git commit log / developer changelog into ULTRA-SHORT, COMPACT Google Play Store Release Notes wrapped in <en-US>...</en-US> tags.
STRICT LIMIT: MAXIMUM 3 bullet points, under 250 characters total length. Format: • <b>Title:</b> Short user-facing sentence. Filter out internal dev noise (like merge commits, CI/CD, gradle updates, refractors).

RAW COMMITS/CHANGELOG:
${commitsText}`;
    } else {
      prompt = `Convert the following raw git commit log / developer changelog into clean, professional Google Play Store Release Notes wrapped in <en-US>...</en-US> tags.
Limit total release notes to MAXIMUM 500 characters constraint. Use • <b>Title:</b> Description bullet points. Filter out internal dev noise (like merge commits, CI/CD, gradle updates, refractors) and focus on user-facing benefits and fixes.

RAW COMMITS/CHANGELOG:
${commitsText}`;
    }

    const rawAiOutput = await callGeminiApi(prompt);
    const cleaned = sanitize(rawAiOutput);

    closeCommitModal();
    editor.innerHTML = cleaned;
    update();
    showToast(`📦 Generated ${version === "compact" ? "Compact" : "Standard"} Play Release Notes!`);
  } catch (err) {
    alert("Gemini AI Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/* 2. ASO Optimize */
document.getElementById("aiAsoBtn")?.addEventListener("click", async () => {
  const currentText = editor.innerText || editor.textContent;
  if (!currentText.trim()) {
    showToast("Please enter or paste an app description to optimize!");
    return;
  }

  if (!getGeminiApiKey()) {
    openApiKeyModal();
    showToast("Please enter your Gemini API key first!");
    return;
  }

  const btn = document.getElementById("aiAsoBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Optimizing...`;

  try {
    const prompt = `Rewrite and optimize the following app description for Google Play Store ASO (App Store Optimization) and SEO.
Enhance keyword formatting, wrap key sections in <h2><b>Header Title</b></h2>, format bullet lists as • <b>Feature:</b> Description, and make the text highly engaging for downloads.

CURRENT DESCRIPTION:
${currentText}`;

    const rawAiOutput = await callGeminiApi(prompt);
    const cleaned = sanitize(rawAiOutput);

    editor.innerHTML = cleaned;
    update();
    showToast("🎯 Description ASO & SEO Optimized!");
  } catch (err) {
    alert("Gemini AI Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

/* 3. Shorten Text */
document.getElementById("aiShortenBtn")?.addEventListener("click", async () => {
  const currentText = editor.innerText || editor.textContent;
  if (!currentText.trim()) {
    showToast("Please enter text to shorten!");
    return;
  }

  if (!getGeminiApiKey()) {
    openApiKeyModal();
    showToast("Please enter your Gemini API key first!");
    return;
  }

  const btn = document.getElementById("aiShortenBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Shortening...`;

  try {
    const prompt = `Condense and shorten the following app description to fit within Google Play Store character limits while retaining all core value propositions and clean • <b>Header:</b> Text formatting.

TEXT TO SHORTEN:
${currentText}`;

    const rawAiOutput = await callGeminiApi(prompt);
    const cleaned = sanitize(rawAiOutput);

    editor.innerHTML = cleaned;
    update();
    showToast("✂️ Shortened text successfully!");
  } catch (err) {
    alert("Gemini AI Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

/* 4. Expand Text */
document.getElementById("aiExpandBtn")?.addEventListener("click", async () => {
  const currentText = editor.innerText || editor.textContent;
  if (!currentText.trim()) {
    showToast("Please enter text to expand!");
    return;
  }

  if (!getGeminiApiKey()) {
    openApiKeyModal();
    showToast("Please enter your Gemini API key first!");
    return;
  }

  const btn = document.getElementById("aiExpandBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Expanding...`;

  try {
    const prompt = `Expand the following app description into a full, feature-rich Google Play Store app listing. Include an engaging overview, key feature section with • <b>Feature:</b> Description bullet points, user benefits, and call to action.

TEXT TO EXPAND:
${currentText}`;

    const rawAiOutput = await callGeminiApi(prompt);
    const cleaned = sanitize(rawAiOutput);

    editor.innerHTML = cleaned;
    update();
    showToast("📈 Expanded description!");
  } catch (err) {
    alert("Gemini AI Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// Initialize API Key UI Status on load
updateApiKeyStatusUI();

// Event listener for HTML Entity Encoding toggle
document.getElementById("encodeEntitiesCheckbox")?.addEventListener("change", update);

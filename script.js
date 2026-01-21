const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const output = document.getElementById("output");

const shortCount = document.getElementById("shortCount");
const longCount = document.getElementById("longCount");
const palette = document.getElementById("palette");

let savedRange = null;

/* ===============================
   SELECTION HANDLING
================================ */
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount) {
    savedRange = sel.getRangeAt(0);
  }
}

editor.addEventListener("mouseup", saveSelection);
editor.addEventListener("keyup", saveSelection);
editor.addEventListener("blur", saveSelection);

/* ===============================
   FORMATTING ACTIONS
================================ */
function format(cmd) {
  document.execCommand(cmd, false, null);
  update();
}

function wrapTag(tag) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const content = range.extractContents();

  const el = document.createElement(tag);
  el.appendChild(content);
  range.insertNode(el);

  update();
}

function applyColor(color) {
  if (!savedRange) return;

  editor.focus();

  const range = savedRange;
  const content = range.extractContents();
  if (!content.textContent.trim()) return;

  const font = document.createElement("font");
  font.setAttribute("color", color);
  font.appendChild(content);
  range.insertNode(font);

  const sel = window.getSelection();
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.setStartAfter(font);
  newRange.collapse(true);
  sel.addRange(newRange);
  savedRange = newRange;

  update();
}

/* ===============================
   SANITIZATION (DOM BASED)
================================ */
function sanitize(html) {
  /* ===============================
     STAGE 0 — HARD STRIP AI METADATA
  ================================ */
  html = html
    .replace(/\sdata-[a-zA-Z0-9-]+="[^"]*"/g, "")
    .replace(/\sdata-[a-zA-Z0-9-]+='[^']*'/g, "");

  /* ===============================
     STAGE 1 — PARSE HTML
  ================================ */
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const allowedTags = new Set([
    "B",
    "I",
    "U",
    "FONT",
    "SMALL",
    "BIG",
    "SUP",
    "SUB",
    "BLOCKQUOTE",
    "A",
    "H1",
    "H2",
    "BR",
  ]);

  function clean(node) {
    if (node.nodeType === Node.TEXT_NODE) return;

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;

      /* Normalize STRONG / EM */
      if (tag === "STRONG") {
        const b = document.createElement("b");
        b.innerHTML = node.innerHTML;
        node.replaceWith(b);
        clean(b);
        return;
      }

      if (tag === "EM") {
        const i = document.createElement("i");
        i.innerHTML = node.innerHTML;
        node.replaceWith(i);
        clean(i);
        return;
      }

      /* Handle lists safely */
      if (tag === "LI") {
        node.replaceWith(
          document.createTextNode("• "),
          ...node.childNodes,
          document.createTextNode("\n")
        );
        return;
      }

      if (tag === "UL" || tag === "OL") {
        node.replaceWith(...node.childNodes, document.createTextNode("\n"));
        return;
      }

      /* Paragraphs → spacing */
      if (tag === "P") {
        node.replaceWith(...node.childNodes, document.createTextNode("\n\n"));
        return;
      }

      /* Remove unsupported tags but keep content */
      if (!allowedTags.has(tag)) {
        node.replaceWith(...node.childNodes);
        return;
      }

      /* Remove all attributes */
      [...node.attributes].forEach((attr) => {
        if (
          tag === "FONT" &&
          attr.name === "color" &&
          /^#[0-9A-Fa-f]{6}$/.test(attr.value)
        )
          return;

        if (tag === "A" && attr.name === "href") return;

        node.removeAttribute(attr.name);
      });
    }

    [...node.childNodes].forEach(clean);
  }

  [...doc.body.childNodes].forEach(clean);

  /* ===============================
     STAGE 2 — FINAL NORMALIZATION
  ================================ */
  return doc.body.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/* ===============================
   UPDATE PIPELINE
================================ */
function update() {
  const clean = sanitize(editor.innerHTML);
  preview.innerHTML = clean;
  output.value = clean;
  updateCounters(clean);
}

/* ===============================
   CHARACTER COUNTER
================================ */
function updateCounters(text) {
  const length = text.replace(/<[^>]+>/g, "").length;

  shortCount.textContent = `Short: ${length} / 80`;
  longCount.textContent = `Long: ${length} / 4000`;

  shortCount.classList.toggle("over", length > 80);
  longCount.classList.toggle("over", length > 4000);
}

/* ===============================
   PALETTE
================================ */
function togglePalette() {
  palette.classList.toggle("hidden");
}

palette.addEventListener("click", (e) => {
  if (!e.target.dataset.color) return;
  applyColor(e.target.dataset.color);
});

/* ===============================
   EVENTS
================================ */
editor.addEventListener("input", update);
editor.addEventListener("paste", () => setTimeout(update, 60));

/* ===============================
   UTIL
================================ */
function copyOutput() {
  output.select();
  document.execCommand("copy");
}

function resetAll() {
  editor.innerHTML = "";
  preview.innerHTML = "";
  output.value = "";
  updateCounters("");
}

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const output = document.getElementById("output");

function format(cmd) {
  document.execCommand(cmd, false, null);
  update();
}

function wrapTag(tag) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const content = range.extractContents();

  const el = document.createElement(tag);
  el.appendChild(content);

  range.insertNode(el);
  update();
}

let savedRange = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0);
  }
}

editor.addEventListener("mouseup", saveSelection);
editor.addEventListener("keyup", saveSelection);
editor.addEventListener("blur", saveSelection);

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

  // Restore cursor
  const sel = window.getSelection();
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.setStartAfter(font);
  newRange.collapse(true);
  sel.addRange(newRange);

  savedRange = newRange;
  update();
}

function normalizeEditorHTML(html) {
  return html
    .replace(/<span style="font-weight:\s*bold[^"]*">/gi, "<b>")
    .replace(/<\/span>/gi, "</b>")
    .replace(/<span style="font-style:\s*italic[^"]*">/gi, "<i>")
    .replace(/<span style="text-decoration:\s*underline[^"]*">/gi, "<u>");
}

function sanitize(html) {
  return (
    html
      // Remove MS Word junk
      .replace(/class="[^"]*"/gi, "")
      .replace(/<o:p>|<\/o:p>/gi, "")

      .replace(/<span[^>]*>/gi, (m) => {
        const color = m.match(/color:\s*(#[0-9a-fA-F]{3,6})/);
        return color ? `<font color="${color[1]}">` : "";
      })
      .replace(/<\/span>/gi, "</font>")

      .replace(/style="[^"]*"/gi, (match) =>
        match.includes("color") ? match : ""
      )

      // Normalize strong/em
      .replace(/<strong>/gi, "<b>")
      .replace(/<\/strong>/gi, "</b>")
      .replace(/<em>/gi, "<i>")
      .replace(/<\/em>/gi, "</i>")

      // Kill div & p, convert to breaks
      .replace(/<div[^>]*>/gi, "")
      .replace(/<\/div>/gi, "<br />")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "<br /><br />")

      // Convert lists to bullets
      .replace(/<ul[^>]*>/gi, "")
      .replace(/<\/ul>/gi, "<br />")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/li>/gi, "<br />")

      // Remove unsupported tags completely
      .replace(/<hr[^>]*>/gi, "<br />")
      .replace(
        /<(?!\/?(b|i|u|br|h1|h2|a|blockquote|small|big|sup|sub|font)\b)[^>]+>/gi,
        ""
      )

      // Clean excessive breaks
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
      .trim()
  );
}

function update() {
  const normalized = normalizeEditorHTML(editor.innerHTML);
  const clean = sanitize(normalized);
  preview.innerHTML = clean;
  output.value = clean;
  updateCounters(clean);
}

editor.addEventListener("input", update);
editor.addEventListener("paste", () => {
  setTimeout(update, 50); // wait for browser paste
});

// Count charecters
const shortCount = document.getElementById("shortCount");
const longCount = document.getElementById("longCount");

function updateCounters(text) {
  const length = text.replace(/<[^>]+>/g, "").length;

  shortCount.textContent = `Short: ${length} / 80`;
  longCount.textContent = `Long: ${length} / 4000`;

  shortCount.classList.toggle("over", length > 80);
  longCount.classList.toggle("over", length > 4000);
}

// Color palette
const palette = document.getElementById("palette");

function togglePalette() {
  palette.classList.toggle("hidden");
}

palette.addEventListener("click", (e) => {
  if (!e.target.dataset.color) return;
  applyColor(e.target.dataset.color);
});

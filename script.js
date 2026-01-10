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

function applyColor() {
  const color = prompt("Enter HEX color (e.g. #a32345):");
  if (!color || !/^#([0-9A-F]{3}){1,2}$/i.test(color)) return;

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const content = range.extractContents();

  const font = document.createElement("font");
  font.setAttribute("color", color);
  font.appendChild(content);

  range.insertNode(font);
  update();
}

function sanitize(html) {
  return (
    html
      // Remove MS Word junk
      .replace(/class="[^"]*"/gi, "")
      .replace(/style="[^"]*"/gi, "")
      .replace(/<o:p>|<\/o:p>/gi, "")
      .replace(/<span[^>]*>|<\/span>/gi, "")

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
  const clean = sanitize(editor.innerHTML);
  preview.innerHTML = clean;
  output.value = clean;
}

editor.addEventListener("input", update);
editor.addEventListener("paste", () => {
  setTimeout(update, 50); // wait for browser paste
});

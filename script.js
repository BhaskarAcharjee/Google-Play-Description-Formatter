const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const output = document.getElementById("output");

function format(cmd) {
  document.execCommand(cmd, false, null);
  update();
}

function sanitize(html) {
  return html
    .replace(/<strong>/g, "<b>")
    .replace(/<\/strong>/g, "</b>")
    .replace(/<em>/g, "<i>")
    .replace(/<\/em>/g, "</i>")
    .replace(/<div>/g, "")
    .replace(/<\/div>/g, "<br />")
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "<br /><br />")
    .replace(/<ul>/g, "")
    .replace(/<\/ul>/g, "")
    .replace(/<li>/g, "• ")
    .replace(/<\/li>/g, "<br />")
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "")
    .replace(/<o:p>/g, "")
    .replace(/<\/o:p>/g, "");
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

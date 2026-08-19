# 📱 Google Play Description Formatter & AI Sanitizer

> **A professional, production-ready App Store Optimization (ASO) editor for formatting Google Play Console app descriptions, fixing unsupported AI tags from ChatGPT & Gemini, and previewing Android App vs Web store listings.**

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Google Play Console](https://img.shields.io/badge/Google%20Play-Console%20Compatible-00E676?logo=google-play)

---

## 🌟 Key Features

### 1. ⚡ Fix ChatGPT & Gemini Unsupported Tags & Citation Footnotes
When copying generated app descriptions from AI models (ChatGPT, Gemini, Claude) or rich text editors (Microsoft Word, Google Docs), they often introduce unsupported HTML/CSS tags (`<div>`, `<span>`, `<p>`, `<ul>`, `<li>`, `<table>`, `<code>`, `<style>`, inline `style="..."` attributes) and internal AI citation footnotes (`<source-footnote>`, `<sources-carousel-inline>`, `ng-version`, `_nghost-*`) that break Play Console.
- **Automatic Multi-Pass Sanitization**: Strips invalid container tags, citation chips, and custom Angular elements while preserving text.
- **Bullet List Conversion**: Automatically converts `<ul><li>` list structures into clean Unicode bullet points (`• `).
- **Markdown Conversion**: Automatically parses Markdown syntax (`**bold**`, `*italic*`, `# Headings`, `[Link](URL)`, `- list items`) into 100% valid Google Play Console HTML.

### 2. 🤖 Gemini API Integration & AI Tool Suite (Free Tier)
Connect your free Google Gemini API key to unlock direct AI copywriting features in your browser:
- **📦 Commit Log ➔ Release Notes**: Auto-converts raw `git log` output, PR titles, or developer notes into concise Play Store Release Notes (< 500 chars) wrapped in `<en-US>` tags.
- **🎯 ASO & SEO Optimizer**: Rewrites app descriptions to boost Google Play Store keyword density and conversion formatting.
- **✂️ Shorten & 📈 Expand**: One-click actions to condense text to fit Play Console character constraints or generate detailed feature sections.

### 3. 🚀 Play Store Release Notes (What's New) & Locale Tag Support
- **500 Character Limit Constraint**: Dedicated character counter and visual progress bar for Google Play Release Notes (500 limit).
- **Locale Tag Support**: Formats notes wrapped in `<en-US>...</en-US>` (or custom locale tags) for Play Console and Fastlane deployments.

### 4. 📱 Dual Platform Live Preview (Android App vs Web Store)
Google Play Store renders descriptions differently on the Android App compared to `play.google.com` on desktop browsers:
- **📱 Android App View**: Shows full support for colored text (`<font color="...">`), left blue border lines on `<blockquote>`, and bold headings.
- **🌐 Play Store Web View**: Demonstrates web fallbacks where font colors and blockquote borders are stripped according to Google Play specifications.

### 5. ✍️ Rich WYSIWYG Editor & ASO Toolbar
- **Formatting Tools**: Bold (`<b>`), Italic (`<i>`), Underline (`<u>`), Small (`<small>`), Superscript (`<sup>`), Subscript (`<sub>`), Blockquotes (`<blockquote>`), Headings (`<h1>`, `<h2>`, `<h3>`).
- **Color Picker**: Curated ASO preset color swatches + custom hex color picker for `<font color="...">`.
- **Link Builder**: Insert Play Store links (`<a href="...">`).
- **Quick Emojis**: One-click emoji palette (`★`, `✓`, `🚀`, `🔥`, `⚡`, `⭐`, `📱`, `▶`, `•`).
- **Best Practices One-Click Fix**: Wraps headings in `<b>` tags (`<h1><b>Header</b></h1>`) per Play Console best practices.

### 6. 📊 Live Character Counters & Progress Indicators
- **Short Description**: Track against the **80 character limit**.
- **Release Notes (What's New)**: Track against the **500 character limit**.
- **Long Description**: Track against the **4000 character limit**.
- **HTML Tag Inclusion Toggle**: Option to calculate character counts with or without HTML tags (matching Play Console's raw string character count rules).
- **Visual Alert System**: Progress bar changes color from green to orange and red when reaching or exceeding character limits.

---

## 📋 Google Play Store HTML Compatibility Matrix

| HTML Tag / Code | Play Store (Android App) | Play.google.com (Web) | Best Practice & Notes |
| :--- | :---: | :---: | :--- |
| `http://phiture.com` | ✅ Clickable | ✅ Clickable | Plain URLs automatically convert to links on both platforms. |
| `<a href="http://...">Link</a>` | ✅ Supported | ✅ Supported | Best practice: `<a href="http://phiture.com">Link:</a> http://phiture.com` |
| `<font color="#DC2626">Text</font>` | ✅ Renders Color | ⚠️ Strips Color (Plain) | Use valid Hex values (e.g. `#DC2626`) for best mobile rendering. |
| `<u>Underline</u>` | ✅ Supported | ✅ Supported | Renders underlined text. |
| `<i>Italic</i>` | ✅ Supported | ✅ Supported | Replaces markdown `*italic*` or `<em>` tags. |
| `<b>Bold</b>` | ✅ Supported | ✅ Supported | Replaces markdown `**bold**` or `<strong>` tags. |
| `<h1>Header 1</h1>` | ✅ Bold Header | ℹ️ Standard Header | Best practice: `<h1><b>Header 1</b></h1>` |
| `<h2>Header 2</h2>` | ✅ Bold Header | ℹ️ Standard Header | Best practice: `<h2><b>Header 2</b></h2>` |
| `<h3>Header 3</h3>` | ✅ Bold Header | ℹ️ Standard Header | Best practice: `<h3><b>Header 3</b></h3>` |
| `✓ ☆ 👍 Emojis` | ✅ Supported | ✅ Supported | UTF-8 standard emojis supported. Renders based on system font. |
| `&raquo; &amp; Entities` | ✅ Supported | ✅ Supported | Standard HTML character entities render cleanly (e.g. `»`, `&`). |
| `A<br />B` or `\n` | ✅ Line Break | ✅ Line Break | Line breaks are natively supported in Google Play. |
| `<small>Small</small>` | ✅ Supported | ✅ Supported | Renders slightly smaller font size. |
| `<sup>Sup</sup>` / `<sub>Sub</sub>` | ✅ Supported | ✅ Supported | Renders superscript and subscript characters. |
| `<blockquote>Text</blockquote>` | ✅ Blue Left Border | ⚠️ No Border (Plain) | Renders a blue accent left border line on Android App. |
| `<img>`, `<font size>`, `<center>` | ❌ Not Supported | ❌ Not Supported | Tested & rejected by Play Console. Stripped automatically by our tool. |
| `<div>`, `<span>`, `<p>`, `<ul>`, `<li>`, `style` | ❌ Not Supported | ❌ Not Supported | ChatGPT/Gemini tags. Stripped or converted to `• bullets` & `\n`. |

---

## 🚀 Quick Start / Local Setup

No server setup or build process required! This app is built with vanilla HTML5, CSS3, and ES6 JavaScript.

### Option 1: Direct File Opening
1. Clone or download this repository:
   ```bash
   git clone https://github.com/BhaskarAcharjee/Google-Play-Description-Formatter.git
   ```
2. Double-click `index.html` to open it in your browser (Chrome, Firefox, Edge, Safari).

### Option 2: Run with Local Live Server
```bash
# Install live-server or use VS Code Live Server extension
npx live-server .
```

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism & Custom Properties), ES6 JavaScript.
- **Typography**: Google Fonts (`Inter`, `Roboto`, `Fira Code`).
- **Dependencies**: 0 External Runtime Dependencies (Lightweight, instant loading).

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

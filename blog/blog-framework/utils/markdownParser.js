const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

// Sehr einfacher und direkter Ansatz ohne viel Logik
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        // Füge keine komplexe Logik hinzu - einfach nur Syntax-Highlighting
        if (lang && hljs.getLanguage(lang)) {
            try {
                // Standard-Highlighting-Funktionalität
                return '<pre class="hljs"><code class="language-' + lang + '">' +
                    hljs.highlight(str, {language: lang, ignoreIllegals: true}).value +
                    '</code></pre>';
            } catch (__) {
            }
        }

        // Fallback für unbekannte Sprachen
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

// Ersetze den Standard-Renderer für Codeblöcke
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : '';
    const langName = info.split(/\s+/g)[0];

    // Füge eine Sprachkennzeichnung hinzu
    let header = '';
    if (langName) {
        header = '<div class="code-block-header">' + langName + '</div>';
    }

    // Verwende die Highlight-Funktion
    const code = options.highlight(token.content, langName, '');

    // Rückgabe mit Header
    return header + code;
};

function parseFrontMatter(content) {
    return matter(content);
}

function renderMarkdown(content) {
    return md.render(content);
}

module.exports = {
    parseFrontMatter,
    renderMarkdown
};
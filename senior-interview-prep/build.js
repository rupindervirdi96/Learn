// Builds index.html (a single self-contained study app) from content/*.md
// Usage: node build.js
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUT_FILE = path.join(__dirname, 'index.html');

// ---------- Mini Markdown renderer (headings, code, tables, lists, quotes, raw <details>) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  // swap code spans for placeholders so bold/italic can wrap them
  const codes = [];
  const withSlots = text.replace(/`([^`]+)`/g, (_, c) => '\u0000' + (codes.push(c) - 1) + '\u0000');
  return esc(withSlots)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]\d][^\]]*)\](?![(])/g, '<span class="fill">[$1]</span>')
    .replace(/\u0000(\d+)\u0000/g, (_, n) => '<code>' + esc(codes[n]) + '</code>');
}

const KEYWORDS = 'const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|type|interface|as|satisfies|keyof|infer|true|false|null|undefined|this|yield|static|void|never|unknown|FROM|RUN|COPY|WORKDIR|ENV|EXPOSE|CMD|USER';
function highlight(code, lang) {
  const hashComments = /^(ya?ml|dockerfile|bash|sh)$/i.test(lang || '');
  const re = new RegExp(
    '(' + (hashComments ? '#[^\\n]*|' : '') + '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
    "|('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)" +
    '|\\b(' + KEYWORDS + ')\\b' +
    '|\\b(\\d+(?:\\.\\d+)?)\\b', 'g');
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
    out += '<span class="t-' + cls + '">' + esc(m[0]) + '</span>';
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

function splitRow(line) {
  const cells = [];
  let cur = '', inCode = false;
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (const ch of s) {
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function render(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  let checkIdx = 0;
  const isBlockStart = l =>
    /^(#{1,4} |```|>|\||\s*[-*] |\s*\d+\. |<\/?details|<summary)/.test(l) || l.trim() === '';

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    // raw details/summary passthrough
    if (/^<details>/.test(line.trim())) { html.push('<details class="qa">'); i++; continue; }
    if (/^<\/details>/.test(line.trim())) { html.push('</details>'); i++; continue; }
    const sm = line.trim().match(/^<summary>(.*)<\/summary>$/);
    if (sm) { html.push('<summary><span class="q">' + inline(sm[1]) + '</span></summary><div class="ans">'); i++;
      // close .ans right before </details>
      let depth = 0, j = i;
      for (; j < lines.length; j++) {
        if (/^<details>/.test(lines[j].trim())) depth++;
        if (/^<\/details>/.test(lines[j].trim())) { if (depth === 0) break; depth--; }
      }
      lines.splice(j, 0, '<!--/ans-->');
      continue;
    }
    if (line.trim() === '<!--/ans-->') { html.push('</div>'); i++; continue; }

    // headings
    const h = line.match(/^(#{1,4}) (.*)$/);
    if (h) {
      const level = h[1].length;
      const id = h[2].toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      html.push('<h' + level + ' id="' + id + '">' + inline(h[2]) + '</h' + level + '>');
      i++; continue;
    }

    // fenced code
    const f = line.match(/^```(\w*)/);
    if (f) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html.push('<div class="code"><button class="copy" type="button">Copy</button><pre><code data-lang="' +
        (f[1] || '') + '">' + highlight(buf.join('\n'), f[1]) + '</code></pre></div>');
      continue;
    }

    // blockquote
    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, ''));
      const parts = buf.join('\n').split(/\n\s*\n/);
      if (parts[0].startsWith('🔁')) {
        // follow-up questions: each "**Q: ...** answer" becomes a collapsible item
        const items = parts.slice(1).map(p => {
          const m = p.replace(/\n/g, ' ').match(/^\*\*Q: (.+?)\*\*\s*([\s\S]*)$/);
          if (!m) return '<p>' + inline(p.replace(/\n/g, ' ')) + '</p>';
          return '<details class="fu"><summary>' + inline(m[1]) + '</summary><p>' + inline(m[2]) + '</p></details>';
        });
        html.push('<div class="followups"><div class="fu-label">🔁 Follow-up questions <span>try answering before you open each one</span></div>' +
          items.join('') + '</div>');
      } else if (parts[0].startsWith('🎤')) {
        // spoken mock answer: label + paragraphs in a styled card
        const paras = parts.slice(1).map(p => '<p>' + inline(p.replace(/\n/g, ' ')) + '</p>');
        html.push('<div class="mock"><div class="mock-label">🎤 Mock answer <span>say it out loud</span></div>' +
          paras.join('') + '</div>');
      } else {
        html.push('<blockquote>' + parts.map(p => '<p>' + inline(p.replace(/\n/g, ' ')) + '</p>').join('') + '</blockquote>');
      }
      continue;
    }

    // table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      const thead = head.some(c => c) ? '<thead><tr>' + head.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>' : '';
      html.push('<div class="table-wrap"><table>' + thead + '<tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }

    // lists (one nesting level)
    if (/^\s*([-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) {
        const indent = lines[i].match(/^\s*/)[0].length;
        const text = lines[i].replace(/^\s*([-*]|\d+\.) /, '');
        if (indent >= 2 && items.length) items[items.length - 1].children.push(text);
        else items.push({ text, children: [] });
        i++;
        // continuation lines
        while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
          const tgt = items[items.length - 1];
          if (tgt.children.length) tgt.children[tgt.children.length - 1] += ' ' + lines[i].trim();
          else tgt.text += ' ' + lines[i].trim();
          i++;
        }
      }
      const li = t => {
        const task = t.match(/^\[( |x)\] (.*)$/);
        if (task) {
          return '<li class="task"><label><input type="checkbox" class="chk" data-chk="' + (checkIdx++) + '"' +
            (task[1] === 'x' ? ' checked' : '') + '> ' + inline(task[2]) + '</label>';
        }
        return '<li>' + inline(t);
      };
      const tag = ordered ? 'ol' : 'ul';
      html.push('<' + tag + '>' + items.map(it => li(it.text) +
        (it.children.length ? '<ul>' + it.children.map(c => li(c) + '</li>').join('') + '</ul>' : '') + '</li>').join('') +
        '</' + tag + '>');
      continue;
    }

    // paragraph
    const buf = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    html.push('<p>' + inline(buf.join(' ')) + '</p>');
  }
  return html.join('\n');
}

// ---------- Build ----------
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md')).sort();
const chapters = files.map(file => {
  const md = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
  const title = (md.match(/^# (.*)$/m) || [, file])[1];
  const id = file.replace(/\.md$/, '');
  return { id, title, html: render(md) };
});

const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const data = JSON.stringify(chapters).replace(/</g, '\\u003c');
fs.writeFileSync(OUT_FILE, template.replace('/*__CHAPTERS__*/[]', data));

const qCount = chapters.reduce((n, c) => n + (c.html.match(/<details class="qa">/g) || []).length, 0);
console.log('Built ' + OUT_FILE + ': ' + chapters.length + ' chapters, ' + qCount + ' questions.');

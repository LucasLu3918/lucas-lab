#!/usr/bin/env python3
"""Regenerates the self-hosted heading font (Noto Serif TC 600, SIL OFL 1.1) as two unicode-range slices.

Run after `npm run build`, whenever headings gain characters the slices do not cover:
    python3 scripts/subset-fonts.py
Glyphs outside the slices fall back to the system serif, so a missed character is cosmetic, never broken.
Slices: a = home page + shared punctuation, b = other pages. Story and chapter pages (stories/<slug>/...) and the search page use the system serif and are skipped,
so they stay inside their page-weight budgets. Each page downloads only the slices it uses.
The subsets come from the Google Fonts CSS API (text= parameter); the font files are committed so the site never calls Google at runtime.
"""
import glob, html, re, sys, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}
PUNCT = '：，、。？！「」（）—·×'


def heading_chars(path):
    out = set()
    for m in re.finditer(r'<(h1|h2)[^>]*>(.*?)</\1>', Path(path).read_text(encoding='utf8'), re.S):
        out |= set(html.unescape(re.sub(r'<[^>]+>', '', m.group(2))))
    return {c for c in out if ord(c) > 0x2E80}


def main():
    dist = ROOT / 'dist'
    if not (dist / 'index.html').exists():
        sys.exit('Run npm run build first.')
    home = heading_chars(dist / 'index.html') | set(PUNCT)
    others = set()
    for f in glob.glob(str(dist / '**/*.html'), recursive=True):
        rel = Path(f).relative_to(dist).as_posix()
        if rel == 'index.html' or rel.startswith('games/blood-mirror/play'):
            continue
        if (rel.startswith('stories/') and rel != 'stories/index.html') or rel == 'search/index.html':
            continue
        others.update(heading_chars(f))
    a = home
    b = others - a
    for name, chars in (('a', a), ('b', b)):
        text = ''.join(sorted(chars))
        url = 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600&display=swap&text=' + urllib.parse.quote(text)
        css = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read().decode()
        src = re.search(r'url\((https://[^)]+)\)', css).group(1)
        data = urllib.request.urlopen(urllib.request.Request(src, headers=UA)).read()
        (ROOT / 'assets' / f'noto-serif-tc-{name}.woff2').write_bytes(data)
        points = sorted(ord(ch) for ch in chars)
        ranges, start = [], points[0]
        for prev, cur in zip(points, points[1:] + [None]):
            if cur is None or cur != prev + 1:
                ranges.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
                start = cur
        print(f'/* {name}: {len(chars)} chars, {len(data)} bytes */')
        print(f'src: noto-serif-tc-{name}.woff2; unicode-range: {",".join(ranges)}')


if __name__ == '__main__':
    main()

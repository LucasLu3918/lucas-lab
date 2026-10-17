#!/usr/bin/env python3
"""Export the fairy-tale source note for each card to a small TypeScript module.

The scene prompts stay in tarot-art/prompts.json (used only at render time). The site
only needs the source note for each card, so that is all this writes.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PROMPTS = HERE / 'prompts.json'
OUT = ROOT / 'src' / 'vue' / 'site' / 'features' / 'tarot' / 'tarotArtSources.ts'


def main():
    data = json.loads(PROMPTS.read_text(encoding='utf-8'))
    rows = [('back', data['back']['source'])] + [(card['id'], card['source']) for card in data['cards']]
    lines = [
        '// Generated from tarot-art/prompts.json by tarot-art/export_sources.py. Do not edit by hand.',
        'export const TAROT_ART_SOURCES: Record<string, string> = {',
    ]
    for card_id, source in rows:
        lines.append(f'  {json.dumps(card_id)}: {json.dumps(source, ensure_ascii=False)},')
    lines.append('};')
    OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'wrote {len(rows)} entries to {OUT}')


if __name__ == '__main__':
    main()

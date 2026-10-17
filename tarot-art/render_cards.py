#!/usr/bin/env python3
"""Render the 78 Starlit Tarot card illustrations one at a time.

Every render uses the same style prefix, seed and step count, so the set stays consistent.
Raw PNGs go to tarot-art/cards/ (with a manifest entry each). Web WebP files go to
assets/tarot/cards/. Existing outputs are skipped, so an interrupted run can resume.

Usage: python3 tarot-art/render_cards.py [--only <id>] [--dry-run]
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PROMPTS = HERE / 'prompts.json'
RAW_DIR = HERE / 'cards'
WEB_DIR = ROOT / 'assets' / 'tarot-cards'
MANIFEST_TOOL = Path.home() / '.claude/skills/local-image-model-router/scripts/manifest.py'
RAW_W, RAW_H = 768, 1152
WEB_W, WEB_H = 576, 864


def build_jobs(data):
    jobs = [{'id': data['back']['file'], 'scene': data['back']['scene'], 'raw': 'card-back'}]
    for card in data['cards']:
        jobs.append({'id': card['id'], 'scene': card['scene'], 'raw': card['id']})
    return jobs


def render(job, data, dry_run):
    raw = RAW_DIR / f"{job['raw']}.png"
    web = WEB_DIR / f"{job['raw']}.webp"
    if web.exists():
        return 'skip'
    prompt = f"{data['style']}. {job['scene']}"
    if dry_run:
        print(job['id'], '|', prompt[:120], '...')
        return 'dry'
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        cmd = [
            sys.executable, str(MANIFEST_TOOL), 'generate',
            '--model', data['model'],
            '--output', str(raw),
            '--width', str(RAW_W), '--height', str(RAW_H),
            '--steps', str(data['steps']), '--seed', str(data['seed']),
            '--prompt', prompt,
            '--purpose', f"Starlit Tarot card art: {job['id']}",
        ]
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        if result.returncode != 0 or not raw.exists():
            print('FAILED', job['id'], result.stderr[-800:], file=sys.stderr)
            return 'failed'
    # ffmpeg here has no WebP encoder, so scale to PNG first and encode with cwebp.
    scaled = RAW_DIR / f"{job['raw']}-web.png"
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw),
        '-vf', f'scale={WEB_W}:{WEB_H}:flags=lanczos', str(scaled),
    ], check=True)
    subprocess.run(['cwebp', '-quiet', '-q', '84', str(scaled), '-o', str(web)], check=True)
    scaled.unlink()
    return 'done'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    data = json.loads(PROMPTS.read_text(encoding='utf-8'))
    jobs = build_jobs(data)
    if args.only:
        jobs = [j for j in jobs if j['id'] == args.only or j['raw'] == args.only]
    counts = {}
    for index, job in enumerate(jobs, 1):
        status = render(job, data, args.dry_run)
        counts[status] = counts.get(status, 0) + 1
        print(f'[{index}/{len(jobs)}] {job["id"]}: {status}', flush=True)
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == '__main__':
    os.chdir(ROOT)
    main()

import type { InjectionKey } from 'vue';
import { TAROT_ART_SOURCES } from './tarotArtSources';
import type { TarotCard } from './tarot';

// Base URL of the card artwork folder (assets/tarot/cards/). The static page sets it on the island root.
export const TAROT_ART_BASE_KEY: InjectionKey<string> = Symbol('tarot-art-base');

export function cardArtUrl(base: string, card: Pick<TarotCard, 'id'>): string {
  return `${base}${card.id}.webp`;
}

export function cardBackUrl(base: string): string {
  return `${base}card-back.webp`;
}

export function cardSource(card: Pick<TarotCard, 'id'>): string {
  return TAROT_ART_SOURCES[card.id] ?? '';
}

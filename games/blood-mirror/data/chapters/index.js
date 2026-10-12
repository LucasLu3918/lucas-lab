// Chapter order is the reading order. Saves store chapter ids, so new chapters can be
// inserted here without breaking existing journeys (see engine/save.js).
import library from './library.js';
import ballroom from './ballroom.js';
import hunter from './hunter.js';
import mine from './mine.js';
import crypt from './crypt.js';
import queen from './queen.js';
import mirror from './mirror.js';

export const chapters = [library, ballroom, hunter, mine, crypt, queen, mirror];

// Speakers (說話者) of the chapters' scenes and portraits, for the dialogue box and the read log. `portrait`
// names a file in assets/portraits/; the narrator has none and shows the mirror icon instead. Snow White
// is the second-person "妳" and never speaks.
export const NARRATOR='narrator';
export const speakers={
  narrator: { name: '旁白' },
  mirror: { name: '魔鏡', portrait: 'mirror' },
  eli: { name: '伊萊', portrait: 'eli' },
  orion: { name: '奧瑞恩王子', portrait: 'orion' },
  nyla: { name: '奈菈', portrait: 'nyla' },
  heso: { name: '赫索', portrait: 'heso' },
  lucy: { name: '露西', portrait: 'lucy' },
  hunter: { name: '獵人', portrait: 'hunter' },
  vera: { name: '薇菈王后', portrait: 'vera' }
};

// Chapter order is the reading order. Saves store chapter ids, so new chapters can be
// inserted here without breaking existing journeys (see engine/save.js).
import library from './library.js';
import mine from './mine.js';
import crypt from './crypt.js';
import queen from './queen.js';
import mirror from './mirror.js';

export const chapters = [library, mine, crypt, queen, mirror];

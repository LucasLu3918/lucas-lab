// Public surface of the game engine. UI code imports from here, never from the files behind it.
export {rooms,items,endings,memorySpots,visibleSpots,inspect,collect,collectShard,markGlow,restoreClues,solve,judgeInterrogation,travel,chooseEnding,journeyComplete,choose,choiceDefs,choiceVariant,validAnswers,queenResponse,queenResponses,unlockText,shardIds,PROLOGUE_SHARD} from './rules.js';
export {initialState,restoreState} from './state.js';
export {achievements,unlockAchievements} from './achievements.js';
export {SAVE_KEY,LEGACY_SAVE_KEY,LEGACY_PUZZLE_KEY,SAVE_FORMAT,MAX_SAVE_BYTES,PROLOGUE_PUZZLE,toSaveV2,fromSaveV2,loadSave,remapV1,writeSave,exportSave,parseSave} from './save.js';
export {clueWords,clueGroups} from '../data/clues.js';

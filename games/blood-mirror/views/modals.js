// Modal markup for the blood-mirror screens: seal screens, the journal, settings, endings, the replay picker,
// hints and the story copy. Every function returns HTML (or text) only; main.js opens the modal and binds its buttons.
// Kept in one module on purpose: the first screen then makes one request for all of this markup, not seven.
import {conceptMarkup} from '../concept-art.js';
import {icon} from '../icons.js';

// ---- seals.js ----
export const prerequisiteNote=name=>name?`<p class="modal-note">需要物品：${name}。妳可以先檢視謎題。</p>`:'';

export const evidenceGateMarkup=({gate,evidenceLabel})=>`<p class="modal-text">${gate}</p><button id="seal-evidence" class="primary-button">檢視${evidenceLabel} ⟶</button><button id="seal-close" class="secondary-button">繼續探索</button>`;

export const solvedMarkup=unlock=>`<p class="modal-text">${unlock}</p><button id="solved-close" class="primary-button">繼續探索</button><button id="solved-replay" class="secondary-button">選擇小遊戲重玩</button>`;

export const codeSealMarkup=prerequisite=>`${conceptMarkup('clock',{className:'concept-mechanism',decorative:true})}`
 +`<p class="modal-text">錶蓋的刻字：「鐘聲在前，代價在後。」</p>${prerequisite}`
 +`<form id="code-form" class="puzzle-form"><label for="code">轉動四個刻度</label>`
 +`<input id="code" class="code-input" inputmode="numeric" pattern="[0-9]{4}" autocomplete="off" maxlength="4" placeholder="· · · ·" aria-describedby="feedback" required>`
 +`<p id="feedback" class="puzzle-feedback" role="status"></p><button class="primary-button" type="submit">解開封印 ⟶</button></form>`;

export const sequenceSealMarkup=({prompt,options,prerequisite})=>`<p class="modal-text">${prompt}</p>${prerequisite}`
 +`<div id="sequence" class="sequence-display" aria-live="polite"></div>`
 +`<div class="puzzle-options">${options.map(o=>`<button data-option="${o.id}"><span>${o.symbol}</span>${o.label}</button>`).join('')}</div>`
 +`<p id="feedback" class="puzzle-feedback" role="status"></p>`
 +`<button id="submit-seq" class="primary-button" disabled>確認順序 ⟶</button><button id="clear-seq" class="secondary-button">重新排列</button>`;

// `lead` is the prerequisite note, or the queen's reply to the previous answer (or the no-right-answer note).
export const questionSealMarkup=({question,answered,lead})=>`${lead}`
 +`<p class="question-progress">QUESTION 0${answered+1}</p><p class="question-text">${question.text}</p>`
 +question.options.map(o=>`<button class="choice-option" data-answer="${o.id}">${o.label} <span>⟶</span></button>`).join('')
 +`<p id="feedback" class="puzzle-feedback" role="status"></p><button id="questions-reset" class="secondary-button">回到第一問</button>`;

export const nameSealMarkup=options=>`<p class="modal-text">魔鏡問：「誰的名字，仍讓王國的生命抵押繼續？」</p>`
 +options.map(o=>`<button class="choice-option" data-name="${o.id}">${o.label} <span>⟶</span></button>`).join('')
 +`<p id="feedback" class="puzzle-feedback" role="status"></p>`;

// The success screen after a seal opens. `queenLines` is only set for the act whose seal the queen answers.
export const sealSuccessMarkup=({queenLines,unlock,solved,total,note,nextLabel})=>`<div class="success-gem">${icon('facet')}</div>`
 +(queenLines?`<ul class="queen-responses">${queenLines.map(line=>`<li>${line}</li>`).join('')}</ul>`:'')
 +`<p class="modal-text">${unlock}</p>`
 +`<p class="modal-note">真相碎片 ${solved} / ${total}${note}</p>`
 +`<button class="primary-button" id="success-next">${nextLabel} ⟶</button>`
 +`<button class="secondary-button" id="success-replay">選擇小遊戲重玩</button>`
 +`<button class="secondary-button" id="success-stay">留在此處探索</button>`;

// ---- settings.js ----
const pressed=on=>on?'已開啟':'開啟';

export function settingsMarkup({muted,reduceMotion,largeText,typewriter,vibrateSupported,vibrate,story,playlogEnabled,playlogHtml,saveFailed,volumes}){
 const volumeRows=[['master','主音量'],['music','音樂'],['sfx','音效'],['ambience','環境音']]
  .map(([name,label])=>`<label class="settings-slider"><span>${label}</span><input type="range" min="0" max="100" step="5" value="${Math.round(volumes[name]*100)}" data-volume="${name}" aria-label="${label}音量"></label>`).join('');
 return `<div class="settings-row"><span>場景配樂與音效</span><button id="setting-sound">${muted?'關閉':'開啟'}</button></div>`
  +`<div class="settings-row"><span>減少動畫</span><button id="setting-motion" aria-pressed="${reduceMotion}">${pressed(reduceMotion)}</button></div>`
  +`<div class="settings-row"><span>較大閱讀文字</span><button id="setting-text" aria-pressed="${largeText}">${pressed(largeText)}</button></div>`
  +`<div class="settings-row"><span>逐字顯示對話<small class="settings-hint">逐字顯示時，點一下對話框可立即顯示整句</small></span><button id="setting-typewriter" aria-pressed="${typewriter}">${pressed(typewriter)}</button></div>`
  +(vibrateSupported?`<div class="settings-row"><span>震動回饋<small class="settings-hint">解開封印、答錯或收取物品時輕震</small></span><button id="setting-vibrate" aria-pressed="${vibrate}">${pressed(vibrate)}</button></div>`:'')
  +`<div class="settings-row"><span>遊玩模式<small class="settings-hint">解謎模式隱藏提示；故事模式保留下一步建議</small></span><button id="setting-mode">${story?'故事模式':'解謎模式'}</button></div>`
  +`<div class="settings-row"><span>單人試玩紀錄<small class="settings-hint">記錄自己的遊玩過程，只存在此裝置</small></span><button id="setting-playlog" aria-pressed="${playlogEnabled}">${playlogEnabled?'記錄中':'開啟'}</button></div>`
  +(playlogEnabled?playlogHtml:'')
  +`<div class="settings-row"><span>儲存狀態</span><span>${saveFailed?'此瀏覽器無法儲存':'此裝置自動存檔'}</span></div>`
  +`<fieldset class="settings-volume"><legend>音量</legend>${volumeRows}</fieldset>`
  +`<div class="settings-row"><span>攜帶存檔<small class="settings-hint">匯出成檔案，在另一台裝置匯入繼續</small></span><span class="settings-pair"><button id="save-export">匯出</button><button id="save-import">匯入</button></span></div>`
  +`<input id="save-file" type="file" accept="application/json,.json" hidden>`
  +`<button id="setting-reset" class="secondary-button danger-button">重設本次旅程</button>`
  +`<p class="modal-note">存檔只儲存遊戲進度，不收集姓名、帳號或個人資料。關閉網頁後，下次可從首頁繼續。</p>`;
}

// Session summary: one row per act with minutes, restore time, the slowest stage, wrong seals and hints.
// `stageName(row)` returns the label of the slowest stage in that act.
export function playlogPanelMarkup(rows,stageName){
 const table=rows.length
   ?`<table class="playlog-table"><thead><tr><th>章節</th><th>分鐘</th><th>修復</th><th>最久機關</th><th>答錯</th><th>提示</th></tr></thead><tbody>${rows.map(r=>`<tr${r.stalled.length?' class="playlog-stall"':''}><td>${r.title}</td><td>${r.minutes??'進行中'}</td><td>${r.restoreMinutes??'—'}</td><td>${r.longest?stageName(r)+' '+r.longest.minutes+(r.stalled.length?' ⚠':''):'—'}</td><td>${r.fails}</td><td>${r.hint} / 3</td></tr>`).join('')}</tbody></table>`
   :'<p class="modal-note">開始探索後，這裡會列出每一幕的耗時、答錯次數與提示層級。</p>';
 return `<div class="playlog-panel" aria-label="試玩紀錄摘要">${table}`
  +`<div class="playlog-actions"><button id="playlog-copy" class="secondary-button">複製紀錄</button><button id="playlog-download" class="secondary-button">下載 JSON</button><button id="playlog-clear" class="secondary-button">清除</button></div></div>`;
}

// ---- endings.js ----
// The operable epilogue (尾聲): one gesture from two, each with its own closing line. Empty when the ending has none.
export function epilogueMarkup(epilogue,allShardsFound){
 if(!epilogue)return '';
 return '<h2>尾聲</h2><p class="epilogue-prompt">'+epilogue.prompt+'</p>'
  +'<div class="epilogue-options">'+epilogue.options.map(option=>'<button class="choice-option" data-epilogue="'+option.id+'">'+option.label+' <span>⟶</span></button>').join('')+'</div>'
  +'<p id="epilogue-text" class="epilogue-text" role="status" aria-live="polite"></p>'
  +'<div class="epilogue-extras"><button id="ending-credits" class="text-button">片尾名單 ⟶</button>'
  +(allShardsFound?'<button id="ending-secret" class="text-button">祕密尾聲 ⟶</button>':'')+'</div>';
}

// The journey recap: how the run reached this ending, the answers given to the queen, and the choices made.
export function recapMarkup(recap){
 if(!recap)return '';
 const list=(items)=>`<ul>${items.map(line=>`<li>${line}</li>`).join('')}</ul>`;
 return `<h2>這段旅程如何走到這裡</h2>${list(recap.cause)}`
  +(recap.answers.length?`<h2>妳對王后說過的話</h2>${list(recap.answers)}`:'')
  +(recap.choices.length?`<h2>妳在路上做的選擇</h2>${list(recap.choices)}`:'')
  +`<p class="ending-recap-stats">解封後的場景 ${recap.scenes} / ${recap.sceneTotal} · 使用提示 ${recap.hints} 次 · 人物記憶 ${recap.memories} / ${recap.memoryTotal}</p>`
  +`<p class="ending-recap-next">${recap.next}</p>`;
}

// The last choice (妳願意支付什麼？). main.js binds each [data-fate] button to its ending.
export const fateMarkup=()=>`<p class="modal-text">妳已握住所有真相。放棄名字，生命抵押將終止；但結界也會消失。\n\n赫索的工程藍圖仍在妳手中。這一次，妳可以尋找第三種方法。</p>`
 +`<button class="choice-option" data-fate="dawn">先完成蒸汽工程，再交出名字<small>讓工程替代結界。世界獲救，但所有人將忘記妳。</small></button>`
 +`<button class="choice-option" data-fate="frost">立刻交出名字，解除所有抵押<small>生命重獲自由。尚未準備好的城市將面對霜潮。</small></button>`
 +`<button class="choice-option" data-fate="crown">保住名字，繼承血色王冠<small>妳仍被世界記住。生命交易也將繼續。</small></button>`
 +`<p class="modal-note">這個選擇會決定結局。完成後可回來探索其他可能。</p>`;

// ---- replay.js ----
// Replay cards (重玩小遊戲): one thumbnailed button per finished mini-game. The picker and the ending share them.
export const replayCardsMarkup=finished=>finished.map(r=>`<button class="replay-card" data-replay="${r.id}"><img class="replay-thumb" src="assets/puzzles/thumbs/${r.thumb}.webp" alt="" width="112" height="64" loading="lazy" decoding="async" draggable="false"><span class="replay-name">${r.chapter} · ${r.title}</span><span class="replay-arrow" aria-hidden="true">⟶</span></button>`).join('');
export const replayPickerMarkup=finished=>'<p class="modal-text">選一道已通關的小遊戲再玩一次。重玩不會改動旅程進度、碎片、成就與結局。</p>'
 +(finished.length?`<div class="replay-grid">${replayCardsMarkup(finished)}</div>`:'<p class="modal-note">還沒有通關的小遊戲。解開任一封印後，就能在這裡重玩。</p>')
 +'<button id="replay-back" class="secondary-button">返回</button>';
// The ending's replay section: placed under the recap so a clear always shows the way back into the puzzles.
export const endingReplayMarkup=finished=>'<h2 id="ending-replay-title">重玩小遊戲</h2><p class="epilogue-prompt">挑一道機關，再解一次。進度、結局與收藏都不會改變。</p>'
 +(finished.length?`<div class="replay-grid">${replayCardsMarkup(finished)}</div>`:'<p class="modal-note">尚未通關任何小遊戲。</p>');

// ---- hints.js ----
export const hintStepsMarkup=(list,count)=>list.slice(0,count)
 .map((hint,i)=>`<div class="hint-step"><span>0${i+1}</span><p>${hint}</p></div>`).join('');

export const hintButtonText=(count,total)=>count===0?'點亮第一道提示':count>=total?'所有提示已展開':'展開更明確的提示';

// The same hints folded under the stage inside the puzzle modal, so a player never loses the puzzle to read one.
export const stageHintMarkup=({list,count,open})=>{
 if(!list.length)return '';
 return `<details class="stage-hints"${open?' open':''}><summary>燭光提示（${count} / ${list.length}）</summary>`
  +hintStepsMarkup(list,count)
  +`<button class="secondary-button" data-stage-hint ${count>=list.length?'disabled':''}>${hintButtonText(count,list.length)} ✧</button></details>`;
};

// ---- copy.js ----
export const storyBody='<p class="modal-text">王后生下白雪公主的那一夜，王國有許多孩子死於寒冷。\n宮殿裡燃燒著七百支蠟燭。\n\n在霜棘王國，魔法不是奇蹟，而是一門生意。窮人，永遠是付錢的那一個。\n\n二十三年後，妳以艾薇・格雷的名字藏身黑鐘學院。妳偷走一顆封著孩子記憶的玻璃心臟，卻發現自己也在王室的生命帳簿上。\n\n最高等級魔力容器。\n成年後可永久封存霜潮。\n\n帳簿的最後幾頁，被人撕走了。</p><p class="modal-note">改編自《白雪公主：血色魔鏡》。本作將主要事件重新編排為七幕密室探索；部分謎題與分支結局為遊戲原創。</p>';

export const guideBody='<ol class="guide-list"><li><strong>觀察場景。</strong>點擊帶有光暈的標記，閱讀文字。已看過的線索會有勾記。</li><li><strong>收取物品。</strong>在物品視窗按「收取」。只閱讀而沒有收取，物品不會進入背包。</li><li><strong>修復證據。</strong>有些證據已經損毀，拼回原狀後才能讀到完整內容。</li><li><strong>解開封印。</strong>比對線索，輸入密碼、排列符印或回答問題。沒有時間限制，也不會因答錯失去進度。</li><li><strong>需要幫助時。</strong>筆記會保留已探索的線索；提示會逐步揭露解法。</li><li><strong>決定代價。</strong>通過所有章節後選擇結局。可回到最後的選擇，體驗另外兩種結局。</li></ol><p class="modal-note">手機與桌面皆使用點擊操作。進度自動儲存在目前瀏覽器，換裝置不會同步。音效預設關閉；開啟後建議配戴耳機。遊戲包含心理恐怖、死亡與生命剝削敘事，無閃光驚嚇。</p>';

export const prologueBody='<p class="modal-text">王后生下白雪公主的那一夜，育兒房的音樂盒還在轉。一隻灰色的布兔子坐在床邊，右耳縫得很密。\n\n魔鏡第一次說謊，是在妳伸手去拿那只音樂盒的時候。</p><p class="modal-note">先撥起音針，讓旋律與搖籃曲譜一致。這裡練習的是點擊與拼合，不需要其他說明。</p>';

export const chapterIntroBody='<p class="modal-text">鐘聲還在耳邊迴盪。下方的對話框會一句一句說完今夜發生的事。\n\n先看看桌上那隻倒著走的懷錶。</p><p class="modal-note">點一下對話框或「繼續」讀下一句，「回顧紀錄」可以重看本幕讀過的文字。點擊場景中的光點探索；物品要按「收取」才會放進口袋。卡住時，畫面上方的「下一步建議」會指出方向。進度會自動儲存。</p>';

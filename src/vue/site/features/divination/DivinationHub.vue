<template>
  <div class="divination-hub">
    <header class="divination-hero">
      <h1>月夜占卜室</h1>
      <p>三種古老象徵系統，陪你整理眼前的問題。所有計算都在你的瀏覽器完成。</p>
    </header>
    <section class="doors" aria-label="選擇占卜方式">
      <a class="door" href="../tarot/">
        <span class="door__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M18 7a9 9 0 1 0 7 14.5A7.5 7.5 0 0 1 18 7z" /></svg></span>
        <span class="door__body">
          <h2>星夜塔羅</h2>
          <span>隨機快抽、每日一抽或三／五張深入牌陣；問題與主題皆可略過。</span>
          <span class="door__meta">不需個資，立即抽牌</span>
        </span>
      </a>
      <a class="door" href="../bazi/">
        <span class="door__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 10h4v12H5zM11 10h4v12h-4zM17 10h4v12h-4zM23 10h4v12h-4z" /></svg></span>
        <span class="door__body">
          <h2>生辰八字</h2>
          <span>簡易模式不需出生時間，排三柱；提供可靠出生時間可查看四柱、十神與五行。</span>
          <span class="door__meta">選擇資料完整度</span>
        </span>
      </a>
      <a class="door" href="../astrology/">
        <span class="door__icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" /><ellipse cx="16" cy="16" rx="12" ry="5" transform="rotate(-24 16 16)" /></svg></span>
        <span class="door__body">
          <h2>西洋占星</h2>
          <span>出生時間不詳可先查看近似行星落座；補上精確時間和地點才計算上升、天頂與宮位。</span>
          <span class="door__meta">選擇資料完整度</span>
        </span>
      </a>
    </section>
    <aside class="divination-note"><strong>閱讀前的小提醒</strong><p>內容依固定規則和傳統象徵整理，供娛樂與自我反思，不保證事件，也不取代醫療、法律或財務專業建議。出生資料只在本機記憶體中計算，不會儲存或上傳；塔羅閱讀歷史若啟用，只保存在此瀏覽器。</p></aside>
  </div>
</template>

<style scoped>
.divination-hub { display:grid; gap:clamp(28px,5vw,40px); width:min(100% - 32px,1020px); margin:0 auto 72px; color:var(--ll-color-text); }
.divination-hero { display:grid; justify-items:center; gap:14px; padding:clamp(40px,8vw,72px) 0 clamp(8px,2vw,16px); text-align:center; background:radial-gradient(ellipse closest-side at 50% 40%,rgb(44 64 82 / 0.4) 0,transparent 100%); }
.divination-hero h1 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:clamp(2.25rem,6vw,3.25rem); font-weight:500; line-height:1.2; letter-spacing:0.06em; }
.divination-hero p { max-width:36em; margin:0; color:var(--ll-color-text-muted); font-size:clamp(1rem,2.4vw,1.0625rem); line-height:1.8; }
.doors { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:12px; }
.door { display:grid; grid-template-columns:44px minmax(0,1fr); gap:16px; align-items:start; padding:22px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-panel); color:inherit; text-decoration:none; background:var(--ll-color-surface); transition:border-color var(--ll-motion-standard); }
.door:hover { border-color:var(--ll-color-gold); }
.door:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.door__icon { display:grid; place-items:center; width:44px; height:44px; border:1px solid var(--ll-color-control-border); border-radius:50%; color:var(--ll-color-gold); }
.door__icon svg { width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.door__body { display:grid; gap:8px; min-width:0; }
.door h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-xl); font-weight:500; }
.door__body>span { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-body); line-height:1.7; }
.door__body>.door__meta { margin-top:4px; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); }
.divination-note { display:grid; gap:8px; padding-left:16px; border-left:2px solid var(--ll-color-control-border); color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.75; }
.divination-note strong { color:var(--ll-color-gold); font-weight:600; }
.divination-note p { margin:0; }
@media (prefers-reduced-motion:reduce) { .door { transition:none; } }
</style>

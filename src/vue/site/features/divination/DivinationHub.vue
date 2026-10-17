<template>
  <div class="divination-hub">
    <header class="divination-hero">
      <p class="eyebrow">THE MOONLIT ORACLE</p>
      <h1>月夜占卜室</h1>
      <p>三種古老象徵系統，陪你整理眼前的問題。所有計算都在你的瀏覽器完成。</p>
    </header>
    <section class="doors" aria-label="選擇占卜方式">
      <a class="door" href="../tarot/"><span aria-hidden="true">☾</span><div><p class="eyebrow">TAROT</p><h2>暗黑童話塔羅</h2><p>隨機快抽、每日一抽或三／五張深入牌陣；問題與主題皆可略過。</p></div><strong>不需個資，立即抽牌 →</strong></a>
      <a class="door" href="../bazi/"><span aria-hidden="true">四柱</span><div><p class="eyebrow">BA ZI</p><h2>生辰八字</h2><p>簡易模式不需出生時間，排三柱；提供可靠出生時間可查看四柱、十神與五行。</p></div><strong>選擇資料完整度 →</strong></a>
      <a class="door" href="../astrology/"><span aria-hidden="true">✧</span><div><p class="eyebrow">ASTROLOGY</p><h2>西洋占星</h2><p>出生時間不詳可先查看近似行星落座；補上精確時間和地點才計算上升、天頂與宮位。</p></div><strong>選擇資料完整度 →</strong></a>
    </section>
    <aside class="divination-note"><strong>閱讀前的小提醒</strong><p>內容依固定規則和傳統象徵整理，供娛樂與自我反思，不保證事件，也不取代醫療、法律或財務專業建議。出生資料只在本機記憶體中計算，不會儲存或上傳；塔羅閱讀歷史若啟用，只保存在此瀏覽器。</p></aside>
  </div>
</template>

<style scoped>
.divination-hub{width:min(100% - 32px,1020px);margin:0 auto 72px;color:#e5dfd1}.divination-hero{padding:clamp(48px,9vw,84px) 20px 40px;text-align:center;background:radial-gradient(ellipse at 50% 20%,#283744,#0a1119 72%)}.eyebrow{margin:0 0 10px;color:#cfb878;font-size:.74rem;letter-spacing:.2em}.divination-hero h1{margin:0;color:#f1e5ca;font-size:clamp(2.2rem,7vw,4rem);font-weight:500;letter-spacing:.1em}.divination-hero>p:last-child{max-width:650px;margin:16px auto 0;color:#c7c1b4;line-height:1.8}.doors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}.door{display:grid;grid-template-columns:54px 1fr;gap:4px 16px;align-items:start;min-height:210px;padding:24px;border:1px solid #ad96514d;border-radius:16px;color:inherit;text-decoration:none;background:linear-gradient(145deg,#18232c,#0d141b);transition:border-color .2s,transform .2s}.door:hover{border-color:#d3b871;transform:translateY(-2px)}.door:focus-visible{outline:3px solid #f0d59a;outline-offset:3px}.door>span{grid-row:span 2;display:grid;place-items:center;width:50px;height:50px;border:1px solid #c1a65e88;border-radius:50%;color:#ddc784;font-size:1.1rem}.door h2{margin:0;color:#eee1c4;font-size:1.35rem}.door p:not(.eyebrow){margin:10px 0;color:#bdb9ae;line-height:1.7}.door strong{grid-column:2;color:#d3b871;font-size:.9rem}.divination-note{margin-top:28px;padding:20px 22px;border-left:2px solid #8e7847;color:#c0bdb3;background:#141b20}.divination-note p{margin:8px 0 0;line-height:1.75}@media(max-width:480px){.divination-hub{width:min(100% - 22px,1020px)}.door{padding:20px}}
</style>

/* ============================================================
 * 事件庫 · 行程觸發事件＋成家立業期與中年期（30–60 歲）
 * w: 0 的事件不會隨機出現，只會由行程觸發。
 * ============================================================ */
const MID_FREE = ['work', 'seek', 'prep', 'retired'];
LG.addEvents([
  // ── 行程觸發 ──
  { id: 'a_newfriend', a: [3, 100], w: 0, cd: 0, k: 'o', t: ['你認識了{newfriend}，你們很聊得來。', '你和{newfriend}一見如故，互相加了好友。', '{newfriend}主動跟你打招呼，你們很快就熟了起來。'], fx: { rel: { newfriend: 24 }, ch: 1 } },
  { id: 'a_meet', a: [13, 80], w: 0, cd: 0, k: 'o', imp: 1, t: ['你在活動中遇見了{newcrush}，對方的笑容讓你心跳加速。', '你和{newcrush}聊了一整晚，好像認識很久了一樣。'], ch: [
    { t: '主動約{newcrush}出去', chk: ['ch', 45], ok: { fx: { rel: { newcrush: 42 }, md: 8, tag: '交往中' }, r: '約會了幾次之後，你們決定在一起。' }, no: { fx: { rel: { newcrush: 12 }, md: -3 }, r: '{newcrush}說想先當朋友。' } },
    { t: '先當朋友，慢慢了解', fx: { rel: { newfriend: 22 }, md: 1 }, r: '你們成了很聊得來的朋友。' },
    { t: '現在不想談戀愛', fx: {} }] },
  { id: 'a_license', a: [18, 100], w: 0, cd: 0, t: '駕訓班結業，今天要考機車駕照。', ch: [
    { t: '冷靜應考', chk: ['iq', 30], ok: { fx: { md: 4, tag: '機車駕照' }, r: '筆試、路考一次就過！' }, no: { fx: { md: -2 }, r: '路考時一緊張壓到線，下次再來。' } }] },

  // ── 成家立業期 30–45：工作 ──
  { id: 'mm_manager', a: [30, 55], stt: ['work'], k: 'o', cd: 36, c: s => s.job.lvl >= 1 && s.job.perf >= 60, t: '{boss}找你談話：「我想讓你帶一個小團隊，你願意嗎？」', ch: [
    { t: '接下來，挑戰管理職', chk: ['ch', 50], ok: { fx: { raise: 10, perf: 5, st: 5, tag: '當過主管' }, r: '你學著帶人，團隊表現越來越好。' }, no: { fx: { st: 8, perf: -3 }, r: '帶人比想像中難，你常常加班收拾殘局。' } },
    { t: '我比較想專注在專業上', fx: { iq: 1, md: 1 } }] },
  { id: 'mm_layoff_fear', a: [40, 60], stt: ['work'], k: 'x', cd: 24, c: (s, H) => H.econ() === 'recession', t: '公司傳出要裁員，資深員工人人自危。', ch: [
    { t: '更努力表現', fx: { perf: 5, st: 5 } },
    { t: '開始準備第二專長', fx: { iq: 2, st: 2 } },
    { t: '主動找新工作', fx: { hunt: true } }] },
  { id: 'mm_young_boss', a: [38, 60], stt: ['work'], k: 'x', cd: 36, t: '新來的主管比你年輕十歲，作風跟你很不一樣。', ch: [
    { t: '放下身段配合', fx: { perf: 3, md: -1 } },
    { t: '用經驗幫他', chk: ['ch', 50], ok: { fx: { perf: 5, ch: 1 }, r: '主管很感謝你，什麼事都先問你的意見。' }, no: { fx: { st: 3 }, r: '主管覺得你在倚老賣老。' } },
    { t: '心裡不服氣', fx: { md: -3, st: 3, perf: -2 } }] },
  { id: 'mm_burnout', a: [30, 60], stt: ['work'], k: 'x', cd: 24, c: s => s.stress > 65, t: '連續好幾個月高壓工作，你開始失眠、胸悶。', ch: [
    { t: '請長假好好休息', fx: { st: -20, perf: -4, md: 4 } },
    { t: '去看身心科、做諮商', fx: { st: -12, md: 6, $: -6000 } },
    { t: '撐下去', fx: { hp: -6, st: 4 } }] },
  { id: 'mm_headhunt', a: [30, 55], stt: ['work'], k: 'o', cd: 36, c: s => s.job.perf >= 60, t: '另一家公司開出高出三成的薪水挖角你。', ch: [
    { t: '跳槽！', fx: { hunt: true, md: 3 }, r: '你開始和新公司談條件（從「人生抉擇」→「找工作」看看機會）。' },
    { t: '拿去跟現在的公司談加薪', chk: ['ch', 55], ok: { fx: { raise: 12, md: 5 }, r: '公司為了留你，幫你大幅加薪！' }, no: { fx: { md: -2 }, r: '公司說預算有限，請你自己考慮。' } },
    { t: '留在熟悉的地方', fx: { rel: { colleagues: 2 } } }] },
  { id: 'mm_reunion_job', a: [30, 60], stt: ['work'], cd: 24, t: ['你帶的新人升官了，特地來跟你道謝。', '你的專案拿到公司年度大獎。', '公司辦了二十週年慶，你被表揚為資深優良員工。'], fx: { md: 4, perf: 2 } },
  { id: 'mm_owner', a: [25, 75], stt: ['work'], c: s => s.job && s.job.id === 'owner', cd: 8, t: ['店裡來了一位美食部落客，寫了一篇好評。', '連假生意爆好，你和員工忙到半夜。', '隔壁開了一家同類型的店，客人被分走了一些。', '老客人帶著全家來光顧，說吃了十幾年。'], ch: [
    { t: '推出新菜單吸引客人', chk: ['cr', 50], ok: { fx: { raise: 8, md: 4 }, r: '新菜單大受好評，營收成長了！' }, no: { fx: { st: 3 }, r: '反應普普，你決定再調整。' } },
    { t: '維持品質，穩穩經營', fx: { raise: 2 } }] },
  // ── 成家立業期：家庭 ──
  { id: 'mf_kid_school', a: [30, 60], kid: true, cd: 18, c: s => s.npcs.some(n => n.role === 'child' && n.alive && !n.adult && (s.ageM - n.born) >= 72), t: '{child}的學校要開家長會，老師說{child}最近上課不太專心。', ch: [
    { t: '請假去參加，回家好好聊', fx: { rel: { child: 6 }, perf: -1, md: 1 } },
    { t: '幫{child}報名補習班', fx: { $: -5000, rel: { child: -2 } } },
    { t: '交給另一半處理', fx: { rel: { spouse: -3 } } }] },
  { id: 'mf_kid_rebel', a: [40, 70], kid: true, k: 'x', cd: 24, c: s => s.npcs.some(n => n.role === 'child' && n.alive && (s.ageM - n.born) >= 156 && (s.ageM - n.born) < 216), t: '{child}進入叛逆期，常常把房門鎖起來，跟你說不到三句話就吵架。', ch: [
    { t: '耐心陪伴、尊重隱私', chk: ['ch', 45], ok: { fx: { rel: { child: 8 }, md: 2 }, r: '某天晚上，{child}主動跟你說了學校的煩惱。' }, no: { fx: { rel: { child: 2 }, st: 3 }, r: '{child}還是不太理你，但你知道這需要時間。' } },
    { t: '嚴格管教', fx: { rel: { child: -8 }, st: 2 } },
    { t: '帶{child}去旅行', fx: { $: -15000, rel: { child: 6 }, md: 3 } }] },
  { id: 'mf_kid_dream', a: [40, 70], kid: true, cd: 36, c: s => s.npcs.some(n => n.role === 'child' && n.alive && (s.ageM - n.born) >= 180 && (s.ageM - n.born) < 216), t: '{child}說將來想念藝術，但你擔心以後找不到工作。', ch: [
    { t: '支持孩子的夢想', fx: { rel: { child: 10 }, md: 2 } },
    { t: '勸{child}選比較穩的科系', fx: { rel: { child: -6 } } },
    { t: '一起去參加大學說明會', fx: { rel: { child: 5 }, $: -2000 } }] },
  { id: 'mf_kid_daily', a: [25, 70], kid: true, cd: 3, c: s => s.npcs.some(n => n.role === 'child' && n.alive && !n.adult), t: ['{child}在學校得了獎，興奮地拿獎狀給你看。', '{child}跟你說今天在學校發生的趣事。', '{child}生病了，你整晚守在床邊。', '週末全家去露營，{child}玩得好開心。', '{child}學會了騎腳踏車。'], fx: { md: 3, rel: { child: 3 } } },
  { id: 'mf_kid_adult', a: [45, 100], cd: 6, c: s => s.npcs.some(n => n.role === 'child' && n.alive && n.adult), t: ['{child}打電話回家，問你最近身體好不好。', '{child}週末帶了你愛吃的點心回來看你。', '{child}升職了，請全家吃大餐。', '{child}傳了一張旅行的照片給你。'], fx: { md: 3, rel: { child: 2 } } },
  { id: 'mf_spouse_fight', a: [28, 80], ms: ['married'], k: 'x', cd: 12, t: ['你和{spouse}為了教養方式意見不合。', '{spouse}覺得你最近都沒時間陪家人。', '你和{spouse}為了錢的事吵了一架。'], ch: [
    { t: '好好溝通，各退一步', chk: ['ch', 45], ok: { fx: { rel: { spouse: 8 } }, r: '你們把話說開了，感情反而更好。' }, no: { fx: { rel: { spouse: -3 } }, r: '溝通到一半又吵起來了。' } },
    { t: '安排一次兩人旅行', fx: { $: -12000, rel: { spouse: 8 }, md: 3 } },
    { t: '冷處理', fx: { rel: { spouse: -6 }, md: -2 } }] },
  { id: 'mf_anniv', a: [26, 100], ms: ['married'], cd: 12, k: 'o', t: '結婚紀念日到了。', ch: [
    { t: '準備驚喜禮物', fx: { $: -5000, rel: { spouse: 7 }, md: 3 } },
    { t: '一起回到第一次約會的地方', fx: { rel: { spouse: 6 }, md: 4 } },
    { t: '寫一封手寫信', fx: { rel: { spouse: 5 }, cr: 1 } }] },
  { id: 'mf_inlaw', a: [28, 70], ms: ['married'], cd: 24, t: '{spouse}的家人邀請你們一起去旅行。', ch: [
    { t: '一起去', fx: { $: -10000, rel: { spouse: 5 }, md: 2 } },
    { t: '婉拒，讓{spouse}自己去', fx: { rel: { spouse: -3 } } }] },
  { id: 'mf_parent_old', a: [35, 75], cd: 18, c: (s, H) => H.alive('mom') || H.alive('dad'), t: ['{parent}最近常常忘東忘西，你有點擔心。', '{parent}跌了一跤，還好沒有骨折。', '{parent}說想回老家看看。'], ch: [
    { t: '帶{parent}去醫院檢查', fx: { $: -3000, rel: { parent: 5 }, contrib: 1 } },
    { t: '多抽時間回家陪{parent}', fx: { rel: { parent: 6 }, st: 2 } },
    { t: '請兄弟姊妹多注意', fx: { rel: { sib: -2 } } }] },
  { id: 'mf_sib_money', a: [30, 70], k: 'x', cd: 48, c: (s, H) => H.alive('sib'), t: '{sib}的生意周轉不靈，開口跟你借二十萬。', ch: [
    { t: '借', fx: { $: -200000, rel: { sib: 10 } }, chk: ['luck', 55], ok: { fx: { $: 200000 }, r: '兩年後{sib}把錢還清，還多包了一個紅包。' }, no: { fx: { rel: { sib: -5 }, md: -4 }, r: '錢一直沒有還回來。' } },
    { t: '借一部分', fx: { $: -50000, rel: { sib: 4 } } },
    { t: '婉拒', fx: { rel: { sib: -8 } } }] },
  { id: 'mf_inheritance', a: [40, 85], k: 'x', once: 1, c: (s, H) => !H.alive('mom') && !H.alive('dad') && H.alive('sib'), t: '父母留下的老房子要怎麼處理，兄弟姊妹意見不同。', ch: [
    { t: '大家平分', fx: { $: 600000, rel: { sib: 3 } } },
    { t: '讓給最需要的人', fx: { rel: { sib: 10 }, contrib: 3 } },
    { t: '爭取自己的那一份', fx: { $: 900000, rel: { sib: -15 }, md: -3 } }] },
  // ── 中年 45–60 ──
  { id: 'mc_crisis', a: [42, 55], k: 'x', once: 1, imp: 1, t: '某天早上照鏡子，你突然覺得：「我的人生就這樣了嗎？」', ch: [
    { t: '重拾年輕時的夢想', fx: { cr: 3, md: 5, tag: '重拾夢想' }, r: '你報名了一直想學的課，覺得自己又活了過來。' },
    { t: '去做一件瘋狂的事', fx: { $: -30000, md: 6 }, r: '你一個人去冰島看極光。' },
    { t: '珍惜現在擁有的', fx: { md: 3, rel: { family: 3 } } }] },
  { id: 'mc_empty_nest', a: [45, 75], once: 1, c: s => s.npcs.some(n => n.role === 'child' && n.alive && n.adult) && !s.npcs.some(n => n.role === 'child' && n.alive && !n.adult), t: '孩子們都長大離家了，家裡突然變得好安靜。', ch: [
    { t: '和另一半重溫兩人世界', need: (s, H) => H.ms() === 'married', needT: '需要有另一半', fx: { rel: { spouse: 8 }, md: 4 } },
    { t: '培養新的興趣', fx: { cr: 2, md: 3 } },
    { t: '常常打電話給孩子', fx: { rel: { kids: 4 } } }] },
  { id: 'mc_health', a: [45, 70], k: 'x', cd: 24, t: '最近爬樓梯會喘，體重也增加了不少。', ch: [
    { t: '開始規律運動', fx: { hp: 4, ft: 2, wt: -2 } },
    { t: '去做全身健康檢查', fx: { $: -8000, hp: 2 } },
    { t: '年紀大了難免', fx: { hp: -2 } }] },
  { id: 'mc_reunion', a: [40, 70], k: 'o', cd: 60, t: '大學同學辦畢業二十年同學會。', ch: [
    { t: '去參加', fx: { md: 5, rel: { newfriend: 20 } }, r: '你和失聯多年的{newfriend}重新聯絡上了。' },
    { t: '不太想去', fx: {} }] },
  { id: 'mc_menopause', a: [46, 56], once: 1, g: 'F', t: '你開始常常熱潮紅、睡不好，醫生說這是更年期。', ch: [
    { t: '看醫生，好好調養', fx: { hp: 2, md: 2, $: -3000 } },
    { t: '跟家人說說自己的感受', fx: { md: 4, rel: { family: 3 } } }] },
  { id: 'mc_mortgage_done', a: [40, 80], once: 1, c: s => s.house && !s.loans.some(l => l.n === '房貸'), t: '最後一期房貸繳完了！這間房子終於完完全全是你的了。', fx: { md: 10 } },
  { id: 'mc_second', a: [45, 62], stt: ['work', 'seek'], k: 'o', once: 1, t: '你在想：退休前，要不要培養第二專長？', ch: [
    { t: '考一張證照', chk: ['iq', 45], ok: { fx: { tag: '取得證照', md: 4 }, r: '你考到了證照，多了一條退路。' }, no: { fx: { md: -1 }, r: '考試沒過，但你學到很多。' } },
    { t: '開始學投資理財', fx: { iq: 2 } },
    { t: '先把現在的工作做好', fx: { perf: 2 } }] },
  { id: 'mc_retire_plan', a: [50, 65], stt: ['work'], once: 1, t: '同事開始討論退休後要做什麼，你也想了想自己的計畫。', ch: [
    { t: '算一算退休金夠不夠', fx: { iq: 1 }, r: '（可以到「財務」分頁看勞退帳戶和存款）' },
    { t: '加碼投資', fx: { invest: 10000 } },
    { t: '想繼續工作到不能做為止', fx: { perf: 2 } }] },
  { id: 'mc_friend_sick', a: [45, 90], k: 'x', cd: 36, c: (s, H) => H.friends() > 0, t: '好朋友{friend}生了重病住院。', ch: [
    { t: '常常去醫院探望', fx: { rel: { friend: 8 }, md: -2, contrib: 1 } },
    { t: '傳訊息加油打氣', fx: { rel: { friend: 3 } } }] },
  { id: 'mc_daily', a: [30, 60], cd: 2, t: ['你在超市採買，順便買了一束花。', '週末你在家整理衣櫃，翻出了年輕時的照片。', '你發現自己開始看養生節目了。', '下班塞車，你在車上聽廣播。', '你和鄰居在電梯裡聊了幾句。'], fx: { md: 1 } },
  { id: 'mc_daily2', a: [30, 65], stt: MID_FREE, cd: 3, t: ['你在網路上看到老同學的近況，傳了訊息問候。', '你久違地去看了一場電影。', '你在公園看到一群孩子在玩，想起自己小時候。', '你泡了一壺好茶，看著窗外的雨。'], fx: { md: 1, st: -1 } },
  { id: 'mc_fate_lottery', a: [30, 90], k: 'f', once: 1, w: 0.5, t: '你隨手買的大樂透，居然中了 200 萬！', ch: [
    { t: '存起來，安心過日子', fx: { $: 2000000, md: 10 } },
    { t: '捐一部分做公益', fx: { $: 1500000, md: 12, contrib: 8 } },
    { t: '全家出國旅行慶祝', fx: { $: 1800000, md: 12, rel: { family: 6 } } }] },
  { id: 'mc_fate_ill', a: [35, 75], k: 'f', once: 1, sick: 1, imp: 1, sn: 'hospital', t: '健康檢查發現一個腫瘤，需要開刀治療。', ch: [
    { t: '積極治療，相信醫生', fx: { hp: -18, $: -80000, md: -6, rel: { family: 6 } }, r: '手術很成功。經過半年的休養，你慢慢恢復了。' },
    { t: '找其他醫院再確認', fx: { hp: -14, $: -100000, md: -4 }, r: '第二位醫生的治療方式比較溫和，你順利康復。' }] },
  { id: 'mc_fate_quake', a: [30, 100], k: 'f', cd: 120, t: '一場大地震讓房子出現裂縫，必須花錢修補。', fx: { $: -150000, md: -5, st: 5 } },
  { id: 'mc_fate_crash', a: [30, 100], k: 'f', cd: 120, c: s => s.inv.bal > 100000, t: '全球股市崩盤，你的投資帳戶一夕之間少了三成。', ch: [
    { t: '繼續持有，等待反彈', fx: { st: 6, md: -3 } },
    { t: '趁低點加碼', chk: ['luck', 55], ok: { fx: { $: 100000, md: 5 }, r: '一年後股市回升，你大賺一筆。' }, no: { fx: { $: -60000, md: -5 }, r: '股市又跌了一段，你忍痛停損。' } }] }
]);

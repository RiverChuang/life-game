/* ============================================================
 * 事件庫 · 成年生活（18–30 歲）
 * 感情、婚姻、孩子、家人、朋友、金錢、健康、興趣與命運卡。
 * 排除主題：性、成癮、犯罪、自殺。感情只寫情感層面。
 * ============================================================ */
const FREE = ['uni', 'work', 'seek', 'prep'];
const WORKING = ['work'];
LG.addEvents([
  // ── 單身：認識新對象 ──
  { id: 'l_meet_work', a: [20, 30.5], stt: WORKING, ms: ['single'], cd: 18, k: 'o', t: '公司新來的{newcrush}笑起來很好看，午餐時常常坐在你對面。', ch: [
    { t: '約{newcrush}下班去吃飯', chk: ['ch', 52], ok: { fx: { rel: { newcrush: 40 }, md: 8, tag: '交往中' }, r: '吃了幾次飯、看了幾場電影，你們在一起了。' }, no: { fx: { rel: { newcrush: 10 }, md: -3 }, r: '{newcrush}委婉地說想先當朋友。' } },
    { t: '辦公室戀情太麻煩了', fx: {} }] },
  { id: 'l_app', a: [20, 30.5], stt: FREE, ms: ['single'], cd: 18, t: '朋友都說現在大家都用交友軟體認識人。', ch: [
    { t: '下載來試試', chk: ['ch', 50], ok: { fx: { rel: { newcrush: 35 }, md: 7, tag: '交往中' }, r: '你和{newcrush}從聊天到見面，越來越有感覺，決定交往。' }, no: { fx: { md: -3 }, r: '滑了一個月，聊了幾個人，都沒有下文。' } },
    { t: '還是想在生活中認識人', fx: {} }] },
  { id: 'l_intro', a: [22, 30.5], stt: FREE, ms: ['single'], cd: 20, k: 'o', t: '{friend}說要介紹一個朋友給你認識：「我覺得你們會很合！」', ch: [
    { t: '好啊，見見看', chk: ['ch', 48], ok: { fx: { rel: { newcrush: 38, friend: 3 }, md: 8, tag: '交往中' }, r: '{friend}果然很懂你，你和{newcrush}一見如故。' }, no: { fx: { md: -1 }, r: '吃了一頓飯，雙方都覺得當朋友比較自在。' } },
    { t: '先不要，最近想專心在自己身上', fx: { st: -1 } }] },
  { id: 'l_blind', a: [25, 30.5], stt: FREE, ms: ['single'], cd: 24, t: '{parent}說：「親戚有個不錯的對象，要不要去相親看看？」', ch: [
    { t: '去吃個飯也好', chk: ['ch', 45], ok: { fx: { rel: { newcrush: 32, parents: 3 }, md: 5, tag: '交往中' }, r: '沒想到{newcrush}跟你很聊得來，你們開始約會了。' }, no: { fx: { rel: { parents: 2 } }, r: '對方人不錯，但沒什麼火花。' } },
    { t: '拜託不要催我', fx: { rel: { parents: -2 }, md: 1 } }] },
  { id: 'l_single_life', a: [20, 30.5], ms: ['single'], cd: 6, t: ['一個人看電影、一個人吃火鍋，你覺得也挺自在的。', '週末你一個人去咖啡廳看書，享受安靜的時光。', '朋友問你怎麼還不交男女朋友，你笑說緣分還沒到。'], fx: { md: 1 } },
  { id: 'l_lonely', a: [24, 30.5], ms: ['single'], k: 'x', cd: 12, t: '看著朋友們一個個脫單、結婚，你偶爾也會覺得有點寂寞。', fx: { md: -3 } },
  // ── 交往中 ──
  { id: 'l_date', a: [18, 30.5], ms: ['dating'], cd: 3, t: ['你和{crush}去逛夜市，一路吃到撐。', '{crush}幫你準備了一個驚喜生日派對。', '你們一起去看了一場演唱會。', '下雨天，你們窩在家裡看了一整天的電影。', '你和{crush}去山上露營，一起看星星。'], fx: { rel: { crush: 4 }, md: 3 } },
  { id: 'l_fight', a: [18, 30.5], ms: ['dating'], k: 'x', cd: 8, t: ['你和{crush}為了一件小事吵架，冷戰了三天。', '{crush}覺得你最近太忙，都沒時間陪他。'], ch: [
    { t: '主動道歉，好好聊', chk: ['ch', 45], ok: { fx: { rel: { crush: 8 }, md: 3 }, r: '說開之後，你們抱在一起，感情更好了。' }, no: { fx: { rel: { crush: -4 } }, r: '聊到一半又吵起來了。' } },
    { t: '等對方先開口', chk: ['luck', 45], ok: { fx: { rel: { crush: 2 } }, r: '{crush}傳了一個可愛的貼圖給你。' }, no: { fx: { rel: { crush: -10 }, md: -4 }, r: '你們之間的距離越來越遠。' } }] },
  { id: 'l_breakup', a: [18, 30.5], ms: ['dating'], k: 'x', cd: 12, c: s => s.npcs.some(n => n.role === 'crush' && n.alive && n.rel < 35), imp: 1, t: '{crush}約你出來，表情很認真：「我們是不是該好好談談？」', ch: [
    { t: '努力挽回', chk: ['ch', 55], ok: { fx: { rel: { crush: 15 }, md: 4 }, r: '你們決定再給彼此一次機會。' }, no: { fx: { breakup: true, md: -12, st: 6 }, r: '你們還是分手了。那天晚上你哭了很久。' } },
    { t: '和平分手', fx: { breakup: true, md: -8, st: 3 }, r: '你們好好地說了再見，祝福彼此。' }] },
  { id: 'l_meet_parents', a: [21, 30.5], ms: ['dating'], once: 1, c: s => s.npcs.some(n => n.role === 'crush' && n.alive && n.rel >= 55), t: '{crush}說：「週末要不要來我家吃飯？我爸媽想見你。」', ch: [
    { t: '好！帶伴手禮去', chk: ['ch', 45], ok: { fx: { rel: { crush: 8 }, md: 5, $: -1500 }, r: '{crush}的爸媽很喜歡你，一直夾菜給你。' }, no: { fx: { rel: { crush: 2 }, st: 3, $: -1500 }, r: '你緊張到打翻湯，但大家還是笑著化解。' } },
    { t: '我還沒準備好', fx: { rel: { crush: -5 } } }] },
  { id: 'l_cohabit', a: [22, 30.5], ms: ['dating'], once: 1, hm: ['parents', 'rent', 'dorm'], c: s => s.ageM >= 264 && s.npcs.some(n => n.role === 'crush' && n.alive && n.rel >= 60), t: '{crush}提議：「我們要不要一起租房子？可以省房租，也能每天見面。」', ch: [
    { t: '好啊，一起住', fx: { home: 'rent', rel: { crush: 8 }, md: 5, tag: '同居' }, r: '你們一起挑家具、布置新家，生活多了好多小確幸。' },
    { t: '再等等，想先保留自己的空間', fx: { rel: { crush: -3 } } }] },
  { id: 'l_propose', a: [23, 30.5], ms: ['dating'], cd: 12, c: s => s.npcs.some(n => n.role === 'crush' && n.alive && n.rel >= 62) && s.ageM - (s.npcs.find(n => n.role === 'crush' && n.alive) || { since: s.ageM }).since >= 18, imp: 1, sn: 'park', t: '你們交往很久了，你想著是不是該求婚了……', ch: [
    { t: '準備戒指，正式求婚', fx: { $: -30000 }, chk: ['ch', 40], ok: { fx: { md: 12, rel: { crush: 10 }, tag: '訂婚' }, r: '{crush}哭著說：「我願意！」' }, no: { fx: { md: -6, rel: { crush: -5 } }, r: '{crush}說：「我很愛你，但我還沒準備好。」' } },
    { t: '再談一陣子戀愛', fx: {} }] },
  { id: 'l_wedding', a: [23, 30.5], ms: ['dating'], tag: '訂婚', once: 1, sn: 'wedding', imp: 1, t: '婚禮的日子到了！你穿上禮服，在親友的祝福中走向{crush}。', ch: [
    { t: '辦一場溫馨的婚宴', fx: { marry: true, md: 15, rel: { parents: 5 } }, r: '親友們舉杯祝福，{parents}笑得合不攏嘴。' },
    { t: '只登記，把錢省下來', fx: { marry: true, md: 10, $: 150000 }, r: '你們到戶政事務所登記，拍了一張可愛的合照。' }] },
  { id: 'l_ldr', a: [18, 30.5], ms: ['dating'], k: 'x', cd: 24, t: '{crush}要到外地工作一年，你們要開始遠距離戀愛了。', ch: [
    { t: '每天視訊，週末輪流去找對方', fx: { rel: { crush: 4 }, $: -8000, st: 2 } },
    { t: '給彼此空間，順其自然', chk: ['luck', 50], ok: { fx: { rel: { crush: 2 } }, r: '距離讓你們更珍惜彼此。' }, no: { fx: { rel: { crush: -12 } }, r: '你們越來越少聯絡了。' } }] },
  // ── 婚姻 ──
  { id: 'l_married_daily', a: [20, 30.5], ms: ['married'], cd: 2, t: ['你和{spouse}一起煮晚餐，廚房裡充滿笑聲。', '週末你們去逛 IKEA，買了一盆新的植物。', '{spouse}下班幫你帶了你最愛的甜點。', '結婚紀念日，你們回到第一次約會的餐廳。', '你們一起規劃下一次的旅行。'], fx: { rel: { spouse: 4 }, md: 2 } },
  { id: 'l_chores', a: [20, 30.5], ms: ['married'], k: 'x', cd: 10, t: '你和{spouse}為了家事分工吵了起來。', ch: [
    { t: '坐下來重新分配', chk: ['ch', 45], ok: { fx: { rel: { spouse: 6 }, st: -2 }, r: '你們做了一張家事表貼在冰箱上。' }, no: { fx: { rel: { spouse: -4 }, st: 2 }, r: '討論不出結果，兩個人都很累。' } },
    { t: '自己多做一點', fx: { rel: { spouse: 3 }, st: 3 } }] },
  { id: 'l_inlaws', a: [20, 30.5], ms: ['married'], k: 'x', cd: 18, t: '過年要回哪一邊的家，你和{spouse}有不同的想法。', ch: [
    { t: '除夕回一邊、初二回另一邊', fx: { rel: { spouse: 3, parents: 1 }, st: 2 } },
    { t: '堅持回自己家', fx: { rel: { spouse: -6, parents: 3 } } }] },
  { id: 'l_baby_talk', a: [23, 30.5], ms: ['married'], cd: 18, c: s => !s.flags.babyDue, imp: 1, t: '{spouse}認真地問你：「你想要有小孩嗎？」', ch: [
    { t: '想！我們準備迎接寶寶吧', fx: { baby: true, md: 8, rel: { spouse: 6 } }, r: '幾週後，驗孕棒上出現了兩條線。你們抱在一起又哭又笑。' },
    { t: '再等幾年，先顧好經濟', fx: { rel: { spouse: -1 } } },
    { t: '我們想當頂客族', fx: { tag: '頂客族', rel: { spouse: 2 } }, r: '你們決定把時間留給彼此和自己的夢想。' }] },
  { id: 'l_pregnant', a: [20, 30.5], ms: ['married'], cd: 3, c: s => !!s.flags.babyDue, t: ['你們一起去產檢，在螢幕上看到小小的心跳。', '你們開始布置嬰兒房，挑了一張小床。', '親友們送來好多嬰兒用品。'], fx: { md: 3, rel: { spouse: 3 }, $: -3000 } },
  { id: 'l_leave', a: [20, 30.5], stt: WORKING, kid: true, once: 1, c: s => s.npcs.some(n => n.role === 'child' && n.alive && s.ageM - n.born <= 3), t: '寶寶出生了，你考慮要不要請育嬰留職停薪。', ch: [
    { t: '請育嬰假，好好陪孩子', fx: { perf: -6, md: 6, rel: { child: 8, spouse: 5 }, $n: -60000 }, r: '你陪著孩子第一次翻身、第一次笑。政府的育嬰津貼補上了部分薪水。' },
    { t: '繼續工作，請家人幫忙帶', fx: { rel: { parents: 4 }, st: 3 } }] },
  { id: 'l_baby_night', a: [18, 30.5], kid: true, cd: 3, c: s => s.npcs.some(n => n.role === 'child' && n.alive && s.ageM - n.born < 24), t: ['寶寶半夜哭了三次，你和{spouse}輪流起來餵奶。', '寶寶第一次叫「爸爸」「媽媽」，你錄下來傳給全家人看。', '你抱著{child}在客廳走來走去，終於哄睡了。', '{child}長出了第一顆小牙。'], fx: { md: 2, st: 2, hp: -1, rel: { child: 3 } } },
  { id: 'l_kid_daily', a: [18, 30.5], kid: true, cd: 3, c: s => s.npcs.some(n => n.role === 'child' && n.alive && s.ageM - n.born >= 24), t: ['你帶{child}去公園溜滑梯。', '{child}畫了一張全家福送給你。', '{child}問了你一百個「為什麼」。', '週末全家去動物園，{child}興奮得一直尖叫。'], fx: { md: 3, rel: { child: 4 } } },
  { id: 'l_divorce', a: [22, 30.5], ms: ['married'], k: 'x', once: 1, c: s => s.npcs.some(n => n.role === 'spouse' && n.alive && n.rel < 15), imp: 1, t: '你和{spouse}已經很久沒有好好說話了，家裡冷冰冰的。', ch: [
    { t: '一起去做婚姻諮商', chk: ['ch', 50], ok: { fx: { rel: { spouse: 20 }, md: 6, $: -12000 }, r: '在諮商師的幫助下，你們重新學會傾聽彼此。' }, no: { fx: { divorce: true, md: -15, st: 10 }, r: '你們最終決定和平分開，各自重新開始。' } },
    { t: '協議離婚', fx: { divorce: true, md: -12, st: 8 }, r: '簽字的那一刻，你的心情很複雜。' }] },
  // ── 家人 ──
  { id: 'l_home_dinner', a: [18, 30.5], stt: FREE, hm: ['rent', 'own', 'dorm'], cd: 3, t: ['週末回家吃飯，{parent}煮了一大桌菜，還硬要你帶便當回去。', '你回家看{parents}，發現他們的白頭髮又多了。', '{parent}打電話來：「最近好嗎？有沒有好好吃飯？」'], fx: { rel: { parents: 3 }, md: 2 } },
  { id: 'l_home_life', a: [18, 30.5], stt: FREE, hm: ['parents'], cd: 3, t: ['你下班回家，{parent}已經幫你留好了晚餐。', '{parent}嘮叨你房間太亂，你笑著說明天整理。', '晚上全家一起看電視，聊著家裡的大小事。'], fx: { rel: { parents: 2 } } },
  { id: 'l_parents_age', a: [22, 30.5], cd: 18, k: 'x', t: '{parent}最近常常說膝蓋痛、爬樓梯很吃力。', ch: [
    { t: '帶{parent}去看醫生', fx: { rel: { parent: 6 }, $: -2000, contrib: 1 }, r: '醫生說要多運動，你陪{parent}開始每天散步。' },
    { t: '買一台按摩椅送給{parent}', fx: { rel: { parent: 8 }, $: -30000 } },
    { t: '叮嚀{parent}多休息', fx: { rel: { parent: 2 } } }] },
  { id: 'l_parent_ill', a: [20, 30.5], k: 'x', cd: 36, w: 0.6, imp: 1, t: '{parent}突然住院開刀，你請假在醫院陪了好幾天。', fx: { md: -6, st: 6, rel: { parent: 8 }, $: -15000 } },
  { id: 'l_sib_wed', a: [18, 30.5], cd: 60, c: s => s.npcs.some(n => n.role === 'sib' && n.alive && n.older), sn: 'wedding', t: '{sib}要結婚了！婚禮上，你看著{sib}笑得好幸福。', fx: { md: 4, rel: { sib: 4 }, $: -6600 } },
  { id: 'l_newyear', a: [22, 30.5], mo: [2], cd: 12, stt: ['work'], t: '過年了，今年換你發紅包給長輩和姪子姪女。', ch: [
    { t: '大方包紅包', fx: { $: -12000, rel: { family: 4 }, md: 2 } },
    { t: '心意到就好', fx: { $: -4000, rel: { family: 1 } } }] },
  { id: 'l_newyear2', a: [18, 30.5], mo: [2], cd: 12, t: ['除夕夜全家圍爐，親戚又問你：「什麼時候結婚？」「薪水多少？」', '過年回老家，大家一起包水餃、看春節特別節目。', '過年期間你陪家人去廟裡拜拜。'], fx: { md: 2, rel: { family: 2 } } },
  // ── 朋友 ──
  { id: 'l_reunion', a: [20, 30.5], k: 'o', cd: 18, t: '國中同學辦同學會，大家變化好大。', ch: [
    { t: '去參加', fx: { md: 4, ch: 1, rel: { newfriend: 15 } }, r: '你重新聯絡上老同學{newfriend}。' },
    { t: '這次沒空', fx: {} }] },
  { id: 'l_friend_wed', a: [22, 30.5], cd: 10, sn: 'wedding', t: ['好朋友{friend}結婚了，你當了伴郎／伴娘，忙了一整天。', '這個月收到三張喜帖，紅包包到荷包大失血。'], fx: { md: 3, rel: { friend: 4 }, $: -3600 } },
  { id: 'l_friend_loan', a: [20, 30.5], k: 'x', cd: 30, t: '{friend}跟你借五萬塊，說下個月就還。', ch: [
    { t: '借他', fx: { $: -50000, rel: { friend: 5 } }, chk: ['luck', 55], ok: { fx: { $: 50000 }, r: '{friend}準時還錢，還請你吃了一頓飯。' }, no: { fx: { rel: { friend: -20 }, md: -5 }, r: '錢一直沒有還，你們的友情也變淡了。' } },
    { t: '婉拒', fx: { rel: { friend: -4 } } }] },
  { id: 'l_friend_hang', a: [18, 30.5], cd: 3, stt: FREE, t: ['下班後和{friend}去吃燒肉，聊工作聊到深夜。', '你和{friend}去看了最新上映的電影。', '你和老朋友{friend}視訊聊了兩個小時。', '週末和朋友去唱 KTV，大家都唱到破音。'], fx: { rel: { friend: 4 }, md: 2 } },
  { id: 'l_friend_drift', a: [20, 30.5], k: 'x', cd: 18, t: '你發現和以前最好的朋友，已經半年沒聯絡了。', ch: [
    { t: '主動傳訊息約吃飯', fx: { rel: { friend: 10 }, md: 3 } },
    { t: '人生本來就會漸行漸遠', fx: { md: -2 } }] },
  { id: 'l_newfriend', a: [18, 30.5], k: 'o', cd: 14, t: ['你在健身房認識了{newfriend}，常常約一起運動。', '你參加了一個讀書會，和{newfriend}很聊得來。', '你在登山社團認識了{newfriend}。'], fx: { rel: { newfriend: 22 }, ch: 1 } },
  // ── 金錢 ──
  { id: 'l_invest', a: [20, 30.5], stt: WORKING, cd: 24, c: s => s.inv.mon === 0 && s.money > 30000, t: '同事都在討論定期定額買 ETF，說長期下來比定存好。', ch: [
    { t: '每月投資 3,000 元', fx: { invest: 3000 }, r: '你設定好了扣款，告訴自己不要每天看。' },
    { t: '每月投資 10,000 元', need: (s) => s.job && s.job.pay >= 40000, needT: '月薪 4 萬以上比較適合', fx: { invest: 10000 }, r: '你決定認真投資自己的未來。' },
    { t: '我還是喜歡把錢放在銀行', fx: {} }] },
  { id: 'l_market', a: [20, 30.5], k: 'x', cd: 18, c: (s, H) => s.inv.bal > 50000 && H.econ() === 'recession', t: '股市大跌，你的投資帳戶縮水了一大截。', ch: [
    { t: '繼續扣款，長期持有', fx: { st: 3 }, r: '你關掉 APP，告訴自己這只是短期波動。' },
    { t: '受不了，全部賣掉', fx: { cashout: 1, md: -4 }, r: '你把剩下的錢拿回來，心裡踏實多了，卻也虧了一筆。' }] },
  { id: 'l_market_up', a: [20, 30.5], k: 'o', cd: 18, c: (s, H) => s.inv.bal > 50000 && H.econ() === 'boom', t: '股市大漲，你的投資帳戶創新高了！', ch: [
    { t: '賣掉一半，落袋為安', fx: { cashout: 0.5, md: 4 } },
    { t: '繼續抱著', fx: { md: 2 } }] },
  { id: 'l_save', a: [20, 30.5], stt: WORKING, cd: 18, t: '你打開記帳 APP，發現上個月花了好多錢在外食和飲料上。', ch: [
    { t: '開始自己帶便當', fx: { $: 3000, hp: 1, md: -1 } },
    { t: '賺錢就是要花的', fx: { md: 2, $: -2000 } }] },
  { id: 'l_insurance', a: [22, 30.5], stt: WORKING, once: 1, t: '保險業務員朋友來找你，建議你買一份醫療險。', ch: [
    { t: '買一份基本的醫療險', fx: { $: -15000, tag: '有保險', st: -2 } },
    { t: '先不用', fx: {} }] },
  { id: 'l_phone', a: [18, 30.5], cd: 24, t: '新款手機上市了，你的舊手機也用了好幾年。', ch: [
    { t: '買新手機', fx: { $: -32000, md: 4 } },
    { t: '換顆電池繼續用', fx: { $: -1500 } }] },
  { id: 'l_car', a: [23, 30.5], stt: WORKING, once: 1, c: s => s.money > 300000, t: '你考慮買一台車，假日帶家人出去玩比較方便。', ch: [
    { t: '買一台中古車', fx: { $: -280000, md: 5, tag: '有車' } },
    { t: '大眾運輸就夠了', fx: {} }] },
  { id: 'l_house', a: [25, 30.5], stt: WORKING, cd: 24, hm: ['rent', 'parents'], c: (s, H) => H.canHouse(), imp: 1, t: '你存到了一筆錢。{city}的房子一間大約 {house}，頭期款和稅費要 {down}。', ch: [
    { t: '咬牙買下自己的房子', fx: { house: true, md: 10, st: 6 }, r: '你拿到鑰匙的那一刻，覺得這些年的努力都值得了。' },
    { t: '房價太高了，繼續租屋', fx: { md: -1 } }] },
  { id: 'l_rent_up', a: [20, 30.5], hm: ['rent'], k: 'x', cd: 24, t: '房東說下個月要漲房租。', ch: [
    { t: '接受漲價', fx: { $: -6000, md: -2 } },
    { t: '找新的房子搬家', fx: { $: -8000, st: 4 }, r: '你花了好幾個週末看房子，終於找到一間CP值不錯的。' },
    { t: '搬回家住', need: (s) => s.npcs.some(n => (n.role === 'mom' || n.role === 'dad') && n.alive), needT: '家人不在了', fx: { home: 'parents', rel: { parents: 3 } } }] },
  { id: 'l_tax', a: [20, 30.5], stt: WORKING, mo: [5], cd: 12, t: ['五月報稅季，你第一次自己上網報所得稅。', '你報完稅，發現今年有一筆退稅。'], fx: { iq: 1, $: 1000 } },
  { id: 'l_vote', a: [20, 30.5], cd: 24, mo: [1, 11], t: ['選舉日，你回到戶籍地投下自己的一票。', '你研究了每位候選人的政見，認真地去投票。'], fx: { iq: 1, contrib: 1 } },
  // ── 健康 ──
  { id: 'l_checkup', a: [22, 30.5], stt: WORKING, cd: 24, t: '公司的年度健康檢查報告出來了。', ch: [
    { t: '認真看每一項數值', fx: { hp: 2 }, r: '醫生說你要少吃宵夜、多運動。' },
    { t: '看一眼就丟一邊', fx: {} }] },
  { id: 'l_gym', a: [18, 30.5], stt: FREE, cd: 24, t: '你看著鏡子裡的自己，決定要開始運動。', ch: [
    { t: '辦健身房會員', fx: { $: -12000, ft: 3, hp: 3, md: 2, tag: '健身族' }, r: '你每週去三次，慢慢愛上流汗的感覺。' },
    { t: '每天晚上去河堤跑步', fx: { ft: 2, hp: 2, wt: -1 } },
    { t: '明天再開始', fx: { md: -1 } }] },
  { id: 'l_back', a: [22, 30.5], stt: WORKING, k: 'x', cd: 18, sick: 1, t: ['長時間坐辦公室，你的肩頸和腰越來越痠痛。', '你連續加班好幾週，身體開始抗議了。'], fx: { hp: -3, st: 2 } },
  { id: 'l_flu', a: [18, 30.5], k: 'x', cd: 8, sick: 1, t: ['你得了流感，在家躺了三天。', '吃壞肚子，腸胃炎讓你虛脫了好幾天。', '換季時過敏發作，鼻子一直癢。'], fx: { hp: -3 } },
  { id: 'l_counsel', a: [18, 30.5], k: 'x', cd: 18, c: s => s.st.md < 40 || s.stress > 70, t: '最近總是睡不好、心情很低落，做什麼都提不起勁。', ch: [
    { t: '預約心理諮商', fx: { md: 8, st: -10, $: -6000 }, r: '諮商師耐心地聽你說話，你覺得心裡輕鬆多了。' },
    { t: '跟信任的人聊聊', fx: { md: 5, st: -5, rel: { friend: 4 } } },
    { t: '自己撐過去', fx: { md: -3 } }] },
  { id: 'l_diet', a: [18, 30.5], cd: 12, c: s => s.wOff > 4, t: '體重越來越重，衣服都穿不下了。', ch: [
    { t: '調整飲食、少喝含糖飲料', fx: { wt: -2, hp: 2, md: -1 } },
    { t: '算了，開心最重要', fx: { md: 1, wt: 1 } }] },
  { id: 'l_eat', a: [18, 30.5], cd: 6, t: ['你發現一家超好吃的牛肉麵，一週吃了三次。', '朋友揪團去吃到飽，你吃到走不動。', '宵夜吃了一大份鹹酥雞。'], fx: { md: 2, wt: 0.5 } },
  // ── 興趣與生活 ──
  { id: 'l_travel', a: [18, 30.5], stt: FREE, k: 'o', cd: 12, t: '連假快到了，要不要出去走走？', ch: [
    { t: '出國去日本玩', fx: { $: -35000, md: 8, st: -10, cr: 1 }, r: '你在京都的巷弄裡散步，吃了好多抹茶甜點。' },
    { t: '環島旅行', fx: { $: -15000, md: 6, st: -8 }, r: '你沿著海岸線走，看遍台灣的山和海。' },
    { t: '在家耍廢', fx: { md: 2, st: -4 } }] },
  { id: 'l_camping', a: [18, 30.5], stt: FREE, k: 'o', cd: 12, sn: 'mountain', t: ['你和朋友去山上露營，晚上的星空美得不像話。', '你挑戰登上玉山主峰，在山頂看日出。'], fx: { md: 5, ft: 2, st: -5 } },
  { id: 'l_concert', a: [18, 30.5], stt: FREE, k: 'o', cd: 12, t: '喜歡的樂團要開演唱會，搶票時間就在今晚。', ch: [
    { t: '準時守在電腦前搶票', chk: ['luck', 45], ok: { fx: { $: -3500, md: 8 }, r: '搶到了！演唱會那晚你喊到失聲。' }, no: { fx: { md: -3 }, r: '一秒就賣完了……' } },
    { t: '看直播就好', fx: { md: 1 } }] },
  { id: 'l_pet', a: [20, 30.5], stt: FREE, once: 1, c: s => !s.pet || !s.pet.alive, k: 'o', t: '動物收容所在辦認養活動，有一隻小狗一直看著你。', ch: [
    { t: '帶牠回家', fx: { pet: '狗', md: 8, $: -5000, contrib: 1 }, r: '家裡多了一個每天搖尾巴等你回家的小傢伙。' },
    { t: '我的生活還不適合養寵物', fx: {} }] },
  { id: 'l_hobby', a: [18, 30.5], stt: FREE, cd: 24, t: '你想培養一個新的興趣。', ch: [
    { t: '學烘焙', fx: { cr: 2, md: 3, $: -3000 }, r: '你烤出的第一個蛋糕有點塌，但很好吃。' },
    { t: '學攝影', fx: { cr: 3, $: -15000 }, r: '你開始在週末到處拍照。' },
    { t: '學一種樂器', fx: { cr: 3, md: 2, $: -6000 }, r: '你每天練習半小時，慢慢能彈出完整的曲子。' },
    { t: '學一門外語', fx: { iq: 3, $: -4000 }, r: '你開始能看懂沒有字幕的影片了。' }] },
  { id: 'l_daily', a: [18, 30.5], cd: 2, t: ['週末你睡到自然醒，煮了一頓簡單的早午餐。', '下雨天，你在家整理衣櫃，捐出一大袋舊衣服。', '你在超市採買一週的食材。', '晚上散步時，你聽著喜歡的 Podcast。', '你在陽台種了幾盆香草。', '你把房間重新布置了一遍，心情煥然一新。'], fx: { md: 1, st: -1 } },
  { id: 'l_daily2', a: [18, 30.5], cd: 2, t: ['你追完一部很好看的影集，意猶未盡。', '你在書店待了一下午，買了兩本書。', '晚上和家人視訊聊天。', '你去看了一場展覽，拍了很多照片。', '夏天太熱，你在家吹冷氣吃剉冰。'], fx: { md: 1 } },
  { id: 'l_commute', a: [18, 30.5], stt: WORKING, cd: 3, t: ['你搭捷運通勤，看著窗外發呆。', '機車在路上爆胎，你牽車走了好一段路。', '下班塞車塞了一個小時。'], fx: { st: 1 } },
  { id: 'l_volunteer', a: [18, 30.5], stt: FREE, k: 'o', cd: 12, t: '你看到一個志工招募的訊息。', ch: [
    { t: '去食物銀行當志工', fx: { contrib: 3, md: 3 } },
    { t: '去捐血', fx: { contrib: 2, hp: -1 } },
    { t: '每月小額捐款給公益團體', fx: { contrib: 2, $: -1000 } },
    { t: '最近太忙了', fx: {} }] },
  { id: 'l_reflect', a: [27, 30.5], once: 1, t: '快要 30 歲了，你常常在睡前想：這幾年，我過得好嗎？', ch: [
    { t: '寫下想完成的十件事', fx: { md: 3, cr: 1 } },
    { t: '和{parents}聊聊這些年的心情', fx: { rel: { parents: 5 }, md: 3 } },
    { t: '活在當下就好', fx: { st: -3 } }] },
  // ── 命運卡（成年） ──
  { id: 'lf_invoice', a: [18, 30.5], k: 'f', once: 1, w: 0.5, t: '你隨手對了一下發票——中了 20 萬元！', fx: { $: 200000, md: 10 } },
  { id: 'lf_accident', a: [18, 30.5], k: 'f', once: 1, sick: 1, imp: 1, sn: 'hospital', t: '你在路上被一輛闖紅燈的車撞到，住院了一個月。家人朋友輪流來照顧你。', fx: { hp: -25, md: -8, rel: { family: 5 }, $: -30000, perf: -6 } },
  { id: 'lf_mentor', a: [20, 30.5], k: 'f', once: 1, stt: WORKING, t: '一位業界前輩欣賞你，主動當你的導師，還介紹了好多機會給你。', fx: { perf: 10, ch: 3, iq: 2, md: 5, tag: '遇見貴人' } },
  { id: 'lf_illness', a: [20, 30.5], k: 'f', once: 1, sick: 1, imp: 1, sn: 'hospital', t: '健康檢查發現一個需要開刀的問題。手術很成功，但你休養了好幾個月。', fx: { hp: -20, md: -6, st: 5, $: -50000, rel: { family: 5 } } },
  { id: 'lf_flood', a: [18, 30.5], k: 'f', cd: 120, mo: [6, 7, 8, 9], t: '颱風帶來豪雨，你住的地方淹水，家具和電器都泡湯了。', fx: { $: -60000, md: -6, st: 6 } },
  { id: 'lf_quake', a: [18, 30.5], k: 'f', cd: 120, t: '一場大地震讓整棟樓劇烈搖晃，你抓著手機衝下樓，在空地上等到天亮。', fx: { md: -6, st: 6, rel: { family: 3 } } },
  { id: 'lf_grand', a: [20, 30.5], k: 'f', once: 1, c: s => s.npcs.some(n => (n.role === 'grandma' || n.role === 'grandpa') && n.alive), imp: 1, t: '{grand}在睡夢中安詳地走了。告別式上，你想起{grand}牽著你的手去買糖果的樣子。', fx: { kill: 'grand', md: -10, rel: { family: 3 } } },
  { id: 'lf_windfall', a: [20, 30.5], k: 'f', once: 1, w: 0.6, t: '你年輕時隨手買的一點股票，沒想到漲了好幾倍！', fx: { $: 150000, md: 6 } },
  { id: 'lf_opportunity', a: [22, 30.5], k: 'f', once: 1, stt: WORKING, t: '公司要派人去國外分公司兩年，{boss}第一個想到你。', ch: [
    { t: '接受外派', fx: { raise: 25, perf: 5, md: 4, st: 5, tag: '外派經驗' }, r: '你在國外學到很多，薪水也大幅提升。' },
    { t: '婉拒，想留在台灣', fx: { rel: { family: 2 } } }] }
]);

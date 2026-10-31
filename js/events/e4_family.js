/* ============================================================
 * 事件庫 · 家庭、命運卡與跨年齡事件
 * 命運卡（k: 'f'）：不可預期、影響深遠的人生轉折，平均每 7 年左右出現一張。
 * ============================================================ */
LG.addEvents([
  // ── 命運卡 ──
  { id: 'f_invoice', a: [1, 18], k: 'f', once: 1, w: 0.6, t: '{parents}對統一發票時，突然大叫一聲——中了特別獎 1,000 萬元！', fx: { wealth: 1, md: 6, $: 5000 } },
  { id: 'f_job_loss', a: [0, 22], k: 'f', cd: 72, fs: ['both', 'mom', 'dad'], c: s => s.fam.wealth >= 2, t: '{parent}工作的公司倒閉了，{parent}突然失業。家裡開始縮衣節食。', fx: { wealth: -1, md: -5, st: 4, rel: { parent: 2 } } },
  { id: 'f_promote', a: [0, 22], k: 'f', cd: 72, c: s => s.fam.wealth <= 4, t: '{parent}在工作上表現亮眼，升上了主管，薪水大幅調漲。', fx: { wealth: 1, md: 3 } },
  { id: 'f_business_ok', a: [2, 24], k: 'f', cd: 96, fs: ['both', 'mom', 'dad'], c: s => s.fam.wealth <= 4, t: '{parents}拿出積蓄開了一家早午餐店，沒想到生意越來越好，還開了第二家分店。', fx: { wealth: 1, md: 3, st: 2 } },
  { id: 'f_business_fail', a: [2, 24], k: 'f', cd: 96, fs: ['both', 'mom', 'dad'], c: s => s.fam.wealth >= 2, t: '{parents}投資朋友的生意失敗，賠掉了大部分存款。', fx: { wealth: -1, md: -4, st: 5 } },
  { id: 'f_flood', a: [0, 18], k: 'f', cd: 120, mo: [6, 7, 8, 9], t: '颱風帶來豪雨，家裡一樓淹水到膝蓋，家具和電器全泡壞了。', fx: { wealth: -1, md: -5, hp: -2 } },
  { id: 'f_big_quake', a: [0, 18], k: 'f', cd: 120, t: '一場規模 6.8 的大地震，家裡牆壁裂開、東西倒了一地，全家在學校操場過了一夜。', fx: { md: -6, st: 6, rel: { family: 3 } } },
  { id: 'f_mentor', a: [8, 20], k: 'f', cd: 120, t: '一位退休教授在社區活動注意到你，主動提出要免費指導你。', fx: { iq: 4, cr: 2, md: 3, tag: '遇見貴人' } },
  { id: 'f_scout', a: [5, 18], k: 'f', once: 1, c: s => s.st.ch >= 65, t: '你在街上被星探發掘，拍了一支廣告，在電視上播了好幾個月。', fx: { ch: 4, $: 20000, md: 5, tag: '拍過廣告' } },
  { id: 'f_illness', a: [3, 30.5], k: 'f', once: 1, sick: 1, imp: 1, t: '你持續發燒、全身無力，檢查後發現是需要長期治療的疾病。你住院了好幾週，家人輪流陪你。', fx: { hp: -25, md: -6, gr: -4, rel: { family: 5 }, tag: '重病康復' } },
  { id: 'f_inherit', a: [5, 30.5], k: 'f', once: 1, c: s => s.npcs.some(n => (n.role === 'grandpa' || n.role === 'grandma') && !n.alive), t: '整理遺物時，家人發現{parents}繼承了一塊老家的土地，家裡經濟寬裕了一些。', fx: { wealth: 1, md: 1 } },
  { id: 'f_move_job', a: [1, 17], k: 'f', cd: 96, fs: ['both', 'mom', 'dad'], t: '{parent}被公司調職到別的縣市，全家決定一起搬過去。', fx: { move: true, md: -3, st: 3 } },
  { id: 'f_relative_help', a: [6, 22], k: 'f', cd: 120, wl: [1, 2], t: '一位在國外發展的遠房親戚聽說你們家的狀況，寄來一筆錢說要給你當教育基金。', fx: { $: 30000, md: 4, wealth: 1 } },

  // ── 家人 ──
  { id: 'fam_new_sib', a: [0.8, 8], k: 'o', cd: 30, fs: ['both'], w: s => (s.npcs.filter(n => n.role === 'sib' && !n.older).length >= 1 ? 0.08 : 0.3), imp: 1, t: '{parents}跟你說：「你要當哥哥姊姊囉！」幾個月後，家裡多了一個小嬰兒。', fx: { addSib: 'R', md: 2, st: 1 } },
  { id: 'fam_grand_sick', a: [3, 30.5], k: 'x', cd: 36, t: '{grand}生病住院了，你跟著家人去醫院探望，{grand}握著你的手說沒事。', fx: { md: -3, rel: { grand: 4 } } },
  { id: 'fam_grand_die', a: [4, 30.5], k: 'x', cd: 48, w: s => 0.15 + Math.max(0, (s.ageM / 12 - 6)) * 0.03, imp: 1, t: '{grand}因病過世了。告別式那天，你看著照片，想起{grand}以前牽著你散步的樣子。', fx: { kill: 'grand', md: -10, st: 4, rel: { family: 2 } } },
  { id: 'fam_parent_sick', a: [3, 30.5], k: 'x', cd: 48, t: '{parent}因為太累病倒住院了一週，你第一次覺得{parent}也會脆弱。', fx: { md: -4, st: 3, rel: { parent: 4 } } },
  { id: 'fam_parent_fight', a: [6, 22], k: 'x', cd: 18, fs: ['both'], t: '爸媽為了錢吵得很兇，你躲在房間裡不敢出來。', fx: { md: -3, st: 3 } },
  { id: 'fam_far_parent', a: [6, 30.5], cd: 8, c: s => s.npcs.some(n => (n.role === 'mom' || n.role === 'dad') && n.alive && n.far), t: ['不住在一起的家人傳訊息問你最近好不好。', '你和不住在一起的家人約了吃飯，聊了好多近況。'], fx: { md: 1 } },
  { id: 'fam_sib_leave', a: [8, 19.5], cd: 120, c: s => s.npcs.some(n => n.role === 'sib' && n.older && n.alive && n.ageOff >= 4), t: '{sib}考上外縣市的大學，搬去住宿舍了。家裡突然安靜了好多。', fx: { md: -2, rel: { sib: 3 } } },
  { id: 'fam_buy_house', a: [1, 18], k: 'o', once: 1, wl: [3, 5], t: '{parents}終於買了自己的房子，你第一次有了自己的房間。', fx: { md: 4 } },
  { id: 'fam_buy_car', a: [1, 22], k: 'o', once: 1, wl: [2, 5], t: '家裡買了一台新車，第一次全家開車去環島。', fx: { md: 3, rel: { family: 2 } } },
  { id: 'fam_rent_up', a: [1, 18], k: 'x', cd: 60, wl: [1, 3], t: '房東說要漲房租，{parents}討論了好幾晚，最後決定搬到比較小的房子。', fx: { md: -2, st: 2 } },
  { id: 'fam_neighbor', a: [2, 30.5], cd: 12, t: ['隔壁阿姨送來一盤自己包的水餃。', '鄰居阿伯在門口泡茶，招手叫你過去吃點心。'], fx: { md: 1 } },
  { id: 'fam_reunion', a: [0, 30.5], k: 'o', cd: 24, t: '家族大團圓，表兄弟姊妹們聚在一起，熱鬧得像過年。', fx: { md: 3, ch: 1 } },
  { id: 'fam_outage', a: [3, 30.5], cd: 36, t: '全台大停電，全家打開窗戶乘涼，聊了很久很久的天。', fx: { md: 1, rel: { family: 2 } } },
  { id: 'fam_epidemic', a: [3, 30.5], k: 'x', cd: 120, mo: [1, 2, 3, 4], t: '傳染病大流行，學校停課、大家都戴著口罩，你在家上了好幾週的線上課。', fx: { md: -3, st: 2, rel: { family: 2 } } },
  { id: 'fam_donate', a: [6, 30.5], cd: 24, t: '新聞報導了一場災難，你把存錢筒裡的一部分錢捐了出去。', fx: { $: -300, contrib: 2 } },
  { id: 'fam_temple', a: [3, 30.5], cd: 18, t: ['{grand}帶你去廟裡拜文昌帝君，祈求考試順利。', '過年時全家去廟裡點光明燈。'], fx: { md: 1 } },
  { id: 'fam_pet_old', a: [2, 30.5], k: 'x', once: 1, c: s => s.pet && s.pet.alive && s.ageM - s.pet.since >= 96, imp: 1, t: '{pet}年紀大了，在一個安靜的早晨永遠地睡著了。你抱著牠的項圈哭了好久。', fx: { petdie: true, md: -8 } },
  { id: 'fam_pet_sick', a: [2, 30.5], k: 'x', cd: 24, t: '{pet}生病了，帶去動物醫院打針吃藥，你每天都在旁邊照顧。', fx: { md: -2 } },
  { id: 'fam_pet_trick', a: [2, 30.5], cd: 6, t: ['{pet}今天又把拖鞋叼走了。', '{pet}在你寫功課時跳上桌子。', '每次回家，{pet}都在門口等你。'], fx: { md: 2 } },
  { id: 'fam_horoscope', a: [8, 30.5], cd: 6, w: 0.4, t: ['你在網路上看到「{zodiac}本月運勢：人際運旺，適合主動出擊」。', '「{zodiac}本月運勢：注意健康，早點睡」——你看完還是熬夜了。', '「{zodiac}本月運勢：財運普通，忍住購物衝動」。'], fx: {} },
  { id: 'fam_weather', a: [2, 30.5], cd: 14, t: ['寒流來襲，你穿了三件外套出門。', '連續下了一週的雨，衣服都晾不乾。', '天氣好好，{parent}帶你去河堤騎腳踏車。'], fx: { md: 1 } },
  { id: 'fam_election', a: [6, 18], cd: 48, mo: [11, 12, 1], t: '選舉快到了，街上到處都是宣傳車，{parents}帶你一起去投票所，在旁邊看他們投票。', fx: { iq: 1 } }
]);

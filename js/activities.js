/* ============================================================
 * 行程活動（養成模式）
 * 每個月有 4 格行程；上學、上班、服役會固定占用格子。
 * k    成長方向：study 學習/工作、sport 運動、art 才藝、social 社交、leisure 休閒
 * a    年齡範圍 [最小, 最大)；stt 身分限定（school/uni/army/work/seek/prep/retired）
 * cost 每格花費（2026 年幣值）；inc 收入；fx 效果（和事件相同的寫法）
 * skill 練習的技能；mark 記錄（checkup 健康檢查、kidcare 陪孩子、jobprep 求職準備…）
 * ev / evP  這個活動有機率引發的事件（例如聯誼可能認識喜歡的人）
 * ============================================================ */
const KIDS = ['school'];
const UNIS = ['uni'];
const ADULT = ['work', 'seek', 'prep'];
const ADULTR = ['work', 'seek', 'prep', 'retired'];
LG.ACTS = [
  // ── 固定行程 ──
  { id: 'kinder', locked: true, n: '上幼兒園', ico: '🎒', k: 'social', fx: { ch: 1, iq: 1 }, sn: 'kinder', t: ['你在幼兒園和小朋友一起唱歌跳舞。', '老師教大家摺紙，你摺了一隻小狗。', '幼兒園的點心是綠豆湯，你吃了兩碗。'] },
  { id: 'school', locked: true, n: '上學', ico: '🏫', k: 'study', fx: { iq: 1 }, sn: 'classroom', t: ['你乖乖上完了這個月的課。', '這個月學校教了新的單元，你認真抄筆記。', '上課、下課、午休，學校生活一天天過去。'] },
  { id: 'class', locked: true, n: '上課', ico: '📖', k: 'study', fx: { iq: 1 }, sn: 'campus', t: ['你在學校上了一整個月的課。', '這個月的課程很有趣，你學到不少新東西。'] },
  { id: 'service', locked: true, n: '服役', ico: '🪖', k: 'sport', fx: { ft: 2 }, st: 1, sn: 'army', t: ['操課、站哨、打掃營區，日子規律又辛苦。', '這個月部隊忙著準備測驗，大家都很拚。'] },
  { id: 'job', locked: true, n: '上班', ico: '💼', k: 'study', fx: {}, sn: 'job', t: ['你認真完成了這個月的工作。', '每天通勤、上班、下班，這個月平平順順。', '這個月工作很忙，但也很有成就感。'] },
  { id: 'shop', locked: true, n: '顧店', ico: '🏪', k: 'study', fx: { ch: 1 }, sn: 'cafe', t: ['你一早就到店裡準備，忙到打烊。', '熟客越來越多，常常有人跟你聊天。'] },

  // ── 嬰兒期 0–3 ──
  { id: 'b_read', n: '親子共讀', ico: '📚', k: 'study', a: [0, 3], fx: { iq: 3, rel: { parent: 1 } }, sn: 'nursery', t: ['{parent}抱著你唸繪本，你指著圖片咿咿呀呀。', '你最喜歡那本動物繪本，每天都要聽一遍。'] },
  { id: 'b_crawl', n: '爬爬運動', ico: '🧸', k: 'sport', a: [0, 2], fx: { ft: 3 }, sn: 'nursery', t: ['你在地墊上爬來爬去，越爬越快。', '你努力爬向前面的玩具，終於抓到了！'] },
  { id: 'b_walk', n: '出門散步', ico: '🌤️', k: 'sport', a: [0, 3], fx: { hp: 2, md: 1 }, sn: 'park', t: ['{parent}推著嬰兒車帶你去公園曬太陽。', '你在公園看鴿子，看得目不轉睛。'] },
  { id: 'b_song', n: '唱兒歌跳舞', ico: '🎵', k: 'art', a: [0, 3], fx: { cr: 3, md: 1 }, sn: 'nursery', t: ['你聽到音樂就跟著扭來扭去。', '{parent}唱兒歌給你聽，你拍手拍得好開心。'] },
  { id: 'b_play', n: '和家人玩', ico: '👨‍👩‍👧', k: 'social', a: [0, 3], fx: { ch: 3, rel: { family: 1 } }, sn: 'home', t: ['全家人圍著你，輪流逗你笑。', '你和家人玩躲貓貓，笑到打嗝。'] },
  { id: 'b_blocks', n: '積木拼圖', ico: '🧩', k: 'study', a: [1, 3], fx: { iq: 2, cr: 1 }, sn: 'nursery', t: ['你疊積木疊到第五層！', '你把形狀積木一個一個塞進對的洞裡。'] },
  { id: 'b_swim', n: '親子游泳', ico: '🏊', k: 'sport', a: [0.5, 3], cost: 1200, fx: { ft: 2, hp: 2 }, skill: 'swim', sn: 'pool', t: ['你在泳池裡踢水，笑得好開心。'] },
  { id: 'b_sleep', n: '好好睡覺', ico: '😴', k: 'leisure', a: [0, 3], fx: { hp: 3, md: 2 }, sn: 'nursery', t: ['你睡得香甜，一覺到天亮。', '你抱著小被被，睡得四腳朝天。'] },

  // ── 幼兒期 3–6 ──
  { id: 'k_book', n: '看繪本', ico: '📖', k: 'study', a: [3, 6], fx: { iq: 3 }, sn: 'home', t: ['你自己翻著繪本，編出新的故事。', '睡前{parent}唸故事給你聽。'] },
  { id: 'k_draw', n: '畫畫', ico: '🖍️', k: 'art', a: [3, 7], fx: { cr: 3 }, skill: 'art', sn: 'home', t: ['你畫了一張全家福，貼在冰箱上。', '你用蠟筆畫了一隻會飛的恐龍。'] },
  { id: 'k_park', n: '去公園玩', ico: '🛝', k: 'sport', a: [3, 7], fx: { ft: 3, md: 1 }, sn: 'park', pose: 'cheer', t: ['你在公園溜滑梯溜了二十次。', '你盪鞦韆盪得好高好高。'] },
  { id: 'k_friends', n: '和小朋友玩', ico: '🧒', k: 'social', a: [3, 7], fx: { ch: 3, rel: { friends: 2 } }, ev: 'a_newfriend', evP: 0.18, sn: 'park', t: ['你和鄰居小朋友玩鬼抓人。', '你和小朋友玩扮家家酒。'] },
  { id: 'k_piano', n: '鋼琴課', ico: '🎹', k: 'art', a: [4, 7], cost: 2000, fx: { cr: 3, iq: 1 }, skill: 'piano', sn: 'home', t: ['你在鋼琴課學會了〈小星星〉。', '老師說你的手指越來越靈活了。'] },
  { id: 'k_dance', n: '舞蹈課', ico: '🩰', k: 'sport', a: [3, 7], cost: 1800, fx: { ft: 2, ch: 2 }, skill: 'dance', sn: 'kinder', pose: 'cheer', t: ['你在舞蹈教室轉圈圈。', '你學會了一段新的舞步。'] },
  { id: 'k_swim', n: '游泳課', ico: '🏊', k: 'sport', a: [3, 7], cost: 1500, fx: { ft: 3, hp: 1 }, skill: 'swim', sn: 'pool', t: ['你學會在水裡憋氣了！', '你拿著浮板踢水前進。'] },
  { id: 'k_english', n: '兒童美語', ico: '🔤', k: 'study', a: [4, 7], cost: 3000, fx: { iq: 3 }, skill: 'english', sn: 'kinder', t: ['你學會了二十個英文單字。', '你在美語課唱了一首英文歌。'] },
  { id: 'k_tv', n: '看卡通', ico: '📺', k: 'leisure', a: [3, 7], fx: { md: 3, st: -2 }, sn: 'home', t: ['你看卡通看得入迷。', '你跟著卡通主角學了好多招式。'] },
  { id: 'k_chores', n: '幫忙做家事', ico: '🧹', k: 'social', a: [4, 12], fx: { rel: { parents: 3 }, contrib: 1 }, sn: 'home', t: ['你幫{parent}晾衣服。', '你幫忙把碗筷擺好，{parent}誇你好棒。'] },

  // ── 學生 6–18 ──
  { id: 's_study', n: '自己讀書', ico: '✏️', k: 'study', a: [6, 19], stt: KIDS, fx: { iq: 2, gr: 2 }, sn: 'home', t: ['你把這個月的進度都複習完了。', '你在書桌前寫完一整本評量。'] },
  { id: 's_chi', n: '讀國文', ico: '📝', k: 'study', subj: 'chi', a: [6, 19], stt: KIDS, fx: { iq: 1.5, cr: 0.5 }, sn: 'home', t: ['你把課文背得滾瓜爛熟。', '你練習寫作文，寫了滿滿兩頁。', '你查了好多成語的意思。'] },
  { id: 's_eng', n: '讀英文', ico: '🔤', k: 'study', subj: 'eng', a: [6, 19], stt: KIDS, fx: { iq: 1.5 }, skill: 'english', sn: 'home', t: ['你背了五十個英文單字。', '你跟著課本音檔練習發音。', '你寫完一整回英文閱讀測驗。'] },
  { id: 's_math', n: '算數學', ico: '➗', k: 'study', subj: 'math', a: [6, 19], stt: KIDS, fx: { iq: 2 }, sn: 'home', t: ['你解出了一題超難的應用題。', '你把錯的題目重算了一遍。', '你寫完一整本數學評量。'] },
  { id: 's_soc', n: '讀社會', ico: '🌏', k: 'study', subj: 'soc', a: [6, 19], stt: KIDS, fx: { iq: 1.5 }, sn: 'home', t: ['你畫了一張台灣地圖，標出每個縣市。', '你把歷史年代表整理成筆記。', '你看新聞時想到課本教過的內容。'] },
  { id: 's_sci', n: '讀自然', ico: '🔬', k: 'study', subj: 'sci', a: [6, 19], stt: KIDS, fx: { iq: 1.5, cr: 0.5 }, sn: 'home', t: ['你在家做了一個小實驗。', '你把理化公式整理成一張表。', '你觀察了一整週的月亮變化。'] },
  { id: 'c_math', n: '數學補習班', ico: '📐', k: 'study', subj: 'math', a: [10, 19], stt: KIDS, cost: 3500, fx: { iq: 2.5, st: 1.5 }, sn: 'classroom', t: ['補習班老師的解題技巧很厲害。', '你在補習班寫了一整疊考卷。'] },
  { id: 'c_sci', n: '理化補習班', ico: '⚗️', k: 'study', subj: 'sci', a: [12, 19], stt: KIDS, cost: 3500, fx: { iq: 2.5, st: 1.5 }, sn: 'classroom', t: ['老師用實驗影片講解，你一下就懂了。', '你終於搞懂了化學方程式。'] },
  { id: 'c_chi', n: '作文班', ico: '✒️', k: 'study', subj: 'chi', a: [8, 19], stt: KIDS, cost: 2500, fx: { iq: 1, cr: 2 }, skill: 'write', sn: 'classroom', t: ['老師說你的作文很有想法。', '你的作文被貼在教室後面。'] },
  { id: 's_cram', n: '全科補習班', ico: '🏫', k: 'study', a: [9, 19], stt: KIDS, cost: 4500, fx: { iq: 2, gr: 4, st: 2 }, sn: 'classroom', t: ['補習班老師的解題技巧很厲害。', '你每週有三天晚上都在補習班。'] },
  { id: 's_library', n: '圖書館看書', ico: '📚', k: 'study', a: [6, 19], stt: KIDS, fx: { iq: 2, cr: 1 }, skill: 'write', sn: 'classroom', t: ['你在圖書館讀完一套偵探小說。', '你在圖書館找到一本有趣的科學書。'] },
  { id: 's_english', n: '英文補習班', ico: '🗣️', k: 'study', subj: 'eng', a: [7, 19], stt: KIDS, cost: 3500, fx: { iq: 2, gr: 1 }, skill: 'english', sn: 'classroom', t: ['你背了一百個英文單字。', '英文老師說你的發音進步很多。'] },
  { id: 's_code', n: '程式設計課', ico: '💻', k: 'study', a: [9, 19], stt: KIDS, cost: 3000, fx: { iq: 2, cr: 2 }, skill: 'code', sn: 'classroom', t: ['你寫出了一個會動的小遊戲。', '你學會了用程式控制機器人。'] },
  { id: 's_piano', n: '學樂器', ico: '🎹', k: 'art', a: [6, 19], stt: KIDS, cost: 2500, fx: { cr: 3 }, skill: 'piano', sn: 'home', t: ['你練了一首新曲子，彈給家人聽。', '你每天練琴半小時。'] },
  { id: 's_art', n: '美術班', ico: '🎨', k: 'art', a: [6, 19], stt: KIDS, cost: 2000, fx: { cr: 3 }, skill: 'art', sn: 'classroom', t: ['你畫了一張水彩風景畫。', '美術老師把你的作品貼在教室後面。'] },
  { id: 's_dance', n: '舞蹈', ico: '💃', k: 'sport', a: [6, 19], stt: KIDS, cost: 2000, fx: { ft: 2, ch: 2 }, skill: 'dance', sn: 'field', pose: 'cheer', t: ['你練了一支新的舞。', '舞蹈老師選你站第一排。'] },
  { id: 's_swim', n: '游泳', ico: '🏊', k: 'sport', a: [6, 19], stt: KIDS, cost: 1200, fx: { ft: 3, hp: 1 }, skill: 'swim', sn: 'pool', t: ['你能一口氣游五十公尺了。', '你在泳池練習蝶式。'] },
  { id: 's_ball', n: '打球', ico: '🏀', k: 'sport', a: [6, 19], stt: KIDS, fx: { ft: 3, ch: 1, rel: { friends: 1 } }, skill: 'ball', sn: 'field', pose: 'cheer', t: ['放學後你和同學打了一場球。', '你練習投籃，命中率越來越高。'] },
  { id: 's_martial', n: '跆拳道', ico: '🥋', k: 'sport', a: [6, 19], stt: KIDS, cost: 1800, fx: { ft: 3, hp: 1 }, sn: 'field', t: ['你升上了新的腰帶顏色！', '你練習踢腿，踢得又高又穩。'] },
  { id: 's_friends', n: '和朋友出去玩', ico: '🧋', k: 'social', a: [6, 19], stt: KIDS, cost: 300, fx: { ch: 2, md: 2, rel: { friends: 2 } }, ev: 'a_newfriend', evP: 0.15, sn: 'street', t: ['你和朋友去逛街、喝飲料。', '你和朋友去看了一場電影。'] },
  { id: 's_club', n: '社團活動', ico: '🎸', k: 'social', a: [12, 19], stt: KIDS, fx: { ch: 2, cr: 1, rel: { friends: 1 } }, ev: 'a_newfriend', evP: 0.12, sn: 'classroom', t: ['社團成果發表會快到了，大家每天練習。', '你在社團認識了好多學長姊。'] },
  { id: 's_volunteer', n: '當志工', ico: '🤝', k: 'social', a: [10, 19], stt: KIDS, fx: { contrib: 2, ch: 1 }, sn: 'park', t: ['你去淨灘，撿了一大袋垃圾。', '你到圖書館幫忙整理書。'] },
  { id: 's_family', n: '陪家人', ico: '🏠', k: 'social', a: [6, 19], stt: KIDS, fx: { rel: { family: 2 }, md: 1 }, sn: 'home', t: ['週末全家一起去吃好料。', '你陪{parent}去市場買菜。'] },
  { id: 's_game', n: '打電動', ico: '🎮', k: 'leisure', a: [6, 19], stt: KIDS, fx: { md: 3, st: -3, gr: -1 }, sn: 'home', t: ['你破了新的關卡！', '你和朋友線上組隊打遊戲。'] },
  { id: 's_rest', n: '休息放空', ico: '☁️', k: 'leisure', a: [6, 19], stt: KIDS, fx: { st: -4, md: 2, hp: 1 }, sn: 'home', t: ['你在家睡到自然醒。', '你躺在床上聽音樂，什麼都不想。'] },
  { id: 's_exam', n: '考前衝刺', ico: '🔥', k: 'study', a: [14, 19], stt: KIDS, need: (S) => (S.school.grade === 9 && S.month <= 5) || (S.school.grade === 12 && (S.month >= 9 || S.month <= 5)), needT: '會考或學測前才能衝刺', fx: { gr: 5, st: 4, hp: -1 }, sn: 'classroom', t: ['你寫了一整疊考古題。', '你把錯題本整理了一遍。'] },
  { id: 's_parttime', n: '打工', ico: '🧋', k: 'social', a: [16, 19], stt: KIDS, inc: (S) => S.wageH * 20, fx: { ch: 1, st: 2 }, sn: 'shop', wear: 'apron', t: ['你在飲料店打工，學會了搖飲料。', '週末在便利商店值班。'] },
  { id: 's_date', n: '約會', ico: '💗', k: 'social', a: [13, 19], ms: ['dating'], cost: 300, fx: { rel: { crush: 5 }, md: 3 }, sn: 'park', t: ['你和{crush}一起去看電影。', '你和{crush}在河堤散步聊天。'] },
  { id: 's_meet', n: '參加營隊', ico: '🏕️', k: 'social', a: [13, 19], stt: KIDS, cost: 2000, fx: { ch: 2, md: 2 }, ev: 'a_meet', evP: (S) => (S.tags.includes('交往中') ? 0 : 0.18 + S.st.ch / 500), sn: 'mountain', t: ['你參加了一個暑期營隊，認識好多人。'] },
  { id: 'x_drive', n: '駕訓班', ico: '🛵', k: 'study', a: [18, 70], need: (S) => !S.tags.includes('機車駕照'), needT: '你已經有駕照了', cost: 3000, fx: { iq: 1 }, ev: 'a_license', evP: 1, sn: 'street', t: ['你在駕訓班練習機車路考。'] },

  // ── 大學 ──
  { id: 'u_study', n: '認真念書', ico: '📖', k: 'study', stt: UNIS, fx: { iq: 3, gr: 3 }, sn: 'campus', t: ['你把上課筆記整理成重點。', '你在讀書室念到最後一個離開。'] },
  { id: 'u_library', n: '泡圖書館', ico: '📚', k: 'study', stt: UNIS, fx: { iq: 2, cr: 1 }, skill: 'write', sn: 'campus', t: ['你在圖書館讀完三本專業書。'] },
  { id: 'u_english', n: '英文進修', ico: '🔤', k: 'study', stt: UNIS, cost: 2000, fx: { iq: 2 }, skill: 'english', sn: 'campus', t: ['你參加了英文會話社。'] },
  { id: 'u_code', n: '自學程式', ico: '💻', k: 'study', stt: UNIS, fx: { iq: 2, cr: 1 }, skill: 'code', sn: 'campus', t: ['你做了一個自己的網站。'] },
  { id: 'u_parttime', n: '打工', ico: '🧋', k: 'social', stt: UNIS, inc: (S) => S.wageH * 28, fx: { ch: 1, st: 2 }, sn: 'shop', wear: 'apron', t: ['你在餐廳打工，忙到腳痠。', '你在便利商店值夜班。'] },
  { id: 'u_tutor', n: '當家教', ico: '🧑‍🏫', k: 'study', stt: UNIS, need: (S) => S.grades >= 70, needT: '成績要 70 分以上', inc: (S, H) => H.m(6000), fx: { iq: 1, ch: 1 }, sn: 'home', t: ['你教一位國中生數學，他考了全班第一。'] },
  { id: 'u_intern', n: '實習', ico: '🏢', k: 'study', stt: UNIS, need: (S) => (S.school.stage === 'uni' && S.school.year >= 3) || S.school.stage === 'grad' || S.school.grade >= 13, needT: '大三以上才能實習', inc: (S, H) => H.m(9000), fx: { iq: 2, ch: 1, tag: '實習經驗' }, sn: 'office', wear: 'office', t: ['你在公司實習，學到課本沒教的東西。'] },
  { id: 'u_club', n: '社團', ico: '🎸', k: 'social', stt: UNIS, fx: { ch: 2, cr: 2, rel: { friends: 1 } }, ev: 'a_newfriend', evP: 0.15, sn: 'campus', t: ['社團辦了一場成果發表會。', '你在社團學會了新技能。'] },
  { id: 'u_team', n: '系隊運動', ico: '🏐', k: 'sport', stt: UNIS, fx: { ft: 3, ch: 1 }, skill: 'ball', sn: 'field', pose: 'cheer', t: ['你們系隊打進了八強！'] },
  { id: 'u_gym', n: '健身房', ico: '🏋️', k: 'sport', stt: UNIS, cost: 1000, fx: { ft: 3, hp: 2, wt: -0.5 }, skill: 'fit', sn: 'field', t: ['你在健身房練出了一點肌肉線條。'] },
  { id: 'u_friends', n: '和朋友吃喝玩樂', ico: '🍢', k: 'social', stt: UNIS, cost: 1500, fx: { md: 3, ch: 1, rel: { friends: 2 } }, ev: 'a_newfriend', evP: 0.12, sn: 'nightmarket', t: ['你和朋友去夜市吃宵夜。', '你們去唱歌唱到半夜。'] },
  { id: 'u_meet', n: '聯誼', ico: '💌', k: 'social', stt: UNIS, ms: ['single'], cost: 800, fx: { ch: 2, md: 1 }, ev: 'a_meet', evP: (S) => 0.22 + S.st.ch / 400, sn: 'cafe', t: ['你參加了一場聯誼。'] },
  { id: 'u_date', n: '約會', ico: '💗', k: 'social', stt: UNIS, ms: ['dating'], cost: 1000, fx: { rel: { crush: 6 }, md: 3 }, sn: 'park', t: ['你和{crush}去看了海。', '你和{crush}在校園草地上野餐。'] },
  { id: 'u_travel', n: '旅行', ico: '🧳', k: 'leisure', stt: UNIS, cost: 8000, fx: { md: 5, st: -8, cr: 1 }, sn: 'beach', t: ['你和朋友去墾丁玩了三天。', '你一個人背包去花蓮旅行。'] },
  { id: 'u_family', n: '回家陪家人', ico: '🏠', k: 'social', stt: UNIS, fx: { rel: { parents: 3 }, md: 2 }, sn: 'home', t: ['你回家吃{parent}煮的飯。'] },
  { id: 'u_rest', n: '在宿舍休息', ico: '😴', k: 'leisure', stt: UNIS, fx: { st: -5, hp: 1 }, sn: 'home', t: ['你睡了一整天，終於補足了睡眠。'] },

  // ── 服役 ──
  { id: 'm_rest', n: '休假在家', ico: '🏠', k: 'leisure', stt: ['army'], fx: { st: -5, md: 2 }, sn: 'home', t: ['放假回家，你一進門就倒在床上。'] },
  { id: 'm_family', n: '陪家人', ico: '👨‍👩‍👧', k: 'social', stt: ['army'], fx: { rel: { parents: 3 } }, sn: 'home', t: ['休假時你陪家人吃飯。'] },
  { id: 'm_date', n: '約會', ico: '💗', k: 'social', stt: ['army'], ms: ['dating'], cost: 800, fx: { rel: { crush: 6 }, md: 3 }, sn: 'park', t: ['休假時你和{crush}約會。'] },
  { id: 'm_study', n: '讀書準備未來', ico: '📖', k: 'study', stt: ['army'], fx: { iq: 2 }, sn: 'army', t: ['你利用空檔看書、準備證照。'] },
  { id: 'm_fit', n: '自主訓練', ico: '💪', k: 'sport', stt: ['army'], fx: { ft: 3, hp: 1 }, skill: 'fit', sn: 'army', t: ['你每天多跑三公里。'] },

  // ── 成年人 ──
  { id: 'w_overtime', n: '加班衝業績', ico: '⏰', k: 'study', stt: ['work'], need: (S) => S.job && S.job.id !== 'owner', needT: '老闆沒有加班費', inc: (S) => S.job.pay * 0.12, fx: { perf: 4, st: 4, hp: -1 }, sn: 'job', pose: 'idle', t: ['你連續加班了好幾天，業績亮眼。', '你留在公司把專案趕完。'] },
  { id: 'w_learn', n: '進修課程', ico: '🎓', k: 'study', stt: ADULT, cost: 3000, fx: { iq: 3, perf: 1 }, sn: 'campus', t: ['你報名了在職進修課程。', '你上完了一門線上課程，拿到結業證書。'] },
  { id: 'w_english', n: '學英文', ico: '🔤', k: 'study', a: [18, 80], stt: ADULTR, cost: 2000, fx: { iq: 2 }, skill: 'english', sn: 'cafe', t: ['你每天聽英文 Podcast。'] },
  { id: 'w_code', n: '學程式', ico: '💻', k: 'study', a: [18, 70], stt: ADULT, cost: 1500, fx: { iq: 2, cr: 1 }, skill: 'code', sn: 'home', t: ['你在線上課程學會了新的程式語言。'] },
  { id: 'w_jobprep', n: '準備履歷面試', ico: '📝', k: 'study', stt: ['seek', 'work'], mark: 'jobprep', fx: { ch: 1, iq: 1 }, sn: 'home', t: ['你重寫了履歷，還練習了面試問答。'] },
  { id: 'w_exam', n: '準備考試', ico: '📚', k: 'study', stt: ['prep', 'work', 'seek'], need: (S) => !!S.flags.prep, needT: '要先決定準備公職考試', mark: 'studyprep', fx: { iq: 2, st: 2 }, sn: 'home', t: ['你在圖書館念了一整天的考古題。'] },
  { id: 'w_social', n: '和同事聚餐', ico: '🍻', k: 'social', stt: ['work'], need: (S) => S.job && S.job.id !== 'owner', needT: '你是自己當老闆', cost: 1500, fx: { ch: 2, perf: 2, rel: { colleagues: 2 } }, sn: 'cafe', t: ['你和同事吃了一頓熱炒，聊得很開心。', '你參加部門聚餐，和主管聊了很多。'] },
  { id: 'w_side', n: '經營副業', ico: '💡', k: 'study', stt: ['work', 'seek'], inc: (S, H) => H.m(5000) * (0.4 + S.st.cr / 80), fx: { cr: 2, st: 3 }, sn: 'home', t: ['你下班後接了設計外包。', '你在網路上賣起了手作小物。'] },
  { id: 'w_gym', n: '健身房', ico: '🏋️', k: 'sport', a: [18, 80], stt: ADULTR, cost: 1500, fx: { ft: 3, hp: 2, wt: -0.6 }, skill: 'fit', sn: 'field', t: ['你在健身房揮汗如雨。', '你的深蹲重量又進步了。'] },
  { id: 'w_run', n: '慢跑', ico: '🏃', k: 'sport', a: [18, 75], stt: ADULTR, fx: { ft: 2, hp: 2, st: -2 }, sn: 'park', t: ['你沿著河堤跑了五公里。', '你參加了一場路跑活動。'] },
  { id: 'w_hike', n: '登山健行', ico: '⛰️', k: 'sport', a: [18, 75], stt: ADULTR, cost: 800, fx: { ft: 3, md: 3, st: -4 }, sn: 'mountain', t: ['你爬上了一座百岳，看到滿山的雲海。'] },
  { id: 'w_hobby', n: '學才藝', ico: '🎨', k: 'art', a: [18, 80], stt: ADULTR, cost: 1500, fx: { cr: 3, md: 2 }, skill: 'art', sn: 'home', t: ['你報名了畫畫課，畫了第一幅油畫。', '你學起了烏克麗麗。'] },
  { id: 'w_music', n: '練樂器', ico: '🎸', k: 'art', a: [18, 90], stt: ADULTR, fx: { cr: 3, md: 2 }, skill: 'piano', sn: 'home', t: ['你練會了一首喜歡的歌。'] },
  { id: 'w_cook', n: '下廚做菜', ico: '🍳', k: 'art', a: [16, 95], stt: ADULTR.concat(UNIS), fx: { cr: 1, hp: 1, $: 1500 }, skill: 'cook', sn: 'home', t: ['你做了一桌好菜，還省下外食的錢。', '你學會了一道新的家常菜。'] },
  { id: 'w_write', n: '寫作', ico: '✍️', k: 'art', a: [16, 100], stt: ADULTR.concat(UNIS), fx: { cr: 2, iq: 1 }, skill: 'write', sn: 'cafe', t: ['你在咖啡廳寫了一篇文章。', '你開始寫部落格，分享生活點滴。'] },
  { id: 'w_invest', n: '研究理財', ico: '📈', k: 'study', a: [18, 90], stt: ADULTR, fx: { iq: 1 }, skill: 'invest', sn: 'home', t: ['你讀了一本理財書，開始記帳。', '你研究了幾檔 ETF 的成分股。'] },
  { id: 'w_meet', n: '聯誼交友', ico: '💌', k: 'social', a: [18, 70], stt: ADULTR, ms: ['single'], cost: 1500, fx: { ch: 2, md: 1 }, ev: 'a_meet', evP: (S) => 0.2 + S.st.ch / 400 - Math.max(0, S.ageM / 12 - 40) / 100, sn: 'cafe', t: ['朋友找你參加聚會，認識了一些新朋友。', '你參加了一場戶外聯誼。'] },
  { id: 'w_date', n: '約會', ico: '💗', k: 'social', a: [18, 100], ms: ['dating', 'married'], cost: 1500, fx: { rel: { partner: 6 }, md: 3 }, sn: 'park', t: ['你和{partner}去吃了一家很棒的餐廳。', '你和{partner}在河堤散步，聊了好多。', '你和{partner}一起去看電影。'] },
  { id: 'w_friends', n: '和朋友聚會', ico: '🧑‍🤝‍🧑', k: 'social', a: [18, 100], stt: ADULTR, cost: 1200, fx: { md: 3, rel: { friends: 3 } }, ev: 'a_newfriend', evP: 0.08, sn: 'cafe', t: ['你和老朋友聚餐，聊到忘了時間。', '週末和朋友去唱 KTV。'] },
  { id: 'w_parents', n: '陪伴父母', ico: '👵', k: 'social', a: [18, 100], need: (S, H) => H.alive('mom') || H.alive('dad'), needT: '父母已經不在了', fx: { rel: { parents: 4 }, md: 1 }, sn: 'home', t: ['你回家陪{parent}吃飯。', '你帶{parent}去郊外走走。'] },
  { id: 'w_kids', n: '陪孩子', ico: '🧸', k: 'social', a: [18, 100], kid: true, mark: 'kidcare', fx: { rel: { kids: 4 }, md: 3 }, sn: 'park', t: ['你陪{child}去公園玩。', '你陪{child}寫功課。', '你帶{child}去動物園。'] },
  { id: 'w_volunteer', n: '當志工', ico: '🤝', k: 'social', a: [18, 100], stt: ADULTR, fx: { contrib: 3, md: 2 }, sn: 'street', t: ['你到食物銀行幫忙分裝物資。', '你參加了淨灘活動。'] },
  { id: 'w_travel', n: '出國旅行', ico: '✈️', k: 'leisure', a: [18, 90], stt: ADULTR, cost: 20000, fx: { md: 6, st: -10, cr: 2 }, sn: 'beach', t: ['你去日本玩了一週，吃了好多美食。', '你去歐洲自助旅行，看了好多美術館。'] },
  { id: 'w_trip', n: '國內小旅行', ico: '🚗', k: 'leisure', a: [18, 95], stt: ADULTR, cost: 6000, fx: { md: 4, st: -6 }, sn: 'mountain', t: ['你去花東看海、泡溫泉。', '你去台南吃了兩天的小吃。'] },
  { id: 'w_rest', n: '在家休息', ico: '🛋️', k: 'leisure', a: [18, 100], fx: { st: -5, md: 2, hp: 1 }, sn: 'home', t: ['你在家耍廢一整天，追了好幾集劇。', '你睡到自然醒，煮了一頓早午餐。'] },
  { id: 'w_checkup', n: '健康檢查／看醫生', ico: '🩺', k: 'leisure', a: [25, 100], cost: 1500, mark: 'checkup', fx: { hp: 3 }, sn: 'hospital', t: ['你做了一次完整的健康檢查。', '你按時回診，醫生說控制得不錯。'] },
  { id: 'w_care', n: '照顧家人', ico: '🧓', k: 'social', a: [18, 100], need: (S) => S.npcs.some(n => n.alive && n.frail), needT: '目前沒有需要照顧的家人', fx: { rel: { family: 4 }, st: 3, contrib: 2 }, sn: 'home', t: ['你陪生病的家人去復健。', '你幫家人準備三餐、按摩。'] },

  // ── 退休生活 ──
  { id: 'r_walk', n: '公園散步', ico: '🌳', k: 'sport', a: [55, 100], stt: ['retired'], fx: { hp: 2, ft: 1, md: 1 }, sn: 'park', t: ['你每天早上去公園走兩圈。', '你在公園和老鄰居打招呼。'] },
  { id: 'r_taichi', n: '太極拳／土風舞', ico: '🧘', k: 'sport', a: [55, 100], stt: ['retired'], fx: { hp: 2, ft: 2, ch: 1 }, sn: 'park', t: ['你跟著大家在公園打太極拳。', '你參加社區土風舞班。'] },
  { id: 'r_garden', n: '種花園藝', ico: '🌷', k: 'art', a: [55, 100], stt: ['retired'], fx: { md: 3, cr: 1 }, skill: 'garden', sn: 'home', t: ['你在陽台種的番茄結果了。', '你的蘭花開了，鄰居都來看。'] },
  { id: 'r_calli', n: '練書法', ico: '🖌️', k: 'art', a: [55, 100], stt: ['retired'], fx: { cr: 2, md: 2 }, skill: 'calli', sn: 'home', t: ['你寫了一幅春聯送給家人。'] },
  { id: 'r_class', n: '長青學苑', ico: '🏫', k: 'study', a: [55, 100], stt: ['retired'], cost: 800, fx: { iq: 2, ch: 2 }, ev: 'a_newfriend', evP: 0.12, sn: 'classroom', t: ['你在長青學苑學用手機視訊。', '你在社區大學上了一門歷史課。'] },
  { id: 'r_grandkids', n: '帶孫子', ico: '👶', k: 'social', a: [40, 100], gkid: true, fx: { md: 4, rel: { gkid: 4 }, st: 1 }, sn: 'park', t: ['你帶{gkid}去公園溜滑梯。', '{gkid}叫你的時候，你的心都融化了。'] },
  { id: 'r_temple', n: '廟裡拜拜', ico: '🏮', k: 'social', a: [50, 100], fx: { md: 2, ch: 1 }, sn: 'temple', t: ['你到廟裡拜拜，幫家人求平安。', '你參加了媽祖遶境。'] },
  { id: 'r_tea', n: '和老朋友喝茶', ico: '🍵', k: 'social', a: [50, 100], stt: ['retired'], fx: { md: 3, rel: { friends: 3 } }, sn: 'cafe', t: ['你和老朋友在茶館聊起年輕時的事。'] },
  { id: 'r_memoir', n: '寫回憶錄', ico: '📔', k: 'art', a: [65, 100], fx: { cr: 1, md: 2 }, skill: 'write', sn: 'home', t: ['你把年輕時的故事寫了下來。'] },
  { id: 'r_tv', n: '在家看電視', ico: '📺', k: 'leisure', a: [55, 100], stt: ['retired'], fx: { st: -4, md: 1 }, sn: 'home', t: ['你看了一整天的八點檔。', '你在家看棒球轉播，看得好激動。'] }
];

/* ============================================================
 * 事件庫 · 嬰兒期（0–3 歲）
 * 規則書：這個階段玩家掌控度為「無」，所以全部是自動事件（沒有選項）。
 *
 * ── 事件格式說明（所有事件檔通用）──
 * id    唯一代號
 * a     年齡範圍 [最小, 最大)，單位「歲」，可用小數（0.5 = 6 個月）
 * k     類別：d 日常（預設）、o 機會、x 挑戰、f 命運
 * w     權重（預設 1），越大越常出現
 * once  一生只出現一次；cd 冷卻月數（預設 24 個月）
 * g     性別限定 'M'/'F'；sc 學校階段限定；wl 家境範圍 [1–5]
 * fs    家庭結構限定：both / mom / dad / grand；mo 月份限定
 * tr    擁有某隱藏特質才會出現（出現時會揭曉特質）
 * c     自訂條件函式 (S, H) => true/false
 * t     事件文字（可以是陣列，隨機挑一句）；r 結果文字
 * fx    效果：hp 健康 iq 智力 ch 魅力 md 情緒 ft 體能 cr 創造力
 *       st 壓力 $ 存款（2026 年幣值）gr 成績 rel 人際 tag 人生標籤 …
 * ch    選項陣列：{ t 文字, fx 效果, r 結果, chk [屬性, 難度], ok 成功, no 失敗 }
 * 文字中可用：{name} {parent} {parents} {mom} {dad} {grand} {sib}
 *            {friend} {bff} {newfriend} {crush} {newcrush} {pet} {school} {city} {wage}
 * ============================================================ */
LG.addEvents([
  // ── 成長里程碑 ──
  { id: 'inf_moon', a: [0, 0.1], once: 1, t: '滿月了！{parents}準備了油飯和紅蛋，分送給親朋好友。', fx: { md: 1 } },
  { id: 'inf_smile', a: [0.08, 0.4], once: 1, imp: 1, t: '你第一次對著{parent}咧嘴笑了，{parent}開心得拍了幾十張照片。', fx: { md: 2, rel: { parent: 3 } } },
  { id: 'inf_shuixian', a: [0.3, 0.5], once: 1, t: '滿四個月，家人幫你「收涎」，掛著一串餅乾到親戚家，讓大家幫你擦口水。', fx: { ch: 1, md: 1 } },
  { id: 'inf_turn', a: [0.25, 0.6], once: 1, t: '你憋紅了臉，終於自己翻過身來！', fx: { ft: 2 } },
  { id: 'inf_sit', a: [0.45, 0.8], once: 1, t: '你可以自己坐穩了，坐在地墊上東張西望。', fx: { ft: 1 } },
  { id: 'inf_crawl', a: [0.55, 1.0], once: 1, t: '你開始滿地爬，家裡所有插座都被貼上了保護蓋。', fx: { ft: 2, cr: 1 } },
  { id: 'inf_tooth', a: [0.45, 1.0], once: 1, t: '你長出第一顆小乳牙，這幾天口水流不停，什麼都想咬。', fx: { md: -2 } },
  { id: 'inf_stand', a: [0.75, 1.2], once: 1, t: '你扶著沙發，搖搖晃晃站了起來。', fx: { ft: 2 } },
  { id: 'inf_walk', a: [0.9, 1.6], once: 1, imp: 1, t: '你放開{parent}的手，一步、兩步、三步……走路了！', fx: { ft: 3, md: 2 } },
  { id: 'inf_word', a: [0.8, 1.6], once: 1, imp: 1, t: '你第一次清楚地叫出「{parent}」，{parent}感動到眼眶泛紅。', fx: { iq: 2, rel: { parent: 5 } } },
  { id: 'inf_word_early', a: [0.6, 1.0], once: 1, tr: '語言天賦', t: '你才不到一歲，就會說「抱抱」「水水」，親戚都說你好聰明。', fx: { iq: 3 } },
  { id: 'inf_sentence', a: [1.6, 2.6], once: 1, t: '你說出了第一句完整的話：「我要吃餅乾。」', fx: { iq: 2 } },
  { id: 'inf_run', a: [1.5, 2.5], once: 1, t: '你學會跑步了，一溜煙就跑得不見人影。', fx: { ft: 2 } },
  { id: 'inf_spoon', a: [1.0, 2.0], once: 1, t: '你堅持要自己拿湯匙吃飯，結果吃得滿臉都是。', fx: { ft: 1, md: 1 } },
  { id: 'inf_potty', a: [2.0, 3.0], once: 1, t: '你成功戒掉尿布了，{parents}鬆了一口氣。', fx: { md: 1, rel: { parents: 2 } } },
  { id: 'inf_sleep_night', a: [0.3, 1.0], once: 1, t: '你終於一覺睡到天亮，{parents}也終於睡了個好覺。', fx: { md: 2, rel: { parents: 3 } } },
  { id: 'inf_food_first', a: [0.4, 0.8], once: 1, t: '第一次吃副食品，你把米糊吐了{parent}一身。', fx: { md: 1 } },
  { id: 'inf_mirror', a: [0.5, 1.5], once: 1, t: '你對著鏡子裡的自己笑，好像交到了新朋友。', fx: { ch: 1 } },
  { id: 'inf_name_self', a: [2.0, 3.0], once: 1, t: '有人問你叫什麼名字，你大聲回答：「{name}！」', fx: { iq: 1, ch: 1 } },

  // ── 健康 ──
  { id: 'inf_vaccine', a: [0, 2], cd: 4, t: ['今天去打預防針，你哭得整間診所都聽得到。', '打完預防針，你委屈地趴在{parent}肩上睡著了。'], fx: { hp: 1, md: -2 } },
  { id: 'inf_checkup', a: [0, 3], cd: 6, t: ['健兒門診量身高體重，醫生說你長得很好。', '定期健康檢查，一切正常，{parent}放心了。'], fx: { hp: 1 } },
  { id: 'inf_fever', a: [0.3, 3], k: 'x', cd: 8, sick: 1, t: '你半夜發燒到 38.5 度，{parents}輪流照顧你到天亮。', fx: { hp: -5, rel: { parents: 2 } } },
  { id: 'inf_cold', a: [0.2, 3], k: 'x', cd: 6, sick: 1, t: ['你感冒了，鼻塞鼻涕流不停，晚上睡不好。', '天氣變冷，你咳嗽了好幾天。'], fx: { hp: -3, md: -1 } },
  { id: 'inf_entero', a: [0.5, 3], k: 'x', cd: 18, sick: 1, t: '你得了腸病毒，嘴巴裡長小水泡，吃什麼都痛，瘦了一圈。', fx: { hp: -8, md: -4, rel: { parents: 2 } } },
  { id: 'inf_rash', a: [0, 1.5], k: 'x', cd: 10, t: '你長了尿布疹，紅通通的，一碰就哭。', fx: { hp: -1, md: -2 } },
  { id: 'inf_teeth_pain', a: [0.5, 2.2], k: 'x', cd: 6, t: '又在長牙了，你整天哼哼唧唧，誰抱都不舒服。', fx: { md: -2 } },
  { id: 'inf_fall', a: [0.8, 3], k: 'x', cd: 12, t: '你從沙發上滾下來，額頭腫了一個包，{parent}心疼得不得了。', fx: { hp: -3, md: -3 } },
  { id: 'inf_cry_night', a: [0, 1.5], k: 'x', cd: 5, t: ['你半夜哭個不停，怎麼哄都沒用。', '這週你夜奶頻繁，全家人都睡眠不足。'], fx: { md: -1, rel: { parents: -1 } } },
  { id: 'inf_allergy', a: [0.5, 3], k: 'x', tr: '過敏體質', sick: 1, t: '你對牛奶過敏，皮膚起了紅疹，換了好幾種奶粉才找到適合的。', fx: { hp: -3 } },
  { id: 'inf_mosquito', a: [0.3, 3], k: 'x', cd: 8, mo: [5, 6, 7, 8, 9], t: '你被蚊子叮了好幾個大包，癢得一直抓。', fx: { md: -1 } },

  // ── 日常 ──
  { id: 'inf_bath', a: [0, 1.5], cd: 5, t: ['洗澡時你拍水拍得好開心，把{parent}潑得一身濕。', '你最喜歡洗澡時的小鴨子玩具。'], fx: { md: 2 } },
  { id: 'inf_park', a: [0.5, 3], cd: 4, t: ['{parent}推著嬰兒車帶你去公園，你盯著鴿子看了好久。', '傍晚在公園散步，你朝每個路過的人揮手。'], fx: { md: 2, cr: 1 } },
  { id: 'inf_peekaboo', a: [0.3, 1.5], cd: 6, t: '跟{parent}玩躲貓貓，你笑到打嗝。', fx: { md: 2, rel: { parent: 2 } } },
  { id: 'inf_blocks', a: [1, 3], cd: 6, t: ['你疊積木疊到第五層，然後自己一把推倒，哈哈大笑。', '你把形狀積木一個一個塞進對的洞裡。'], fx: { iq: 1, cr: 1 } },
  { id: 'inf_book', a: [0.5, 3], cd: 4, t: ['睡前{parent}唸繪本給你聽，你指著圖片咿咿呀呀。', '你最喜歡那本《好餓的小動物》，每天都要聽一遍。', '{parent}唸故事唸到一半，你已經睡著了。'], fx: { iq: 1, rel: { parent: 1 } } },
  { id: 'inf_music', a: [0, 3], cd: 5, t: ['一聽到音樂，你就開始跟著扭來扭去。', '你聽著兒歌，手舞足蹈。'], fx: { cr: 1, md: 1 } },
  { id: 'inf_bubble', a: [1, 3], cd: 6, t: '{parent}吹泡泡，你追著泡泡滿屋子跑。', fx: { md: 2, ft: 1 } },
  { id: 'inf_picky', a: [1, 3], cd: 6, t: ['你把紅蘿蔔一顆一顆挑出來，排在碗邊。', '今天的青菜你一口都不肯吃。'], fx: { hp: -1 } },
  { id: 'inf_relatives', a: [0, 3], k: 'o', cd: 6, t: ['親戚來家裡，大家輪流抱你、逗你笑。', '過節時親戚聚在一起，每個人都說你長得像{parent}。'], fx: { ch: 1, md: 1 } },
  { id: 'inf_grand_visit', a: [0, 3], cd: 4, t: ['去{grand}家玩，{grand}煮了一大桌菜，一直餵你吃。', '{grand}抱著你，用台語唱著古早的童謠。'], fx: { md: 2, rel: { grand: 3 } } },
  { id: 'inf_sib_play', a: [0.4, 3], cd: 4, t: ['{sib}拿著玩具逗你，你咯咯笑個不停。', '{sib}很喜歡摸摸你的頭，說你是家裡的小寶貝。'], fx: { md: 1, rel: { sib: 3 } } },
  { id: 'inf_sib_jealous', a: [0, 2], k: 'x', cd: 12, t: '{sib}有點吃醋，覺得大家都只顧著你，鬧了好幾天脾氣。', fx: { rel: { sib: -2 } } },
  { id: 'inf_cartoon', a: [1.5, 3], cd: 6, t: '你看卡通看得入迷，學會了一首兒歌。', fx: { iq: 1, cr: 1 } },
  { id: 'inf_wall_draw', a: [1.5, 3], cd: 12, t: '你拿蠟筆在白牆上畫了一大幅「作品」，{parents}看了哭笑不得。', fx: { cr: 2, rel: { parents: -1 } } },
  { id: 'inf_dog_fear', a: [1, 3], k: 'x', cd: 18, t: '路上一隻大狗突然吠了一聲，你嚇得大哭。', fx: { md: -2 } },
  { id: 'inf_rain', a: [0.5, 3], cd: 8, t: '下雨天，你趴在窗邊看雨滴滑下玻璃。', fx: { cr: 1 } },
  { id: 'inf_temple', a: [0.5, 3], k: 'o', cd: 18, t: '家人帶你去廟裡拜拜，幫你求了一個平安符掛在身上。', fx: { hp: 1, md: 1 } },
  { id: 'inf_market', a: [0.5, 3], k: 'o', cd: 6, t: ['{parent}帶你逛菜市場，水果攤阿姨送你一顆橘子。', '在菜市場，你好奇地盯著活跳跳的魚。'], fx: { ch: 1, md: 1 } },
  { id: 'inf_photo', a: [0, 1], k: 'o', once: 1, wl: [3, 5], t: '{parents}帶你去拍了一組寶寶寫真，你穿著小兔裝笑得好可愛。', fx: { ch: 1 } },
  { id: 'inf_nursery', a: [0.5, 2], k: 'x', once: 1, wl: [1, 4], fs: ['both', 'mom', 'dad'], t: '{parents}要上班，你被送去托嬰中心。第一週你天天哭，後來慢慢習慣了。', fx: { md: -4, ch: 2 } },
  { id: 'inf_nanny', a: [0.3, 2], once: 1, wl: [4, 5], fs: ['both'], t: '家裡請了保母阿姨照顧你，她很會說故事。', fx: { iq: 1, md: 1 } },
  { id: 'inf_grandcare', a: [0.2, 2], once: 1, fs: ['grand'], t: '爸媽在外地工作，阿公阿嬤每天背著你在巷子裡散步。', fx: { rel: { grand: 3 }, md: 1 } },
  { id: 'inf_parents_fight', a: [0, 3], k: 'x', cd: 12, fs: ['both'], t: '爸媽為了誰該半夜起來泡奶吵了一架，你在旁邊被嚇哭了。', fx: { md: -2 } },
  { id: 'inf_dad_play', a: [0.5, 3], cd: 6, fs: ['both', 'dad'], t: ['爸爸把你舉高高，你笑得尖叫。', '爸爸趴在地上當馬讓你騎。'], fx: { md: 2, rel: { dad: 3 } } },
  { id: 'inf_mom_sing', a: [0, 3], cd: 6, fs: ['both', 'mom'], t: ['媽媽輕輕哼著搖籃曲，你在她懷裡睡著了。', '媽媽幫你按摩小腳，你舒服地伸懶腰。'], fx: { md: 2, rel: { mom: 3 } } },
  { id: 'inf_typhoon', a: [0, 3], cd: 12, mo: [7, 8, 9], t: '颱風天，外面風雨交加，全家人窩在家裡陪你玩。', fx: { md: 1, rel: { parents: 1 } } },
  { id: 'inf_scooter', a: [1, 3], cd: 8, t: '{parent}騎機車載你去買早餐，你坐在前面興奮地看風景。', fx: { md: 2 } },
  { id: 'inf_7eleven', a: [1.5, 3], cd: 8, t: '在便利商店，你指著門口的玩具機台不肯走。', fx: { md: -1 } },
  { id: 'inf_tantrum', a: [1.5, 3], k: 'x', cd: 6, t: ['你進入「不要期」，什麼都說不要，在地上打滾。', '因為不能再看一集卡通，你大哭了一場。'], fx: { md: -2, rel: { parents: -1 } } },
  { id: 'inf_animal_book', a: [1, 3], cd: 10, t: '你學會指著圖卡說「狗狗」「貓咪」「大象」。', fx: { iq: 2 } },
  { id: 'inf_sand', a: [1.5, 3], k: 'o', cd: 10, t: '第一次去海邊，你蹲在沙灘上挖了一下午的沙。', fx: { md: 3, cr: 1 } },

  // ── 隱藏特質的小線索 ──
  { id: 'inf_tr_curious', a: [1, 3], tr: '好奇心旺盛', once: 1, t: '你什麼都想摸、什麼都要問：「這是什麼？那是什麼？」', fx: { iq: 2, cr: 2 } },
  { id: 'inf_tr_sport', a: [1, 3], tr: '天生運動神經', once: 1, t: '你一歲多就跑得飛快，爬上爬下完全不怕。', fx: { ft: 3 } },
  { id: 'inf_tr_social', a: [1.5, 3], tr: '社交達人', once: 1, t: '你見人就笑、見人就揮手，整條街的阿姨都認識你。', fx: { ch: 3 } },
  { id: 'inf_tr_shy', a: [1.5, 3], tr: '內向', once: 1, t: '陌生人一靠近，你就躲到{parent}身後，偷偷探頭看。', fx: { cr: 1 } },
  { id: 'inf_tr_owl', a: [0.5, 3], tr: '夜貓子', once: 1, t: '你晚上精神特別好，凌晨兩點還在咿咿呀呀唱歌。', fx: { rel: { parents: -1 } } },
  { id: 'inf_tr_opt', a: [1, 3], tr: '樂觀', once: 1, t: '跌倒了你也不哭，自己爬起來拍拍手，繼續玩。', fx: { md: 2 } },
  { id: 'inf_tr_anx', a: [1, 3], tr: '焦慮體質', once: 1, t: '只要{parent}一離開視線，你就緊張得大哭。', fx: { md: -2 } },
  { id: 'inf_tr_art', a: [2, 3], tr: '藝術天分', once: 1, t: '你畫的「全家福」居然有模有樣，{parents}把它貼在冰箱上。', fx: { cr: 3 } },
  { id: 'inf_tr_mature', a: [2, 3], tr: '早熟', once: 1, t: '才兩歲多，你就會主動幫忙把玩具收好。', fx: { rel: { parents: 3 } } },
  { id: 'inf_tr_math', a: [2, 3], tr: '數學腦', once: 1, t: '你很早就能從 1 數到 20，還會比較哪一堆餅乾比較多。', fx: { iq: 2 } },
  { id: 'inf_tr_soft', a: [2, 3], tr: '心軟', once: 1, t: '看到別的小朋友哭，你把自己的餅乾遞給他。', fx: { ch: 1, contrib: 1 } },
  { id: 'inf_tr_perfect', a: [2, 3], tr: '完美主義', once: 1, t: '你的積木一定要排得整整齊齊，歪一點都不行。', fx: { iq: 1 } },
  { id: 'inf_tr_nost', a: [1.5, 3], tr: '念舊', once: 1, t: '你的安撫小被被都洗到褪色了，還是不肯換新的。', fx: { md: 1 } },
  { id: 'inf_tr_adv', a: [1.5, 3], tr: '冒險性格', once: 1, t: '你偷偷爬上了餐桌，站在上面得意地揮手，嚇壞全家人。', fx: { ft: 2, hp: -1 } },
  { id: 'inf_tr_allergy2', a: [1, 3], tr: '過敏體質', once: 1, k: 'x', sick: 1, t: '你一換季就鼻子過敏，噴嚏打個不停。', fx: { hp: -2 } }
]);

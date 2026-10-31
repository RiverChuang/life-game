/* ============================================================
 * 職業卡（第一版 32 種）
 * deg  最低學歷：0 不限、1 國中、2 高中職、3 專科、4 大學、5 碩士
 * maj  限定大學科系；dept 限定高職／五專科別（兩者符合其一即可）
 * pref 相關科系（不限定，但比較容易錄取）
 * stat 主要能力（影響錄取與工作表現）；dc 錄取門檻
 * pay  2026 年起薪（元／月）；var 收入浮動程度；bonus 年終倍數
 * st   工作壓力 0–100；lv 升遷職稱；sn 工作場景；wear 工作服
 * special 只能透過特殊管道取得（考試、國考）
 * ============================================================ */
LG.JOBS = [
  // ── 服務業 ──
  { id: 'cvs', n: '便利商店店員', cat: 'service', deg: 0, stat: 'ch', dc: 28, pay: 30000, st: 45, lv: ['店員', '副店長', '店長'], sn: 'shop', wear: 'apron', co: ['小日子便利商店', '街角超商', '好鄰居便利店'], d: '輪班制，什麼都要會一點。' },
  { id: 'waiter', n: '餐廳服務生', cat: 'service', deg: 0, stat: 'ch', dc: 30, pay: 30500, st: 50, lv: ['服務生', '領班', '餐廳店長'], sn: 'cafe', wear: 'apron', co: ['巷口小館', '家常味餐廳', '暖暖食堂'], d: '忙的時候腳不沾地，但小費和員工餐很不錯。' },
  { id: 'barista', n: '咖啡師', cat: 'service', deg: 0, stat: 'cr', dc: 35, pay: 31000, st: 40, lv: ['咖啡師', '資深咖啡師', '咖啡店店長'], sn: 'cafe', wear: 'apron', co: ['日光咖啡', '午後咖啡館', '森林咖啡'], d: '每天被咖啡香包圍。' },
  { id: 'hair', n: '美髮設計師', cat: 'service', deg: 0, stat: 'cr', dc: 40, pay: 28000, var: 0.15, st: 50, lv: ['美髮助理', '美髮設計師', '首席設計師'], sn: 'shop', wear: 'apron', co: ['剪剪髮廊', '光澤髮藝', '小森髮型屋'], d: '從洗頭助理做起，熬出頭就有自己的客人。' },
  { id: 'chef', n: '廚師', cat: 'service', deg: 0, stat: 'cr', dc: 38, pay: 33000, st: 60, lv: ['二廚', '主廚', '行政主廚'], sn: 'cafe', wear: 'chef', co: ['家常味餐廳', '饗宴酒店', '海港餐廳'], pref: [], dept: null, d: '廚房很熱，但做出好菜的成就感無可取代。' },
  { id: 'delivery', n: '外送員', cat: 'road', deg: 0, stat: 'ft', dc: 30, pay: 36000, var: 0.2, st: 55, tag: '機車駕照', lv: ['外送員', '資深外送員', '外送之王'], sn: 'street', wear: 'jacket', co: ['快送外送平台', '飛毛腿外送'], d: '時間自由，跑越多賺越多，但風吹日曬。' },
  // ── 工廠與技術 ──
  { id: 'factory', n: '工廠作業員', cat: 'factory', deg: 1, stat: 'ft', dc: 28, pay: 33500, st: 55, lv: ['作業員', '組長', '課長'], sn: 'factory', wear: 'work', suf: ['電子廠', '精密工業'], d: '輪班制，加班費不少。' },
  { id: 'driver', n: '物流司機', cat: 'road', deg: 2, stat: 'ft', dc: 38, pay: 40000, st: 55, lv: ['物流司機', '資深司機', '車隊組長'], sn: 'street', wear: 'work', suf: ['物流', '貨運'], d: '每天開著貨車跑遍大街小巷。' },
  { id: 'tech', n: '電機技術員', cat: 'factory', deg: 2, stat: 'iq', dc: 40, pay: 36000, st: 50, dept: ['電機科', '資訊科', '汽車科'], maj: ['理工資訊'], lv: ['技術員', '資深技術員', '設備工程師'], sn: 'factory', wear: 'work', suf: ['電機', '科技'], d: '負責機台維修保養。' },
  { id: 'mechanic', n: '汽車技師', cat: 'factory', deg: 2, stat: 'ft', dc: 40, pay: 34000, st: 50, dept: ['汽車科', '電機科'], lv: ['學徒技師', '技師', '保養廠廠長'], sn: 'factory', wear: 'work', suf: ['汽車保養廠', '車業'], d: '一身機油味，但修好車的那一刻最爽。' },
  // ── 辦公室 ──
  { id: 'admin', n: '行政助理', cat: 'office', deg: 2, stat: 'iq', dc: 35, pay: 32000, st: 40, lv: ['行政助理', '行政專員', '行政主任'], sn: 'office', wear: 'office', d: '朝九晚六，處理公司大小事。' },
  { id: 'cs', n: '客服人員', cat: 'office', deg: 2, stat: 'ch', dc: 35, pay: 31500, st: 55, lv: ['客服人員', '客服組長', '客服主管'], sn: 'office', wear: 'office', d: '每天接上百通電話，練出一身好脾氣。' },
  { id: 'sales', n: '業務專員', cat: 'office', deg: 2, stat: 'ch', dc: 48, pay: 33000, var: 0.3, st: 65, lv: ['業務專員', '業務主任', '業務經理'], sn: 'office', wear: 'suit', d: '底薪加獎金，業績好收入就高。' },
  { id: 'realty', n: '房仲業務', cat: 'office', deg: 2, stat: 'ch', dc: 50, pay: 30000, var: 0.5, st: 70, lv: ['房仲業務', '店長', '區經理'], sn: 'street', wear: 'suit', suf: ['房屋', '不動產'], d: '成交一間房子，抵得上好幾個月薪水。' },
  { id: 'acct', n: '會計', cat: 'office', deg: 4, stat: 'iq', dc: 45, pay: 38000, st: 55, maj: ['商業管理'], lv: ['會計專員', '資深會計', '財務主管'], sn: 'office', wear: 'office', d: '數字要一分不差。' },
  { id: 'bank', n: '銀行行員', cat: 'office', deg: 4, stat: 'ch', dc: 48, pay: 40000, bonus: 1.5, st: 55, pref: ['商業管理'], lv: ['理財專員', '襄理', '分行經理'], sn: 'office', wear: 'suit', suf: ['銀行', '商業銀行'], d: '穩定的金融業，年終通常不錯。' },
  { id: 'mkt', n: '行銷企劃', cat: 'office', deg: 4, stat: 'cr', dc: 48, pay: 38000, st: 55, pref: ['商業管理', '藝術設計', '人文法政'], lv: ['行銷專員', '行銷企劃', '行銷經理'], sn: 'office', wear: 'office', d: '想點子、寫企劃、辦活動。' },
  { id: 'social', n: '社工', cat: 'office', deg: 4, stat: 'ch', dc: 42, pay: 37000, st: 70, maj: ['人文法政', '教育'], lv: ['社工員', '資深社工', '社工督導'], sn: 'office', wear: 'office', d: '陪伴需要幫助的家庭，辛苦但有意義。' },
  // ── 科技 ──
  { id: 'swe', n: '軟體工程師', cat: 'tech', deg: 4, stat: 'iq', dc: 55, pay: 50000, bonus: 1.5, st: 65, pref: ['理工資訊'], need: (S) => (S.path && S.path.major === '理工資訊') || S.tags.includes('會寫程式') || S.tags.includes('程式社'), lv: ['軟體工程師', '資深工程師', '技術主管'], sn: 'office', wear: 'casual', suf: ['軟體', '數位科技'], d: '寫程式、修 bug、開不完的會。' },
  { id: 'semi', n: '半導體工程師', cat: 'tech', deg: 4, stat: 'iq', dc: 58, pay: 58000, bonus: 2.5, st: 75, maj: ['理工資訊'], lv: ['製程工程師', '資深工程師', '主任工程師', '部門經理'], sn: 'factory', wear: 'cleanroom', suf: ['半導體', '晶圓'], d: '高薪高壓，分紅讓人心動。' },
  { id: 'research', n: '研究助理', cat: 'tech', deg: 5, stat: 'iq', dc: 52, pay: 42000, st: 50, lv: ['研究助理', '研究員', '副研究員'], sn: 'office', wear: 'casual', suf: ['研究中心', '研究院'], d: '在實驗室裡追求新發現。' },
  // ── 醫療 ──
  { id: 'nurse', n: '護理師', cat: 'medical', deg: 3, stat: 'iq', dc: 42, pay: 45000, st: 75, dept: ['護理科'], maj: ['醫藥衛生'], lv: ['護理師', '資深護理師', '護理長'], sn: 'hospital', wear: 'scrubs', suf: ['綜合醫院', '紀念醫院'], d: '三班輪值，是病人最依賴的人。' },
  { id: 'pharm', n: '藥師', cat: 'medical', deg: 4, stat: 'iq', dc: 52, pay: 55000, st: 55, maj: ['醫藥衛生'], lv: ['藥師', '資深藥師', '藥局主任'], sn: 'hospital', wear: 'coat', suf: ['綜合醫院', '藥局'], d: '需要藥師執照，薪水穩定。' },
  { id: 'doctor', n: '醫師', cat: 'medical', deg: 4, stat: 'iq', dc: 60, pay: 85000, st: 85, special: true, lv: ['PGY 醫師', '住院醫師', '總醫師', '主治醫師'], sn: 'hospital', wear: 'coat', suf: ['紀念醫院', '綜合醫院', '大學附設醫院'], d: '救人的工作，值班到天亮是日常。' },
  // ── 教育 ──
  { id: 'teacher', n: '國小老師', cat: 'teach', deg: 4, stat: 'ch', dc: 50, pay: 46000, bonus: 1.5, st: 55, maj: ['教育'], lv: ['代理老師', '正式老師', '學校主任'], sn: 'classroom', wear: 'teacher', suf: ['國小'], d: '需要通過教師甄試，每天和一群孩子相處。' },
  { id: 'tutor', n: '補習班老師', cat: 'teach', deg: 4, stat: 'iq', dc: 48, pay: 38000, var: 0.15, st: 55, lv: ['補習班老師', '人氣名師', '補習班主任'], sn: 'classroom', wear: 'casual', suf: ['補習班', '文理補習班'], d: '晚上和週末上課，學生考好最開心。' },
  // ── 創意 ──
  { id: 'design', n: '平面設計師', cat: 'creative', deg: 3, stat: 'cr', dc: 52, pay: 34000, st: 55, maj: ['藝術設計'], dept: ['廣告設計科'], lv: ['設計師', '資深設計師', '設計總監'], sn: 'office', wear: 'casual', suf: ['設計工作室', '創意'], d: '把想法變成畫面，常常改稿到半夜。' },
  { id: 'creator', n: '自媒體創作者', cat: 'creative', deg: 0, stat: 'cr', dc: 62, pay: 26000, var: 0.6, st: 50, need: (S) => S.tags.includes('小有名氣') || S.st.cr >= 68, lv: ['新手創作者', '人氣創作者', '百萬創作者'], sn: 'home', wear: 'casual', co: ['自己的頻道'], d: '收入不穩，但做的是自己喜歡的事。' },
  // ── 專業與公職 ──
  { id: 'lawyer', n: '律師', cat: 'pro', deg: 4, stat: 'iq', dc: 66, pay: 60000, st: 80, maj: ['人文法政'], lv: ['受雇律師', '資深律師', '合夥律師'], sn: 'office', wear: 'suit', suf: ['法律事務所'], d: '需要通過律師高考，替當事人爭取權益。' },
  { id: 'soldier', n: '志願役軍人', cat: 'army', deg: 2, stat: 'ft', dc: 48, pay: 45000, st: 65, need: (S) => S.mil.st === 'done' || (S.gender === 'F' && S.st.ft >= 50), lv: ['下士', '中士', '上士'], sn: 'army', wear: 'army', co: ['國軍'], d: '薪水穩定、福利好，紀律也很嚴格。' },
  { id: 'civil', n: '公務員（高考）', cat: 'public', deg: 4, stat: 'iq', dc: 50, pay: 50000, st: 45, special: true, lv: ['科員', '專員', '科長'], sn: 'office', wear: 'office', co: ['市政府', '區公所', '國稅局', '戶政事務所'], d: '鐵飯碗，穩定是最大的福利。' },
  { id: 'civil2', n: '公務員（普考）', cat: 'public', deg: 2, stat: 'iq', dc: 45, pay: 42000, st: 40, special: true, lv: ['書記', '科員', '專員'], sn: 'office', wear: 'office', co: ['區公所', '戶政事務所', '地政事務所'], d: '準時上下班，生活很規律。' },
  { id: 'owner', n: '自營店老闆', cat: 'service', deg: 0, stat: 'ch', dc: 50, pay: 40000, var: 0.35, st: 65, special: true, lv: ['老闆', '連鎖店老闆', '企業家'], sn: 'cafe', wear: 'apron', co: ['自己的小店'], d: '自己當老闆，收入看生意好壞。' }
];

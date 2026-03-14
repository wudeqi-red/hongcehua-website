/* ============================================================
   红策划 - 全局数据层（LocalStorage 持久化）
   ============================================================ */

// ---------- 默认博主数据 ----------
const DEFAULT_BLOGGERS = [
  { id:1, name:'美食探店阿花',  platform:'小红书', category:'美食探店', fans:'128w',  likes:'360w',  region:'上海', tags:['探店','美食','网红打卡'], link:'#', status:'active', fansNum:1280000 },
  { id:2, name:'时尚辣妈Lisa',  platform:'抖音',   category:'美妆时尚', fans:'89w',   likes:'210w',  region:'北京', tags:['时尚','穿搭','美妆'],   link:'#', status:'active', fansNum:890000  },
  { id:3, name:'旅行达人小宇',  platform:'微博',   category:'旅游出行', fans:'56w',   likes:'98w',   region:'成都', tags:['旅游','探索','vlog'],   link:'#', status:'active', fansNum:560000  },
  { id:4, name:'萌娃日记佳佳',  platform:'小红书', category:'亲子母婴', fans:'42w',   likes:'130w',  region:'杭州', tags:['亲子','育儿','母婴'],   link:'#', status:'active', fansNum:420000  },
  { id:5, name:'健身教练阿威',  platform:'抖音',   category:'运动健身', fans:'33w',   likes:'88w',   region:'广州', tags:['健身','减脂','运动'],   link:'#', status:'active', fansNum:330000  },
  { id:6, name:'生活记录仔阿杰',platform:'B站',    category:'娱乐生活', fans:'21w',   likes:'55w',   region:'深圳', tags:['生活','vlog','日常'],   link:'#', status:'active', fansNum:210000  },
  { id:7, name:'数码测评Tommy', platform:'B站',    category:'数码科技', fans:'76w',   likes:'180w',  region:'北京', tags:['数码','测评','科技'],   link:'#', status:'active', fansNum:760000  },
  { id:8, name:'家装设计晓敏',  platform:'小红书', category:'家居家装', fans:'38w',   likes:'92w',   region:'南京', tags:['家装','设计','软装'],   link:'#', status:'active', fansNum:380000  },
  { id:9, name:'夜市探店大胃王',platform:'抖音',   category:'美食探店', fans:'203w',  likes:'520w',  region:'重庆', tags:['美食','夜市','探店'],   link:'#', status:'active', fansNum:2030000 },
  { id:10,name:'美妆博主小糖',  platform:'小红书', category:'美妆时尚', fans:'15w',   likes:'44w',   region:'西安', tags:['美妆','护肤','平价好物'],link:'#', status:'active', fansNum:150000  },
  { id:11,name:'亲子游玩记',    platform:'微博',   category:'亲子母婴', fans:'8.6w',  likes:'22w',   region:'武汉', tags:['亲子','遛娃','周末'],   link:'#', status:'pending', fansNum:86000   },
  { id:12,name:'健康饮食Ana',   platform:'小红书', category:'运动健身', fans:'5.2w',  likes:'18w',   region:'上海', tags:['健康','轻食','减肥'],   link:'#', status:'active', fansNum:52000   },
  { id:13,name:'潮流穿搭Kai',   platform:'抖音',   category:'美妆时尚', fans:'312w',  likes:'890w',  region:'上海', tags:['穿搭','潮流','街拍'],   link:'#', status:'active', fansNum:3120000 },
  { id:14,name:'探店夜猫子',    platform:'小红书', category:'美食探店', fans:'18w',   likes:'48w',   region:'广州', tags:['夜宵','探店','隐藏好店'],link:'#', status:'active', fansNum:180000  },
  { id:15,name:'家居改造王',    platform:'抖音',   category:'家居家装', fans:'45w',   likes:'110w',  region:'成都', tags:['改造','家居','DIY'],    link:'#', status:'active', fansNum:450000  },
  { id:16,name:'游戏达人小飞',  platform:'B站',    category:'娱乐生活', fans:'67w',   likes:'200w',  region:'北京', tags:['游戏','娱乐','搞笑'],   link:'#', status:'active', fansNum:670000  },
  { id:17,name:'旅游博主菲菲',  platform:'小红书', category:'旅游出行', fans:'29w',   likes:'75w',   region:'杭州', tags:['旅行','攻略','Citywalk'],link:'#', status:'pending', fansNum:290000  },
  { id:18,name:'科技数码Z',     platform:'微博',   category:'数码科技', fans:'41w',   likes:'88w',   region:'深圳', tags:['科技','手机','评测'],   link:'#', status:'active', fansNum:410000  },
  { id:19,name:'萌宠日记嗯嗯',  platform:'抖音',   category:'娱乐生活', fans:'92w',   likes:'240w',  region:'南京', tags:['宠物','萌宠','猫猫'],   link:'#', status:'active', fansNum:920000  },
  { id:20,name:'美食图鉴阿成',  platform:'微信',   category:'美食探店', fans:'3.8w',  likes:'12w',   region:'重庆', tags:['美食','探店','本地'],   link:'#', status:'active', fansNum:38000   },
  { id:21,name:'瑜伽达人Kelly', platform:'小红书', category:'运动健身', fans:'22w',   likes:'60w',   region:'成都', tags:['瑜伽','健身','正念'],   link:'#', status:'active', fansNum:220000  },
  { id:22,name:'软装搭配师',    platform:'小红书', category:'家居家装', fans:'14w',   likes:'40w',   region:'上海', tags:['软装','家居','北欧风'],  link:'#', status:'active', fansNum:140000  },
  { id:23,name:'吃货大作战',    platform:'抖音',   category:'美食探店', fans:'158w',  likes:'430w',  region:'北京', tags:['美食','吃播','探店'],   link:'#', status:'active', fansNum:1580000 },
  { id:24,name:'母婴好物分享',  platform:'小红书', category:'亲子母婴', fans:'9.5w',  likes:'28w',   region:'广州', tags:['母婴','好物','推荐'],   link:'#', status:'pending', fansNum:95000   },
];

// ---------- 默认案例数据 ----------
const DEFAULT_CASES = [
  { id:1,  title:'某连锁火锅品牌开业推广',  type:'开业营销', industry:'餐饮美食', desc:'整合20位本地美食博主，联合抖音、小红书双平台发力，开业3天排队超500桌，成功打造爆款门店。', exposure:'800w+', interaction:'15w+', conversion:'3天排队500桌', emoji:'🍲', gradient:'linear-gradient(135deg,#f093fb,#f5576c)', hot:true  },
  { id:2,  title:'某连锁美容院品牌升级策划', type:'品牌策划', industry:'美容美业', desc:'全案策划，从品牌视觉重塑到线上口碑建设，历时3个月完成品牌焕新，复购率提升40%。',           exposure:'300w+', interaction:'8w+',  conversion:'复购率+40%',  emoji:'💆', gradient:'linear-gradient(135deg,#4facfe,#00f2fe)', hot:false },
  { id:3,  title:'本地零售集合店达人种草',   type:'达人合作', industry:'零售购物', desc:'联合15位生活方式博主进行产品种草，配合直播带货，月销售额提升200%，品牌知名度显著提升。',  exposure:'500w+', interaction:'12w+', conversion:'月销售额+200%',emoji:'🛍️', gradient:'linear-gradient(135deg,#43e97b,#38f9d7)', hot:false },
  { id:4,  title:'亲子乐园暑期活动推广',     type:'节日活动', industry:'亲子教育', desc:'暑假期间联合10位亲子博主，打造家庭出游爆款内容，活动期间日均到场人次翻3倍。',           exposure:'420w+', interaction:'9w+',  conversion:'日均人次×3',  emoji:'🎠', gradient:'linear-gradient(135deg,#fa709a,#fee140)', hot:false },
  { id:5,  title:'健身房新店开业整合营销',   type:'开业营销', industry:'健康健身', desc:'线上线下联动，达人打卡+优惠券裂变，开业首月会员突破800人，超预期目标150%。',            exposure:'180w+', interaction:'5w+',  conversion:'首月会员800+',emoji:'🏋️', gradient:'linear-gradient(135deg,#a1c4fd,#c2e9fb)', hot:false },
  { id:6,  title:'餐饮品牌节日限定营销',     type:'节日活动', industry:'餐饮美食', desc:'七夕情人节限定套餐推广，联合20位情侣博主打卡，预订量提前3周售罄。',                      exposure:'260w+', interaction:'7w+',  conversion:'预订提前售罄', emoji:'🍽️', gradient:'linear-gradient(135deg,#f6d365,#fda085)', hot:false },
  { id:7,  title:'本地酒吧夜生活品牌策划',   type:'品牌策划', industry:'休闲娱乐', desc:'针对年轻人夜经济，策划系列主题夜活动，结合短视频传播，品牌搜索量增长500%。',            exposure:'350w+', interaction:'11w+', conversion:'搜索量+500%', emoji:'🍸', gradient:'linear-gradient(135deg,#5f27cd,#a29bfe)', hot:true  },
  { id:8,  title:'母婴品牌小红书种草计划',   type:'达人合作', industry:'亲子教育', desc:'精选50位母婴垂类博主，持续3个月内容种草，品牌搜索排名从行业第15升至第3。',              exposure:'600w+', interaction:'18w+', conversion:'行业排名Top3', emoji:'👶', gradient:'linear-gradient(135deg,#fccb90,#d57eeb)', hot:false },
  { id:9,  title:'连锁咖啡新品上市推广',     type:'探店推广', industry:'餐饮美食', desc:'30位咖啡探店博主同步发布，新品上线首周售出10万杯，社交媒体话题自然流量爆发。',          exposure:'720w+', interaction:'22w+', conversion:'首周售出10w杯',emoji:'☕', gradient:'linear-gradient(135deg,#6a3093,#a044ff)', hot:true  },
  { id:10, title:'家居品牌抖音直播带货',      type:'直播带货', industry:'零售购物', desc:'联合3位头部家居博主进行专场直播，单场直播GMV突破50万，品牌抖音粉丝增加8万。',          exposure:'200w+', interaction:'6w+',  conversion:'单场GMV 50万', emoji:'🛋️', gradient:'linear-gradient(135deg,#11998e,#38ef7d)', hot:false },
  { id:11, title:'KTV品牌年轻化营销重塑',    type:'品牌策划', industry:'休闲娱乐', desc:'重新定义KTV体验，打造沉浸式主题包房，联合娱乐博主传播，到店率提升80%。',               exposure:'290w+', interaction:'8.5w+',conversion:'到店率+80%',  emoji:'🎤', gradient:'linear-gradient(135deg,#ee0979,#ff6a00)', hot:false },
  { id:12, title:'本地超市节日促销全案',      type:'节日活动', industry:'零售购物', desc:'春节前夕整合10位本地生活博主，线上种草+门店引流，节日期间销售额同比增长120%。',        exposure:'380w+', interaction:'10w+', conversion:'节日销售+120%',emoji:'🛒', gradient:'linear-gradient(135deg,#f7971e,#ffd200)', hot:false },
];

// ---------- 默认供应商数据 ----------
const DEFAULT_SUPPLIERS = [
  { id:1,  name:'光影视觉工作室',  type:'摄影摄像', desc:'专业商业摄影团队，擅长美食、产品、人像拍摄，快速交付，10年品牌服务经验。',       tags:['商业摄影','美食拍摄','快速交付'],  rating:4.9, cooperations:86,  contact:'张经理', phone:'138xxxx0001', status:'active', emoji:'📷' },
  { id:2,  name:'橙果设计公司',    type:'视觉设计', desc:'专注品牌视觉设计，提供VI体系、海报、包装全套设计方案，服务300+品牌客户。',        tags:['VI设计','品牌设计','包装设计'],    rating:4.8, cooperations:124, contact:'李设计', phone:'138xxxx0002', status:'active', emoji:'🎨' },
  { id:3,  name:'快印坊印刷中心',  type:'印刷物料', desc:'全品类印刷物料，X展架、海报、宣传册、折页等，24小时快速印刷，价格实惠。',          tags:['快速印刷','物料制作','价格实惠'],  rating:4.6, cooperations:201, contact:'王老板', phone:'138xxxx0003', status:'active', emoji:'🖨️' },
  { id:4,  name:'盛典活动公司',    type:'活动执行', desc:'专业活动策划执行团队，开业典礼、发布会、主题活动全承接，200+成功活动案例。',       tags:['活动策划','开业执行','主题活动'],  rating:4.7, cooperations:67,  contact:'陈总监', phone:'138xxxx0004', status:'active', emoji:'🎪' },
  { id:5,  name:'映画视频制作',    type:'视频制作', desc:'短视频、TVC广告、宣传片制作，专业导演+剪辑团队，创意脚本+拍摄+后期一站式服务。',   tags:['短视频','TVC','宣传片制作'],      rating:4.9, cooperations:55,  contact:'刘导演', phone:'138xxxx0005', status:'active', emoji:'🎬' },
  { id:6,  name:'数启营销科技',    type:'数字营销', desc:'专业数据分析与投放优化，SEM/信息流广告托管，ROI提升30%以上，服务100+品牌。',     tags:['数据分析','信息流投放','ROI优化'], rating:4.7, cooperations:93,  contact:'赵总', phone:'138xxxx0006', status:'active', emoji:'📊' },
  { id:7,  name:'晨光摄影工坊',    type:'摄影摄像', desc:'网红探店专属摄影服务，擅长场景氛围感营造，多次与头部博主合作，出片率极高。',       tags:['探店摄影','氛围感','博主合作'],    rating:4.8, cooperations:143, contact:'周摄影', phone:'138xxxx0007', status:'active', emoji:'📸' },
  { id:8,  name:'新锐插画设计',    type:'视觉设计', desc:'年轻化创意设计，擅长插画风、国潮风视觉，深受餐饮、美妆类客户青睐。',              tags:['插画设计','国潮风','创意视觉'],    rating:4.6, cooperations:38,  contact:'林设计师',phone:'138xxxx0008', status:'active', emoji:'✏️' },
  { id:9,  name:'铭远礼品定制',    type:'印刷物料', desc:'礼品袋、定制文创、伴手礼等周边物料定制，最低起订量50件，支持个性化设计。',         tags:['礼品定制','文创周边','伴手礼'],    rating:4.5, cooperations:76,  contact:'吴店长', phone:'138xxxx0009', status:'active', emoji:'🎁' },
  { id:10, name:'聚创互动传媒',    type:'活动执行', desc:'擅长年轻化互动活动，快闪店、快闪活动、社群运营，为品牌创造话题与流量。',           tags:['快闪店','互动活动','社群运营'],    rating:4.8, cooperations:49,  contact:'孙总监', phone:'138xxxx0010', status:'active', emoji:'⚡' },
  { id:11, name:'帧刻短视频',      type:'视频制作', desc:'专注本地探店类短视频制作，熟悉小红书/抖音平台规则，单条最高播放量500w+。',         tags:['探店视频','小红书','抖音爆款'],    rating:4.9, cooperations:88,  contact:'郑导', phone:'138xxxx0011', status:'active', emoji:'🎥' },
  { id:12, name:'星图数据营销',    type:'数字营销', desc:'KOL投放策略、效果监测、舆情监控，帮助品牌精准触达目标人群，降低30%获客成本。',     tags:['KOL策略','效果监测','舆情监控'],  rating:4.6, cooperations:61,  contact:'冯经理', phone:'138xxxx0012', status:'pending', emoji:'⭐' },
];

// ---------- 默认询盘数据 ----------
const DEFAULT_INQUIRIES = [
  { id:1, name:'张老板',  phone:'138xxxx1001', brand:'好味道火锅',  service:'探店推广',   status:'pending', time:'2024-12-01 10:23' },
  { id:2, name:'李女士',  phone:'139xxxx2002', brand:'美美美妆',    service:'博主资源合作',status:'done',    time:'2024-11-30 15:44' },
  { id:3, name:'王总',    phone:'137xxxx3003', brand:'星空KTV',     service:'全案合作',   status:'pending', time:'2024-11-30 09:12' },
  { id:4, name:'陈经理',  phone:'136xxxx4004', brand:'乐童亲子乐园',service:'品牌策划',   status:'done',    time:'2024-11-29 14:30' },
  { id:5, name:'刘小姐',  phone:'135xxxx5005', brand:'健身房Pro',   service:'开业推广',   status:'pending', time:'2024-11-29 11:05' },
];

/* ============================================================
   数据访问层 - 统一通过 DB 对象读写 LocalStorage
   ============================================================ */
const DB = {
  _key: (type) => `hc_${type}`,

  get(type) {
    try {
      const raw = localStorage.getItem(this._key(type));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(type, data) {
    try { localStorage.setItem(this._key(type), JSON.stringify(data)); } catch(e) { console.warn(e); }
  },

  load(type, defaults) {
    const d = this.get(type);
    if (!d) { this.set(type, defaults); return [...defaults]; }
    return d;
  },

  // 获取各类数据（若 LS 无数据则写入默认值）
  getBloggers()   { return this.load('bloggers',   DEFAULT_BLOGGERS);   },
  getCases()      { return this.load('cases',      DEFAULT_CASES);      },
  getSuppliers()  { return this.load('suppliers',  DEFAULT_SUPPLIERS);  },
  getInquiries()  { return this.load('inquiries',  DEFAULT_INQUIRIES);  },

  saveBloggers(d)  { this.set('bloggers',  d); },
  saveCases(d)     { this.set('cases',     d); },
  saveSuppliers(d) { this.set('suppliers', d); },
  saveInquiries(d) { this.set('inquiries', d); },

  nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; },
};

/* ============================================================
   通用工具
   ============================================================ */
function avatarColor(str) {
  const colors = [
    'linear-gradient(135deg,#ff6b6b,#feca57)',
    'linear-gradient(135deg,#a29bfe,#6c5ce7)',
    'linear-gradient(135deg,#55efc4,#00b894)',
    'linear-gradient(135deg,#fd79a8,#e84393)',
    'linear-gradient(135deg,#fdcb6e,#e17055)',
    'linear-gradient(135deg,#74b9ff,#0984e3)',
    'linear-gradient(135deg,#fab1a0,#e17055)',
    'linear-gradient(135deg,#81ecec,#00cec9)',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function platformIcon(p) {
  const m = { '小红书':'🌸', '抖音':'🎵', '微博':'🔴', 'B站':'📺', '微信':'💬' };
  return m[p] || '📱';
}

function fansLevelLabel(num) {
  if (num >= 1000000) return '头部';
  if (num >= 100000)  return '腰部';
  if (num >= 10000)   return '微达人';
  return '素人';
}

function showToast(msg = '操作成功！', success = true) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastMsg').textContent = msg;
  t.style.borderColor = success ? 'rgba(67,233,123,0.3)' : 'rgba(255,71,87,0.3)';
  t.style.color = success ? '#43e97b' : '#ff4757';
  t.querySelector('span').textContent = success ? '✅' : '❌';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

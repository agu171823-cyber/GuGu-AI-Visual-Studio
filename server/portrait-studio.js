"use strict";

const VERSION = "1.1.0";

const BASE_IDENTITY = [
  "参考图只用于锁定同一个成年人的身份，保持脸型宽高比、关键五官、年龄感与肤色基调",
  "第一张图片拥有最高身份优先级；后续图片只补充侧脸、发型和可辨识配饰，不得混合成另一张脸",
  "允许改变表情、姿势、服装和背景，但人物必须一眼可辨认并保留自然皮肤纹理"
];

const BASE_OUTPUT = [
  "生成一张独立完整的成年人艺术写真，不做拼图，不添加文字、水印、Logo 或二维码",
  "画面中只出现同一个主要人物，不复制人物，不生成前后对比拼图"
];

const BASE_SAFETY = [
  "仅表现已获授权的成年人，保持得体、尊重和非色情表达",
  "不得制造羞辱、骚扰、私密、虚假代言、证件、新闻现场或其他欺骗性事实情境"
];

const FAILURE_CHECKLIST = [
  "避免身份漂移、脸型拉窄、过度年轻化、塑料皮肤和过度磨皮",
  "避免畸形手指、肢体、眼镜、牙齿、服装结构与重复人物",
  "避免伪文字、水印、随机品牌、错误透视、主体切断和风格混杂"
];

function style(input) {
  return Object.freeze({ version: VERSION, ...input });
}

const STYLES = Object.freeze([
  style({
    id: "clear-natural-light", title: "清透自然光", family: "photo",
    summary: "明亮空气感、真实肤质和微风共同作用的清新写真。",
    tags: ["自然", "明亮", "轻风", "旅行"],
    matchRules: [
      ["mood", "natural", 5, "自然松弛与清透光线匹配"], ["mood", "fresh", 5, "适合明亮清新的目标"],
      ["intensity", "light", 4, "轻度变化更容易保留本人气质"], ["brightness", "bright", 2, "便于延续自然光方向"]
    ],
    imagingSystem: "全画幅自然光生活方式人像，50mm 真实抓拍响应，高光温和且不叠加胶片或直闪模拟",
    stylingSystem: ["自然半哑光妆面与清楚眼神，发型保留本人锚点", "服装、少量配饰与近处植物共享浅色低饱和系统"],
    captureGrammar: ["相机平视或轻微低角度，人物与环境处在同一自然光中", "微风同时作用于发丝、衣角和近处植物"],
    visualSystem: ["高明度低饱和底色，保留毛孔与细小发丝，不做影楼磨皮"],
    slots: { scene: "湖畔草地、浅色街角或通风庭院", camera: "50mm 中近景，平视轻抓拍", wardrobe: "简洁浅色日常服装，材质轻盈但得体", action: "自然站立或缓慢行走，目光放松", lighting: "柔和侧逆光与自然反射光" }
  }),
  style({
    id: "city-editorial", title: "城市街角杂志", family: "photo",
    summary: "用城市结构、留白和人物姿态建立生活方式杂志感。",
    tags: ["城市", "杂志", "生活方式", "编辑摄影"],
    matchRules: [
      ["usage", "social", 5, "适合社交分享"], ["usage", "professional", 4, "兼顾职业形象"],
      ["mood", "mature", 4, "成熟克制与城市编辑语言匹配"], ["orientation", "landscape", 2, "便于延续城市空间关系"]
    ],
    imagingSystem: "35mm 环境编辑人像，中性色彩和真实城市材质，不叠加胶片漏光或棚拍滤镜",
    stylingSystem: ["克制缎光底妆、清晰眼眉与中性唇色", "服装剪裁与建筑线条形成一个编辑关系"],
    captureGrammar: ["建筑边线、路口或橱窗构成清楚阅读路径", "保持街拍距离，不把人物贴成棚拍大头像"],
    visualSystem: ["中性城市色板、真实材质和明确负空间；画面不生成文字"],
    slots: { scene: "有建筑线条与自然人流的城市街角", camera: "35mm 环境人像，中景略带抓拍", wardrobe: "剪裁清楚的都市日常服装", action: "等待过街、回身或靠近橱窗", lighting: "晴天硬光或阴天柔光，保持环境可信" }
  }),
  style({
    id: "night-direct-flash", title: "夜景直闪", family: "photo",
    summary: "硬直闪、真实阴影与普通夜间环境形成直接而克制的情绪照片。",
    tags: ["夜景", "直闪", "情绪", "抓拍"],
    matchRules: [
      ["mood", "cinematic", 5, "夜间直闪具有叙事张力"], ["mood", "bold", 4, "硬光适合强视觉表达"],
      ["intensity", "medium", 3, "保留身份并建立夜景语言"], ["brightness", "dark", 2, "与夜景曝光关系接近"]
    ],
    imagingSystem: "CCD 数码直闪快照，相机附近硬闪、深背景和轻微颗粒，不混入柔雾棚拍或胶片漏光",
    stylingSystem: ["自然半哑光底妆，额头和双颊不做连续湿亮", "深色或单一高纯度服装只配一个主道具"],
    captureGrammar: ["直闪来自相机附近并留下方向正确的大阴影", "环境普通、可辨认且略带不完美"],
    visualSystem: ["硬闪高光、深背景、轻微颗粒与克制表情；皮肤不过曝"],
    slots: { scene: "酒店走廊、停车场出口或夜间街边墙面", camera: "28mm 至 35mm 近距离直闪", wardrobe: "深色或单一高纯度色服装", action: "回头、靠墙或缓慢前行", lighting: "机顶直闪为主，环境灯只保留少量色温" }
  }),
  style({
    id: "pov-interaction", title: "POV 互动抓拍", family: "photo",
    summary: "用前景物件与镜头发生动作闭环，让写真自然带出故事。",
    tags: ["POV", "互动", "抓拍", "故事感"],
    matchRules: [
      ["usage", "memento", 5, "互动动作适合纪念性写真"], ["mood", "natural", 4, "形成自然关系感"],
      ["mood", "fresh", 3, "适合轻松明亮表达"], ["orientation", "portrait", 2, "便于安排前景手部与人物"]
    ],
    imagingSystem: "近距离广角 POV 生活抓拍，自然景深与在场者视角，不混入长焦棚拍或夸张鱼眼",
    stylingSystem: ["妆发保持本人辨识锚点和自然皮肤层次", "服装、饰品和手持物使用同一色彩系统"],
    captureGrammar: ["前景物件从镜头附近递向人物，动作方向闭合", "前景手和物件不遮挡关键五官"],
    visualSystem: ["真实朋友抓拍质感、自然目光交流和适度景深"],
    slots: { scene: "花坡、院落、夜游街巷或安静咖啡店", camera: "第一人称近距离视角，前景轻微广角", wardrobe: "与场景协调的日常或新中式服装", action: "接花、递杯或触碰前景物件", lighting: "场景自然光或可信环境灯" }
  }),
  style({
    id: "studio-portrait", title: "高级棚拍肖像", family: "photo",
    summary: "克制背景与干净塑形光，把身份、面部结构和服装材质放在第一位。",
    tags: ["棚拍", "职业", "克制", "质感"],
    matchRules: [
      ["usage", "profile", 5, "清楚面部结构适合头像"], ["usage", "professional", 6, "适合职业形象"],
      ["mood", "mature", 5, "克制塑形光突出成熟气质"], ["intensity", "light", 3, "有利于保持真实身份"]
    ],
    imagingSystem: "85mm 中长焦棚拍肖像，受控塑形光与中性背景，不混入直闪快照或胶片模拟",
    stylingSystem: ["精确肤色、自然半哑光底妆和清晰眼眉", "服装材质与背景色只建立一组层次"],
    captureGrammar: ["相机与眼睛平齐，面部透视自然", "主光、补光和背景光各有明确职责"],
    visualSystem: ["中性背景、受控对比、精确肤色和可见服装纹理"],
    slots: { scene: "浅灰、暖褐或深绿无缝棚拍背景", camera: "85mm 半身或胸像，眼平视角", wardrobe: "版型清楚且与人物气质一致的得体服装", action: "肩颈舒展，轻微侧身，眼神清醒", lighting: "大号柔光箱塑形，轻微轮廓光分离背景" }
  }),
  style({
    id: "vintage-film-life", title: "复古胶片生活照", family: "photo",
    summary: "指定年代、胶片响应与轻微曝光误差，获得可信的怀旧生活照。",
    tags: ["胶片", "生活照", "怀旧", "颗粒"],
    matchRules: [
      ["usage", "memento", 5, "适合纪念写真"], ["mood", "natural", 4, "轻微不完美增强真实感"],
      ["mood", "cinematic", 3, "具体年代语言带来叙事感"], ["intensity", "medium", 3, "建立胶片响应而不丢身份"]
    ],
    imagingSystem: "1990 年代消费级彩色负片生活照，40mm 日常视角、细颗粒与温和高光滚降",
    stylingSystem: ["克制缎光底妆和不过度精修的眉眼", "无明显现代 Logo 的服装与一个生活物件建立年代感"],
    captureGrammar: ["像熟人在生活现场拍下，构图允许轻微偏移", "曝光偏差来自窗光、逆光或测光延迟"],
    visualSystem: ["彩色负片色彩、细颗粒、温和高光滚降和轻微色偏"],
    slots: { scene: "旧公寓窗边、社区小店或午后公交站", camera: "40mm 日常视角，轻微快照构图", wardrobe: "没有明显现代 Logo 的简洁日常服装", action: "整理衣袖、看窗外或与身边物件互动", lighting: "窗侧光或傍晚逆光，保留轻微欠曝" }
  }),
  style({
    id: "eastern-narrative", title: "东方叙事写真", family: "photo",
    summary: "用可信服饰、空间和动作关系表达东方气质，避开影楼模板。",
    tags: ["东方", "新中式", "叙事", "传统材质"],
    matchRules: [
      ["usage", "memento", 5, "适合仪式与纪念写真"], ["mood", "mature", 4, "传统材质适合成熟表达"],
      ["mood", "cinematic", 5, "空间与动作关系建立叙事"], ["intensity", "medium", 3, "适合服装与空间整体转换"]
    ],
    imagingSystem: "50mm 自然光东方环境人像，低饱和矿物色与真实木石材质，不混入仙侠特效或假棚景",
    stylingSystem: ["克制缎光底妆与低饱和矿物色锚点", "服装、茶具或门窗元素只围绕一个动作关系"],
    captureGrammar: ["人物动作与器物、门窗或庭院路径发生明确关系", "服装褶皱和饰物遵循重力与动作"],
    visualSystem: ["天然织物、木石空间、低饱和矿物色与克制光线"],
    slots: { scene: "真实庭院、木构廊道或安静茶室", camera: "50mm 环境半身，保留建筑线索", wardrobe: "材质可信的新中式或传统服装", action: "递杯、转身过门或轻触栏杆", lighting: "窗格侧光、灯笼暖光或阴天庭院柔光" }
  }),
  style({
    id: "travel-low-angle", title: "旅行低机位广角", family: "photo",
    summary: "用道路、行李、天空和建筑作为尺度锚点，形成舒展的旅行动态。",
    tags: ["旅行", "低机位", "广角", "动态"],
    matchRules: [
      ["usage", "social", 5, "开阔构图适合社交分享"], ["mood", "fresh", 4, "天空与移动感适合明亮氛围"],
      ["mood", "bold", 3, "受控广角带来视觉张力"], ["orientation", "portrait", 3, "利于容纳人物、道路和天空"]
    ],
    imagingSystem: "24mm 受控广角旅行环境人像，真实日光、天空负空间与尺度锚点",
    stylingSystem: ["自然半哑光和户外真实肤色", "旅行服装与单一手持物共同提供尺度"],
    captureGrammar: ["低机位但不以身体局部为视觉中心", "道路或建筑提供尺度，天空承担负空间"],
    visualSystem: ["开阔天空、真实日光和清楚色板，避免腿部夸张变形"],
    slots: { scene: "机场外广场、海边道路或开阔校园步道", camera: "24mm 低机位全身，人物靠近画面中轴", wardrobe: "便于行动的旅行服装，色彩单纯", action: "拉行李前行、跨步或回身看向镜头", lighting: "晴天侧光或低角度晨光" }
  }),
  style({
    id: "editorial-identity", title: "编辑身份海报", family: "art",
    summary: "一个清晰身份锚点配合一个受控揭示区，建立实验编辑视觉。",
    tags: ["编辑", "身份", "受控失真", "海报"],
    matchRules: [
      ["usage", "experiment", 6, "适合创意实验"], ["mood", "bold", 5, "局部揭示具有冲击力"],
      ["intensity", "strong", 5, "充分表现编辑构图"], ["orientation", "portrait", 2, "适合人物与大面积负空间"]
    ],
    imagingSystem: "受控透明介质的数字编辑肖像，清楚边缘、有限色板与单一揭示机制",
    stylingSystem: ["妆发以面部辨识为第一优先级", "单色服装与一个透明介质组成唯一视觉发动机"],
    captureGrammar: ["双眼或半张脸保持清晰，失真只能发生在一个指定区域", "人物与负空间形成单一视觉发动机"],
    visualSystem: ["有限色板、清楚边缘、纸张或透明介质质感；不生成文字"],
    slots: { scene: "无缝编辑背景与一个透明或半透明揭示介质", camera: "正面或 3/4 中近景", wardrobe: "结构简洁的单色服装", action: "克制直视或轻微转头", lighting: "硬柔结合的编辑塑形光" }
  }),
  style({
    id: "classical-painting", title: "古典绘画肖像", family: "art",
    summary: "把照片转换为有画布、笔触和古典布光的肖像，同时守住关键五官。",
    tags: ["绘画", "画布", "古典", "笔触"],
    matchRules: [
      ["usage", "memento", 4, "适合纪念性收藏"], ["mood", "mature", 5, "古典布光适合成熟表达"],
      ["intensity", "strong", 5, "可完整转换绘画媒介"], ["brightness", "dark", 2, "便于古典明暗塑形"]
    ],
    imagingSystem: "古典油画媒介转译，亚麻画布、分层油彩与透明罩染，不叠加摄影滤镜",
    stylingSystem: ["保留眼型、鼻唇、下颌和发际线锚点", "羊毛、棉麻或丝绒服装只配一个支撑道具"],
    captureGrammar: ["稳定坐姿或半身站姿，手与道具形成支撑关系", "真实工作室窗光落在面部与织物上"],
    visualSystem: ["可见亚麻画布、分层油彩与克制笔触，不模仿在世艺术家"],
    slots: { scene: "深色工作室、木质背景或低调帷幕", camera: "等效 85mm 半身肖像，稳定视平线", wardrobe: "质地明确的羊毛、棉麻或丝绒服装", action: "安静坐姿，手自然落在扶手或书本上", lighting: "单侧高窗光与低强度环境反射" }
  }),
  style({
    id: "vintage-print", title: "复古印刷肖像", family: "art",
    summary: "用有限色板、纸张、网点和错版构成可控的复古印刷人物图。",
    tags: ["印刷", "网点", "纸张", "有限色板"],
    matchRules: [
      ["usage", "social", 3, "适合社交视觉"], ["usage", "experiment", 6, "适合创意实验"],
      ["mood", "bold", 5, "有限色板具有冲击力"], ["intensity", "strong", 5, "建立完整印刷媒介"]
    ],
    imagingSystem: "两到四色丝网印刷肖像，纤维纸、规则网点与小幅单向套色误差",
    stylingSystem: ["妆发轮廓压缩为可辨识的大色块", "服装只使用边缘清楚的大色块"],
    captureGrammar: ["面部轮廓和双眼简化后仍清楚可辨", "错版偏移控制在单一方向与小幅度"],
    visualSystem: ["两到四色丝网印刷、纤维纸、规则网点；禁止随机符号和伪文字"],
    slots: { scene: "抽象纸面背景与少量几何色块", camera: "正面或轻微侧面的中近景轮廓", wardrobe: "大色块、边缘清楚的简洁服装", action: "稳定直视或轻微抬头", lighting: "清楚侧光建模后转译为印刷明暗层" }
  }),
  style({
    id: "rare-material", title: "稀有材质实验", family: "art",
    summary: "一次只组合一个主材质、光色、空间和缺陷层，探索非平均化人像。",
    tags: ["材质", "实验", "稀有风格", "反平均值"],
    matchRules: [
      ["usage", "experiment", 7, "专为创意探索设计"], ["mood", "bold", 6, "适合强烈前卫方向"],
      ["intensity", "strong", 6, "显现媒介差异"], ["orientation", "square", 2, "适合集中观察材质与轮廓"]
    ],
    imagingSystem: "磨砂半透明树脂介质的受控棚拍肖像，单一冷白光色和少量表面气泡",
    stylingSystem: ["保留双眼、脸型轮廓、鼻唇与发际线辨识度", "服装边界与树脂统一但仍可读"],
    captureGrammar: ["清晰轮廓和双眼是固定锚点", "一次只启用一个主材质机制"],
    visualSystem: ["磨砂半透明树脂、冷白透射光与少量表面气泡；不叠加第二种主材质"],
    slots: { scene: "单一几何摄影棚或受控微缩空间", camera: "正面半身，清楚轮廓和负空间", wardrobe: "与磨砂半透明树脂统一但保留服装边界", action: "稳定姿态，只让一处手部或肩部与树脂互动", lighting: "单一冷白主光，明确透射、反射与接触阴影" }
  })
]);

const EXPRESSIONS = Object.freeze({
  auto: { label: "自动匹配", phrase: "根据当前风格与镜头自动选择自然表情", gaze: "视线与镜头叙事协调" },
  relaxed: { label: "放松自然", phrase: "表情放松自然", gaze: "眼神平和自然" },
  "gentle-smile": { label: "温柔微笑", phrase: "嘴角轻轻上扬的温柔微笑", gaze: "眼神柔和亲切" },
  "bright-joy": { label: "明亮笑意", phrase: "明亮愉悦但不过度夸张的笑容", gaze: "眼神明亮有感染力" },
  calm: { label: "安静沉着", phrase: "表情安静沉着", gaze: "眼神稳定克制" },
  confident: { label: "从容自信", phrase: "表情从容自信", gaze: "眼神笃定直接" },
  thoughtful: { label: "若有所思", phrase: "表情若有所思", gaze: "眼神专注而内省" },
  playful: { label: "俏皮灵动", phrase: "表情俏皮灵动", gaze: "眼神灵动有互动感" }
});

const STYLE_EXPRESSION = {
  "clear-natural-light": "relaxed", "city-editorial": "confident", "night-direct-flash": "playful",
  "pov-interaction": "gentle-smile", "studio-portrait": "confident", "vintage-film-life": "relaxed",
  "eastern-narrative": "thoughtful", "travel-low-angle": "bright-joy", "editorial-identity": "confident",
  "classical-painting": "calm", "vintage-print": "gentle-smile", "rare-material": "thoughtful"
};

const SHOTS = Object.freeze({
  hero: { label: "主肖像", instruction: "建立当前风格的核心人物肖像，身份识别优先", composition: "让双眼、面部结构或完整人物轮廓成为单一身份锚点", action: "收束无关头部、手部和道具变化", lighting: "优先建立身份轮廓和眼神光，背景光不抢人物" },
  environment: { label: "环境肖像", instruction: "增加环境占比，让人物与空间、光线和材质形成清楚关系", composition: "人物与环境尺度锚点同时可读", action: "与门窗、道路、家具或自然元素形成一个清楚关系", lighting: "环境光与人物光来自同一空间" },
  action: { label: "动作抓拍", instruction: "把动作处理为一个有物理原因的抓拍事件", composition: "为动作方向保留负空间并完整保留手部因果", action: "只执行一个动作事件，头肩、手部和道具方向一致", lighting: "让光落在动作发生的手、道具、发丝或衣角上" },
  detail: { label: "细节变化", instruction: "只改变轻微视角或画面内裁切，强调细节而不改变身份", composition: "用轻微侧角强调面部、手部或服装材质", action: "截取一个手部、视线或衣料瞬间", lighting: "降低亮部覆盖面积，让眼缘、发丝与材质分层可读" }
});

const SIZES = Object.freeze({
  "1K": { "1:1": "1024x1024", "2:3": "1024x1536", "3:2": "1536x1024" },
  "2K": { "1:1": "2048x2048", "2:3": "1664x2496", "3:2": "2496x1664" }
});

function sanitize(value, max = 500) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function getStyle(id) {
  return STYLES.find((item) => item.id === id);
}

function compilePrompt(input) {
  const selectedStyle = getStyle(input.styleId);
  const shot = SHOTS[input.shotId];
  if (!selectedStyle || !shot) throw new Error("写真风格或镜头不存在");
  const expressionId = input.expression?.id === "auto" ? (STYLE_EXPRESSION[selectedStyle.id] || "relaxed") : input.expression?.id;
  const expression = EXPRESSIONS[expressionId];
  if (!expression) throw new Error("写真表情无效");
  const intensity = { subtle: "轻微而克制", balanced: "自然平衡", expressive: "更鲜明但仍自然" }[input.expression?.intensity];
  if (!intensity) throw new Error("写真表情强度无效");
  const overrides = input.overrides || {};
  const slots = Object.entries(selectedStyle.slots).map(([key, value]) => {
    const label = { scene: "场景", camera: "相机与机位", wardrobe: "服装", action: "动作", lighting: "光线" }[key];
    return `${label}：${sanitize(overrides[key]) || value}`;
  });
  const extra = sanitize(input.extra, 1000);
  const directed = sanitize(input.directedInstruction, 300);
  const identity = selectedStyle.family === "art"
    ? [...BASE_IDENTITY, "艺术媒介可以改变表面质感，但眼距、鼻形、嘴型、下颌和年龄印象不得漂移"]
    : BASE_IDENTITY;
  const sections = [
    ["任务与输出契约", [...BASE_OUTPUT, `画幅严格为 ${input.ratio}，本次只输出 1 张独立图片`]],
    ["身份不变量", identity],
    ["表情与视线", [`${expression.label}：${expression.phrase}，表达${intensity}`, expression.gaze, "只改变表情软组织与视线，不改变脸型、五官比例、年龄感和身份"]],
    ["妆造与道具系统", selectedStyle.stylingSystem],
    ["捕获语法", selectedStyle.captureGrammar],
    ["风格系统", [`风格名称：${selectedStyle.title}`, `主成像机制：${selectedStyle.imagingSystem}`, "一张图仅保留这一种主成像机制", ...selectedStyle.visualSystem, ...slots]],
    ["本镜头变化", [`${shot.label}：${shot.instruction}`, `构图差异：${shot.composition}`, `动作差异：${shot.action}`, `现场光线差异：${shot.lighting}`, extra ? `用户补充要求：${extra}` : "用户补充要求：无", directed ? `定向修改：${directed}` : "定向修改：无"]],
    ["安全边界", BASE_SAFETY],
    ["失败验收", selectedStyle.family === "art" ? [...FAILURE_CHECKLIST, "避免艺术效果覆盖双眼、整张脸或关键身份锚点"] : FAILURE_CHECKLIST]
  ];
  return sections.map(([heading, lines]) => `[${heading}]\n${lines.map((line) => `- ${line}`).join("\n")}`).join("\n\n");
}

function preparePortraitPayload(body) {
  const input = body?.portrait;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("写真参数无效");
  if (input.adultConsent !== true) throw new Error("请确认照片中的人物均为成年人");
  if (input.rightsConsent !== true) throw new Error("请确认这是本人或已获得肖像使用授权");
  const selectedStyle = getStyle(String(input.styleId || ""));
  if (!selectedStyle) throw new Error("所选写真风格不存在");
  if (String(input.styleVersion || "") !== selectedStyle.version) throw new Error("写真风格版本已更新，请重新选择");
  if (!Object.hasOwn(SHOTS, input.shotId)) throw new Error("写真镜头无效");
  if (!Object.hasOwn(SIZES, input.resolution) || !Object.hasOwn(SIZES[input.resolution], input.ratio)) throw new Error("写真输出比例或分辨率无效");
  if (!Object.hasOwn(EXPRESSIONS, input.expression?.id)) throw new Error("写真表情无效");
  if (!["subtle", "balanced", "expressive"].includes(input.expression?.intensity)) throw new Error("写真表情强度无效");
  if (!["low", "medium", "high"].includes(input.quality)) throw new Error("写真生成质量无效");
  const overrides = input.overrides || {};
  const allowedOverrides = new Set(["scene", "camera", "wardrobe", "action", "lighting"]);
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides) || Object.keys(overrides).some((key) => !allowedOverrides.has(key) || typeof overrides[key] !== "string")) {
    throw new Error("写真高级参数只能调整场景、机位、服装、动作和光线");
  }
  return {
    ...body,
    prompt: compilePrompt(input),
    size: SIZES[input.resolution][input.ratio],
    quality: input.quality,
    outputFormat: "png",
    portrait: {
      styleId: selectedStyle.id, styleVersion: selectedStyle.version, styleTitle: selectedStyle.title,
      shotId: input.shotId, shotLabel: SHOTS[input.shotId].label, ratio: input.ratio,
      resolution: input.resolution, expression: { id: input.expression.id, intensity: input.expression.intensity },
      questionnaire: input.questionnaire || {}, overrides,
      saveSource: input.saveSource === true, seriesId: sanitize(input.seriesId, 80),
      settingsSignature: sanitize(input.settingsSignature, 80)
    }
  };
}

function publicOptions() {
  return {
    version: VERSION,
    styles: STYLES.map((item, index) => ({
      id: item.id, version: item.version, title: item.title, family: item.family, summary: item.summary,
      tags: item.tags, matchRules: item.matchRules, slots: item.slots, preview: { column: index % 4, row: Math.floor(index / 4) }
    })),
    expressions: Object.entries(EXPRESSIONS).map(([id, value]) => ({ id, ...value })),
    shots: Object.entries(SHOTS).map(([id, value]) => ({ id, label: value.label })),
    sizes: SIZES
  };
}

module.exports = { VERSION, STYLES, EXPRESSIONS, SHOTS, SIZES, getStyle, compilePrompt, preparePortraitPayload, publicOptions };

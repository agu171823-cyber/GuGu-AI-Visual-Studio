import type {
  AssetChangeSet,
  ReferenceSource,
} from "../../shared/asset-schema";
import type {
  IdentityDescriptor,
  ProjectMode,
  VersionStatus,
} from "../../shared/project-schema";
import type { AssetRole } from "../../shared/templates";

export type CompileIdentityPromptInput = {
  mode: ProjectMode;
  characterTag: string;
  assetRole: AssetRole;
  immutableDescriptor: IdentityDescriptor;
  parentStateId?: string;
  referenceRoles?: readonly AssetRole[];
  baseWardrobeBrief?: string;
  changeSet: AssetChangeSet;
};

const ROLE_INSTRUCTIONS: Record<AssetRole, string> = {
  "face-front": "明确成年、完整着装的正面脸部身份锚点；中性表情、平视、面部结构清楚。",
  "face-three-quarter": "微侧半身：与中性半身相同的 2:3 竖幅、腰部以上景别；完整呈现头顶、发型、肩线、上身服装和腰线，不裁切头部与关键身体部位。躯干微侧约 20–30 度，脸部自然微侧、双眼可辨；复制正脸锚点的脸型与五官比例，以及正面全身锚点的身形与基础服装。明确成年、完整着装，不生成脸部特写或全身远景。",
  "body-front": "明确成年、完整着装的正面全身身材与基础服装锚点；自然站姿，完整呈现头顶至脚部。",
  "body-side": "明确成年、完整着装的侧面全身参考；复制正面全身锚点的身高感、肩胯与肢体比例。",
  "body-back": "专业角色服装目录的背面设计参考；明确成年角色端庄直立并由完整服装覆盖，清楚呈现发型背面、肩部服装结构、袖型与下摆，使用客观工作室构图。",
  "half-neutral": "专业角色设定用腰部以上肖像；明确成年角色以完整服装覆盖肩部与上身，端庄平视，清楚呈现脸部、发型、肩部服装结构与配饰，使用客观工作室构图。",
  "stress-lighting": "明确成年、完整着装的专业光线一致性测试；仅将主光改为自然侧光，人物结构保持稳定。",
  "stress-angle": "明确成年、完整着装的专业机位一致性测试；仅改变相机高度与方位，人物结构保持稳定。",
  "stress-action": "明确成年、完整着装的专业动作一致性测试；采用自然端庄的站姿转换或克制步行。",
  "model-card-natural": "明确成年、完整着装的自然肖像模卡照；干净背景、克制修饰、真实皮肤。",
  "model-card-half": "明确成年、完整着装的半身模卡照；清楚呈现面部、肩线与上身比例。",
  "model-card-full": "专业人物模卡目录的正面全身参考；明确成年人物以完整日常服装覆盖，端庄自然站立，完整呈现头顶至脚部，使用客观工作室构图。",
  "model-card-side-action": "专业人物模卡目录的侧面动态参考；明确成年人物以完整日常服装覆盖，使用自然端庄的侧面站姿或克制步行动作和客观工作室构图。",
  expression: "表情派生资产；生成正面胸口以上表情肖像，完整呈现头顶、发型轮廓、脸部、颈肩和少量上身；脸部居中且占据足够画面，仅改变指定表情强度，不改变五官结构、机位、背景、光线或基础服装。",
  "wardrobe-state": "服装派生资产；仅改变指定服装，不改变身体结构。",
  "action-reference": "动作参考资产；仅改变姿势和动作，不改变身份。",
  custom: "自定义派生资产；严格限定为本次声明的单一变化类别。",
};

const FIXED_ROLE_CHANGE_INSTRUCTIONS: Partial<Record<AssetRole, string>> = {
  "face-front": "建立明确成年、完整着装、自然平视的专业正脸身份锚点",
  "face-three-quarter": "建立与中性半身同尺寸的微侧半身：腰部以上、躯干自然微侧、脸部身份清晰，复制基础服装",
  "body-front": "建立明确成年、完整着装、解剖比例自然协调的正面全身身材与基础服装锚点",
  "body-side": "建立复制正面全身身材比例与基础服装的专业侧面全身参考",
  "body-back": "建立完整服装覆盖的专业角色服装背面目录参考",
  "half-neutral": "建立完整服装覆盖的专业角色设定用腰部以上肖像",
  "stress-lighting": "仅改变自然主光方向与明暗关系，身份、身体结构与基础服装保持一致",
  "stress-angle": "仅改变相机高度、方位与镜头透视，身份、身体结构与基础服装保持一致",
  "stress-action": "仅改变自然动作的关节角度和重心，身份、身体结构与基础服装保持一致",
  "model-card-natural": "建立明确成年、完整着装的专业自然肖像模卡参考",
  "model-card-half": "建立明确成年、完整着装并复制身材与基础服装的专业半身模卡参考",
  "model-card-full": "建立明确成年、完整日常服装覆盖的专业人物模卡目录正面全身参考",
  "model-card-side-action": "建立明确成年、完整日常服装覆盖且动作自然端庄的专业人物模卡目录侧面站姿或克制步行参考",
};

const BODY_ANCHORED_ROLES = new Set<AssetRole>([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral",
  "stress-lighting",
  "stress-angle",
  "stress-action",
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference",
]);

const WARDROBE_LOCKED_ROLES = new Set<AssetRole>([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral",
  "stress-lighting",
  "stress-angle",
  "stress-action",
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "action-reference",
]);

const STRESS_ROLES = new Set<AssetRole>([
  "stress-lighting",
  "stress-angle",
  "stress-action",
]);

const CHANGE_CATEGORIES = new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera",
]);

function sanitize(value: string, limit = 500): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function assertSingleVariableChange(
  changeSet: AssetChangeSet,
  versionStatus: VersionStatus,
): void {
  if (!CHANGE_CATEGORIES.has(changeSet.category)) throw new Error("变化类别无效");
  if (!sanitize(changeSet.instruction)) throw new Error("变化指令不能为空");
  if (!sanitize(changeSet.sourceStateId) || !sanitize(changeSet.targetStateId)) {
    throw new Error("变化必须声明来源状态和目标状态");
  }
  if (versionStatus === "locked" && changeSet.category === "identity") {
    throw new Error("身份变化必须创建新版本");
  }
}

export function orderReferenceSources<T extends ReferenceSource>(sources: readonly T[]): T[] {
  const priority = (source: T): number => {
    if (source.kind === "session") return 3;
    if (source.role === "face-front" || source.role === "face-three-quarter") return 0;
    if (["body-front", "body-side", "body-back", "half-neutral"].includes(source.role)) return 1;
    return 2;
  };
  return sources
    .map((source, index) => ({ source, index, priority: priority(source) }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map(({ source }) => source);
}

export function assertGenerationReferenceContract(
  assetRole: AssetRole,
  sources: readonly ReferenceSource[],
): void {
  const approvedRoles = sources
    .filter((source) => source.kind === "asset")
    .map((source) => source.role);
  const hasApproved = (role: AssetRole): boolean => approvedRoles.includes(role);
  const sessionRoles = sources
    .filter((source) => source.kind === "session")
    .map((source) => source.role);

  if (assetRole === "face-front") {
    if (sessionRoles.length > 2 || sessionRoles.some((role) => ![
      "face-front",
      "face-three-quarter",
      "body-front",
      "body-side",
      "body-back",
      "half-neutral",
    ].includes(role))) {
      throw new Error("face-front 会话参考最多两张，且必须是人物规范参考图");
    }
  }

  if (assetRole === "body-front" && !hasApproved("face-front")) {
    throw new Error("body-front 规范资产必须引用已接受的 face-front 正脸锚点");
  }
  if (assetRole === "body-front") {
    const bodyReferences = sessionRoles.filter((role) =>
      ["body-front", "body-side", "body-back", "half-neutral"].includes(role));
    const wardrobeReferences = sessionRoles.filter((role) => role === "wardrobe-state");
    if (sessionRoles.length > 2
      || bodyReferences.length > 1
      || wardrobeReferences.length > 1
      || bodyReferences.length + wardrobeReferences.length !== sessionRoles.length) {
      throw new Error("body-front 会话参考最多包含一张身体参考和一张基础服装参考");
    }
  }
  if (["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(assetRole)
    && (!hasApproved("face-front") || !hasApproved("body-front"))) {
    throw new Error(`${assetRole} 规范资产必须同时引用已接受的 face-front 与 body-front 锚点`);
  }
  if (["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(assetRole)
    && (sessionRoles.length > 1 || sessionRoles.some((role) => role !== assetRole))) {
    throw new Error(`${assetRole} 最多只能附加一张同职责会话参考图`);
  }
  if (STRESS_ROLES.has(assetRole)) {
    const exactApprovedAnchors = approvedRoles.length === 2
      && approvedRoles[0] === "face-front"
      && approvedRoles[1] === "body-front";
    if (!exactApprovedAnchors || sources.length !== 2) {
      throw new Error("压力测试只能引用 face-front 与 body-front 两个锚点资产");
    }
  }
  if (BODY_ANCHORED_ROLES.has(assetRole)
    && !isCanonicalBodyAnchorRole(assetRole)
    && !STRESS_ROLES.has(assetRole)
    && (!hasApproved("face-front") || !hasApproved("body-front"))) {
    throw new Error(`${assetRole} 必须同时引用 face-front 与 body-front 身材锚点`);
  }
  if (!isCanonicalBodyAnchorRole(assetRole)
    && !STRESS_ROLES.has(assetRole)
    && sessionRoles.length > 0) {
    throw new Error("派生资产不接受额外会话参考图，请使用已批准父资产和双锚点");
  }
}

function isCanonicalBodyAnchorRole(role: AssetRole): boolean {
  return role === "face-front"
    || role === "body-front"
    || ["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(role);
}

function section(title: string, lines: readonly string[]): string {
  return [`[${title}]`, ...lines.filter(Boolean).map((line) => `- ${line}`)].join("\n");
}

function referencePurpose(role: AssetRole): string {
  if (role === "face-front") return "用于面部身份";
  if (role === "face-three-quarter") return "用于面部身份与微侧半身构图";
  if (role === "body-front") return "用于体型与基础服装";
  if (role === "wardrobe-state") return "仅用于基础服装造型";
  if (["body-side", "body-back", "half-neutral"].includes(role)) return "用于补充身体结构";
  return "用于当前状态参考";
}

export function compileIdentityPrompt(input: CompileIdentityPromptInput): string {
  assertSingleVariableChange(input.changeSet, "draft");
  const characterTag = sanitize(input.characterTag, 80);
  if (!/^@[a-z0-9-]+$/.test(characterTag)) throw new Error("角色标签无效");

  const visibleNotes = input.immutableDescriptor.visibleNotes
    .map((note) => sanitize(note))
    .filter(Boolean);
  const instruction = sanitize(
    FIXED_ROLE_CHANGE_INSTRUCTIONS[input.assetRole] ?? input.changeSet.instruction,
  );
  const sourceStateId = sanitize(input.changeSet.sourceStateId, 80);
  const targetStateId = sanitize(input.changeSet.targetStateId, 80);
  const parentStateId = sanitize(input.parentStateId ?? sourceStateId, 80);
  const baseWardrobeBrief = sanitize(input.baseWardrobeBrief ?? "", 300);
  const hasWardrobeReference = (input.referenceRoles ?? []).includes("wardrobe-state");

  const outputContract = [
    "生成单张写实人物资产，人物清晰、比例可信、无文字水印。",
    "本次输出只服务于指定资产角色，不合并其他镜头或变化。",
  ];
  const identityContract = [
    "所有参考共同描述同一个成年人；脸部锚点决定面部身份，身体锚点决定身形比例。",
    "保持脸型比例、关键五官、年龄感、肤色基调、发际线、发型锚点、可辨识配饰、肩胯比例和身体轮廓。",
    "不根据外观推断性格、职业、阶层或健康状态。",
    ...visibleNotes.map((note) => `用户确认的可见特征：${note}`),
  ];
  const referenceManifest = (input.referenceRoles ?? []).map(
    (role, index) => `第 ${index + 1} 张：${role}，${referencePurpose(role)}。`,
  );
  const stateContract = [
    `父状态：${parentStateId || "base"}。`,
    `来源状态：${sourceStateId}；目标状态：${targetStateId}。`,
    "派生状态不得覆盖基础角色或已锁定版本。",
  ];
  const changeContract = [
    `变化类别：${input.changeSet.category}。`,
    `唯一允许变化：${instruction}。`,
    "未被声明的身份、服装、表情、动作、状态、背景、光线与机位均保持不变。",
  ];
  const captureGrammar = [
    "真实摄影质感，自然皮肤纹理，可信镜头透视，避免过度磨皮与塑料感。",
    "优先保证身份可识别性和跨资产一致性，再满足造型变化。",
  ];
  const bodyContract = input.assetRole === "body-front"
    ? [
      "建立自然协调且可复用的身体结构：头身比、肩宽与胯宽、腰线位置、躯干长度、手臂与腿长、肘膝关节位置、左右平衡和站立重心均符合可信人体结构。",
      "基础服装完整着装，版型自然合体，清楚呈现服装层次、上装、下装、鞋履和可见配饰。",
      "正脸参考只决定面部身份，不沿用其中的服装。",
      ...(baseWardrobeBrief
        ? ["基础服装以本次文字说明为准。"]
        : hasWardrobeReference
          ? ["基础服装以 wardrobe-state 服装参考为准，只借鉴服装造型。"]
          : [
            "未提供服装说明或服装参考时，使用完整覆盖的中性日常工作室服装：不透明的圆领长袖上衣、自然合体的直筒长裤和包脚鞋；领口完整覆盖，版型自然不过紧。",
          ]),
    ]
    : BODY_ANCHORED_ROLES.has(input.assetRole)
      ? [
        "以 body-front 参考为唯一身体与基础服装真源。",
        "复制其头身比、肩宽与胯宽、腰线位置、躯干长度、手臂与腿长、肘膝关节位置和整体身高感。",
        ...(WARDROBE_LOCKED_ROLES.has(input.assetRole)
          ? ["复制其服装类别、颜色、材质观感、领口、袖型、层数、上装、下装、鞋履和可见配饰。"]
          : ["身体结构保持稳定，服装只按本次明确声明的换装指令变化。"]),
      ]
      : [];
  const stressContract = STRESS_ROLES.has(input.assetRole)
    ? [
      input.assetRole === "stress-lighting"
        ? "本测试只改变主光方向与明暗关系。"
        : input.assetRole === "stress-angle"
          ? "本测试只改变相机高度、方位与镜头透视。"
          : "本测试只改变关节角度和重心。",
      "人物身份、发型、表情基调、头身比、肩胯、腰线、肢体长度、基础服装、鞋履与配饰保持一致。",
    ]
    : [];
  const expressionContract = input.assetRole === "expression"
    ? [
      (input.referenceRoles ?? []).includes("half-neutral")
        ? "以 half-neutral 参考为主要构图与基础服装参考，使用正面胸口以上景别。"
        : "使用正面胸口以上景别，不沿用全身参考的远景构图。",
      "face-front 只负责面部身份，body-front 只负责身材与基础服装一致性，不沿用其全身景别。",
      "头顶、完整发型轮廓、完整脸部、颈肩和少量上身均在画面内，眼睛位于画面上半部。",
    ]
    : [];
  const safetyContext = [
    input.mode === "human-model-card"
      ? "内容限定为已授权肖像、明确成年、完整着装的人物角色参考。"
      : "内容限定为拥有设计使用权、明确成年、完整着装的虚拟角色参考。",
    "场景为普通专业摄影棚或角色设定目录，姿态自然端庄，画面保持中性专业。",
  ];
  const qualityContract = [
    "画面仅包含一位人物，身份、年龄感、脸部结构、身体比例和未声明状态稳定。",
    input.assetRole === "expression"
      ? "头顶、发型轮廓、面部、颈肩和少量上身完整呈现，皮肤纹理与镜头透视自然可信。"
      : "手部、肢体、皮肤纹理与镜头透视自然可信，关键身体部位完整呈现。",
  ];

  return [
    section("任务与输出契约", outputContract),
    section("角色标签与版本", [characterTag]),
    section("不可变身份合同", identityContract),
    section("有序参考职责", referenceManifest),
    section("当前资产角色", [ROLE_INSTRUCTIONS[input.assetRole]]),
    section("当前状态与父资产", stateContract),
    section("本次单一变化", changeContract),
    section("身材与基础服装合同", bodyContract),
    section("压力测试单变量合同", stressContract),
    section("表情肖像构图合同", expressionContract),
    section("基础服装说明", baseWardrobeBrief ? [baseWardrobeBrief] : []),
    section("捕获语法", captureGrammar),
    section("授权与安全边界", safetyContext),
    section("正向质量合同", qualityContract),
  ].join("\n\n");
}

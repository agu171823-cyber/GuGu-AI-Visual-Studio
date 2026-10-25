export type BoardAssetInput = {
  id: string;
  role: string;
  imageUrl: string;
  label: string;
};

export type BoardImageSlot = {
  assetId: string;
  imageUrl: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  focusY?: number;
  fit?: "cover" | "contain";
};

export type BoardTextItem = {
  value: string;
  x: number;
  y: number;
  size: number;
  weight: 500 | 700 | 800;
  color: string;
  align?: "left" | "center" | "right";
  family?: "sans" | "mono";
};

export type BoardLayout = {
  kind: "human-comp-card" | "virtual-character-sheet";
  width: number;
  height: number;
  background: string;
  accent: string;
  images: BoardImageSlot[];
  text: BoardTextItem[];
};

type HumanLayoutInput = {
  assets: BoardAssetInput[];
  displayName?: string;
  showProfile: boolean;
  profile?: {
    stageName?: string;
    heightCm?: number;
    bustCm?: number;
    waistCm?: number;
    hipsCm?: number;
    shoeSize?: string;
    contact?: string;
  };
};

type VirtualLayoutInput = {
  assets: BoardAssetInput[];
  displayName?: string;
  characterTag?: string;
  stateLabels: string[];
};

const HUMAN_SLOTS = [
  { x: 120, y: 390, width: 1020, height: 1880 },
  { x: 1190, y: 390, width: 550, height: 880 },
  { x: 1790, y: 390, width: 570, height: 880 },
  { x: 1190, y: 1320, width: 550, height: 950 },
  { x: 1790, y: 1320, width: 570, height: 950 },
] as const;

const VIRTUAL_SLOTS = [
  { x: 84, y: 330, width: 410, height: 1510 },
  { x: 526, y: 330, width: 410, height: 1510 },
  { x: 968, y: 330, width: 410, height: 1510 },
  { x: 1410, y: 330, width: 410, height: 1510 },
  { x: 1860, y: 330, width: 540, height: 450 },
  { x: 2432, y: 330, width: 556, height: 450 },
  { x: 1860, y: 812, width: 540, height: 450 },
  { x: 2432, y: 812, width: 556, height: 450 },
  { x: 1860, y: 1294, width: 540, height: 546 },
  { x: 2432, y: 1294, width: 556, height: 546 },
] as const;

function slotsFor(
  assets: BoardAssetInput[],
  slots: readonly { x: number; y: number; width: number; height: number }[],
  fit: "cover" | "contain" = "cover",
): BoardImageSlot[] {
  return assets.slice(0, slots.length).map((asset, index) => ({
    ...asset,
    ...slots[index],
    assetId: asset.id,
    fit,
    ...(asset.role === "expression" ? { focusY: 0.12 } : {}),
  }));
}

export function buildHumanModelCardLayout(input: HumanLayoutInput): BoardLayout {
  const text: BoardTextItem[] = [
    { value: (input.displayName || "MODEL").toUpperCase(), x: 120, y: 170, size: 104, weight: 800, color: "#1b1b18" },
    { value: "MODEL CARD / IDENTITY LOCKED", x: 124, y: 266, size: 28, weight: 700, color: "#68705b", family: "mono" },
    { value: "APPROVED ASSET SELECTION", x: 2360, y: 268, size: 24, weight: 700, color: "#68705b", align: "right", family: "mono" },
  ];
  if (input.showProfile && input.profile) {
    const profile = [
      input.profile.stageName ? `STAGE  ${input.profile.stageName}` : "",
      input.profile.heightCm ? `HEIGHT  ${input.profile.heightCm} CM` : "",
      input.profile.bustCm && input.profile.waistCm && input.profile.hipsCm
        ? `B/W/H  ${input.profile.bustCm}/${input.profile.waistCm}/${input.profile.hipsCm} CM`
        : "",
      input.profile.shoeSize ? `SHOE  ${input.profile.shoeSize}` : "",
      input.profile.contact ? `CONTACT  ${input.profile.contact}` : "",
    ].filter(Boolean);
    profile.forEach((value, index) => text.push({
      value,
      x: 120,
      y: 2460 + index * 76,
      size: 34,
      weight: 700,
      color: "#1b1b18",
      family: "mono",
    }));
  }
  text.push({
    value: "GENERATED FROM SAVED, USER-APPROVED ASSETS — NO ORIGINAL REFERENCES EMBEDDED",
    x: 120,
    y: 3390,
    size: 22,
    weight: 700,
    color: "#77756d",
    family: "mono",
  });
  return {
    kind: "human-comp-card",
    width: 2480,
    height: 3508,
    background: "#f5f1e8",
    accent: "#68705b",
    images: slotsFor(input.assets, HUMAN_SLOTS, "contain"),
    text,
  };
}

export function buildVirtualCharacterLayout(input: VirtualLayoutInput): BoardLayout {
  const name = (input.displayName || "CHARACTER").toUpperCase();
  const labels = input.stateLabels.length ? input.stateLabels.join(" / ") : "BASE";
  return {
    kind: "virtual-character-sheet",
    width: 3072,
    height: 2048,
    background: "#f5f1e8",
    accent: "#68705b",
    images: slotsFor(input.assets, VIRTUAL_SLOTS),
    text: [
      { value: name, x: 84, y: 150, size: 92, weight: 800, color: "#1b1b18" },
      { value: input.characterTag ?? "IDENTITY SOURCE", x: 88, y: 240, size: 30, weight: 700, color: "#68705b", family: "mono" },
      { value: `STATES  ${labels}`, x: 2988, y: 240, size: 26, weight: 700, color: "#68705b", align: "right", family: "mono" },
      { value: "FACE / FRONT / SIDE / BACK / 6 EXPRESSIONS", x: 2988, y: 1950, size: 22, weight: 700, color: "#77756d", align: "right", family: "mono" },
    ],
  };
}

/**
 * lib/media/plan.ts — what the media library must contain, and what it must
 * never contain.
 *
 * The showroom sells gold, silver and diamonds. Stock libraries are full of
 * costume, imitation and "fashion" jewellery, museum pieces and illustrations,
 * which is exactly what made the first image pass look artificial. Every
 * candidate is therefore checked against an explicit reject list and a required
 * metal/gemstone word before it can enter a set.
 *
 * One plan per collection (100 photographs), per design style (6) and per
 * occasion album (6). The sync script reads these; the coverage command reports
 * what is still missing. Nothing here invents a photograph.
 */

export type MediaFamily = "gold" | "silver" | "diamond" | "gemstone";
export type MediaKind = "collection" | "design" | "occasion";

export type MediaPlan = {
  slug: string;
  kind: MediaKind;
  family: MediaFamily;
  target: number;
  queries: readonly string[];
};

/** Words that mean the picture is not real gold/silver/diamond jewellery. */
export const REJECT_PATTERNS: readonly RegExp[] = [
  /\bcostume\b/i,
  /\bimitation\b/i,
  /\bartificial\b/i,
  /\bplastic\b/i,
  /\bacrylic\b/i,
  /\btoy\b/i,
  /\bfake\b/i,
  /\brhinestone/i,
  /\bbrass\b/i,
  /\bcopper\b/i,
  // Plated, tone and alloy pieces are not the metal they imitate.
  /\bplated\b/i,
  /\bgold[- ]tone\b/i,
  /\balloy\b/i,
  /\bimitation gold\b/i,
  /\bmuseum\b/i,
  /\bantique\b/i,
  /\bvintage\b/i,
  /\bpainting\b/i,
  /\bdrawing\b/i,
  /\billustration\b/i,
  /\bsketch\b/i,
  /\bcartoon\b/i,
  /\bclipart\b/i,
  /\brender(?:ed|ing)?\b/i,
  /\b3d\b/i,
  /\bmannequin\b/i,
  /\bportrait\b/i,
  /\bmodel\b/i,
  /\bbride\b/i,
  /\bwoman\b/i,
  /\bgirl\b/i,
  /\bperson\b/i,
  /\bpeople\b/i,
  /\bwearing\b/i,
  /\bhand\b/i,
  // Things that merely contain the word "gold": a lipstick, a Christmas
  // bauble and a pocket watch all passed a metal-only check during the first run.
  /christmas/i,
  /easter/i,
  /halloween/i,
  /wallpaper/i,
  /decoration/i,
  /ornament/i,
  /bauble/i,
  /watch/i,
  /clock/i,
  /lipstick/i,
  /makeup/i,
  /make-up/i,
  /wine/i,
  /candle/i,
  /coffee/i,
  /notebook/i,
  /scarf/i,
  /boots/i,
  /shoes/i,
  /building/i,
  /church/i,
  /flower/i,
  /pyrite/i,
  /fools gold/i,
  /dollar/i,
  /money/i,
  /nugget/i,
  /jeans/i,
  /denim/i,
  /jacket/i,
  /shirt/i,
  /dress/i,
  /outfit/i,
];

const FAMILY_PATTERNS: Record<MediaFamily, RegExp> = {
  gold: /\bgold\b|\b24k\b|\b22k\b|\b20k\b|\b18k\b|\b14k\b|\bkada\b|\bmeenakari\b/i,
  silver: /\bsilver\b|\b925\b|\bsterling\b/i,
  diamond: /\bdiamond\b|\bsolitaire\b|\bbrilliant\b/i,
  gemstone: /\bruby\b|\bemerald\b|\bsapphire\b|\bpearl\b|\btopaz\b|\bamethyst\b|\bgemstone\b|\bratna\b/i,
};

/**
 * Retrieval size floor. Pixabay's public feed tops out at 1280 px for most
 * photographs, so 1200 is the smallest width that still looks sharp in a card
 * without demanding a file the source does not serve.
 */
export const MIN_LONG_EDGE = 1200;

/**
 * A photograph must show a piece of jewellery, not something that happens to be
 * tagged "gold". This is the check that keeps a Christmas bauble out of the
 * necklace set.
 */
const JEWELLERY_OBJECTS =
  /\b(necklaces?|jewellery|jewelry|earrings?|jhumkas?|bangles?|bracelets?|kadas?|rings?|pendants?|chains?|anklets?|mangalsutra|brooch(?:es)?|choker|jewels|gemstones?)\b/i;

/** Coins and biscuits are bought as bullion, so their sets use bullion nouns. */
const BULLION_OBJECTS = /\b(coins?|bullion|ingots?|bars?|biscuits?)\b/i;

const GEM_OBJECTS =
  /\b(ruby|rubies|emerald|emeralds|sapphire|sapphires|pearls?|topaz|amethyst|gemstones?|gems?)\b/i;

const OBJECT_PATTERNS: Record<string, RegExp> = {
  "gold-coins": BULLION_OBJECTS,
  "gold-biscuits": BULLION_OBJECTS,
  "gold-coins-and-biscuits": BULLION_OBJECTS,
  gems: GEM_OBJECTS,
  "silver-and-pearls":
    /\b(pearls?|necklaces?|jewellery|jewelry|pendants?|bracelets?|earrings?)\b/i,
};

export const COLLECTION_PLANS: readonly MediaPlan[] = [
  {
    slug: "gold-jewellery",
    kind: "collection",
    family: "gold",
    target: 100,
    queries: [
      "22k gold necklace indian",
      "gold necklace set close up",
      "gold jhumka earrings",
      "gold bangles pair",
      "gold kada jewellery",
      "thin gold chain",
      "gold pendant necklace",
      "lightweight gold earrings",
    ],
  },
  {
    slug: "gold-coins",
    kind: "collection",
    family: "gold",
    target: 100,
    queries: ["gold coin", "24k gold coin", "gold bullion coin", "gold coin stack", "gold coin close up"],
  },
  {
    slug: "gold-biscuits",
    kind: "collection",
    family: "gold",
    target: 100,
    queries: ["gold bar bullion", "fine gold bar", "gold biscuit bar", "gold ingot"],
  },
  {
    slug: "silver-jewellery",
    kind: "collection",
    family: "silver",
    target: 100,
    queries: [
      "silver anklet",
      "silver toe ring",
      "925 silver necklace",
      "silver bangle",
      "oxidised silver jewellery",
      "silver pendant chain",
    ],
  },
  {
    slug: "diamond-jewellery",
    kind: "collection",
    family: "diamond",
    target: 100,
    queries: [
      "diamond ring close up",
      "diamond stud earrings",
      "diamond pendant",
      "solitaire ring",
      "diamond bangle",
      "diamond necklace",
    ],
  },
  {
    slug: "fancy-jewellery",
    kind: "collection",
    family: "gold",
    target: 100,
    queries: [
      "minimal gold earrings",
      "thin gold chain necklace",
      "gold stud earrings",
      "lightweight gold bangle",
      "dainty gold ring",
    ],
  },
  {
    slug: "gems",
    kind: "collection",
    family: "gemstone",
    target: 100,
    queries: [
      "ruby ring gold",
      "emerald ring gold",
      "sapphire ring gold",
      "pearl necklace",
      "gemstone pendant gold",
      "amethyst jewellery",
    ],
  },
];

export const DESIGN_PLANS: readonly MediaPlan[] = [
  {
    slug: "bridal-necklace-sets",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold bridal necklace set", "indian gold necklace set", "gold necklace earrings set"],
  },
  {
    slug: "temple-jewellery",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["temple gold necklace", "temple jewellery gold", "gold temple pendant"],
  },
  {
    slug: "kundan-and-polki",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["kundan necklace gold", "polki gold jewellery", "kundan earrings"],
  },
  {
    slug: "jhumka-earrings",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold jhumka", "jhumka earrings gold", "gold dangle earrings"],
  },
  {
    slug: "kada-and-bangles",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold kada", "gold bangle pair", "gold bracelet bangle"],
  },
  {
    slug: "mangalsutra",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["mangalsutra gold", "black beads gold mangalsutra", "mangalsutra pendant"],
  },
  {
    slug: "chains-and-pendants",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold chain necklace", "gold pendant chain", "thin gold chain"],
  },
  {
    slug: "diamond-and-gemstone-rings",
    kind: "design",
    family: "diamond",
    target: 6,
    queries: ["diamond ring", "solitaire diamond ring", "diamond engagement ring"],
  },
  {
    slug: "silver-anklets-and-toe-rings",
    kind: "design",
    family: "silver",
    target: 6,
    queries: ["silver anklet", "silver toe ring", "silver payal"],
  },
  {
    slug: "silver-and-pearls",
    kind: "design",
    family: "silver",
    target: 6,
    queries: ["pearl necklace silver", "silver pearl jewellery", "pearl strand"],
  },
  {
    slug: "gold-coins-and-biscuits",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold coin", "gold bar", "gold biscuit"],
  },
  {
    slug: "mens-chains",
    kind: "design",
    family: "gold",
    target: 6,
    queries: ["gold chain men", "gold bracelet men", "gold curb chain"],
  },
];

export const OCCASION_PLANS: readonly MediaPlan[] = [
  {
    slug: "bridal",
    kind: "occasion",
    family: "gold",
    target: 6,
    queries: ["gold bridal jewellery", "gold necklace set bridal", "gold bridal earrings"],
  },
  {
    slug: "dhanteras-diwali",
    kind: "occasion",
    family: "gold",
    target: 6,
    queries: ["gold coin diwali", "gold jewellery festive", "gold lamp diwali"],
  },
  {
    slug: "wedding-season",
    kind: "occasion",
    family: "gold",
    target: 6,
    queries: ["gold wedding jewellery", "gold necklace wedding", "gold bangle wedding"],
  },
  {
    slug: "daily-wear",
    kind: "occasion",
    family: "gold",
    target: 6,
    queries: ["minimal gold jewellery", "daily wear gold chain", "small gold studs"],
  },
  {
    slug: "gifting",
    kind: "occasion",
    family: "gold",
    target: 6,
    queries: ["gold coin gift", "gold jewellery gift", "gold pendant gift"],
  },
];

export const PLANS: readonly MediaPlan[] = [
  ...COLLECTION_PLANS,
  ...DESIGN_PLANS,
  ...OCCASION_PLANS,
];

export const PLAN_BY_SLUG: Record<string, MediaPlan> = Object.fromEntries(
  PLANS.map((plan) => [plan.slug, plan]),
);

export type SuitabilityInput = {
  set: string;
  alt?: string | null;
  tags?: string | null;
  width: number;
  height: number;
};

export type Suitability = { ok: true } | { ok: false; reason: string };

/**
 * The gate every downloaded photograph must pass. Order matters only for the
 * message: size, then an honest description, then the reject list, then the
 * metal the set is about.
 */
export function isSuitable(input: SuitabilityInput): Suitability {
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height)) {
    return { ok: false, reason: "unknown dimensions" };
  }
  if (Math.max(input.width, input.height) < MIN_LONG_EDGE) {
    return { ok: false, reason: `long edge below ${MIN_LONG_EDGE}px` };
  }
  const text = `${input.alt ?? ""} ${input.tags ?? ""}`.trim();
  if (text.length === 0) {
    return { ok: false, reason: "no description to verify" };
  }
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reason: `rejected wording (${pattern.source})` };
    }
  }
  const plan = PLAN_BY_SLUG[input.set];
  if (!plan) return { ok: false, reason: `unknown set ${input.set}` };
  if (!FAMILY_PATTERNS[plan.family].test(text)) {
    return { ok: false, reason: `not described as ${plan.family}` };
  }
  const objects = OBJECT_PATTERNS[plan.slug] ?? JEWELLERY_OBJECTS;
  if (!objects.test(text)) {
    return { ok: false, reason: "not a photograph of jewellery" };
  }
  return { ok: true };
}

export function planTotals(): {
  collections: number;
  designs: number;
  occasions: number;
  photographs: number;
} {
  const sum = (plans: readonly MediaPlan[]) =>
    plans.reduce((total, plan) => total + plan.target, 0);
  return {
    collections: COLLECTION_PLANS.length,
    designs: DESIGN_PLANS.length,
    occasions: OCCASION_PLANS.length,
    photographs: sum(COLLECTION_PLANS) + sum(DESIGN_PLANS) + sum(OCCASION_PLANS),
  };
}

/** How many tagged photographs each set has right now. */
export function coverage(
  assets: ReadonlyArray<{ set?: string | null }>,
): Array<{ slug: string; kind: MediaKind; have: number; target: number }> {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    if (!asset.set) continue;
    counts.set(asset.set, (counts.get(asset.set) ?? 0) + 1);
  }
  return PLANS.map((plan) => ({
    slug: plan.slug,
    kind: plan.kind,
    have: counts.get(plan.slug) ?? 0,
    target: plan.target,
  }));
}

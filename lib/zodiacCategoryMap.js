/**
 * Maps EN zodiac sign names to RO category names and URL-friendly slugs.
 */

const ZODIAC_TO_RO = {
  Aries: "Berbec",
  Taurus: "Taur",
  Gemini: "Gemeni",
  Cancer: "Rac",
  Leo: "Leu",
  Virgo: "Fecioară",
  Libra: "Balanță",
  Scorpio: "Scorpion",
  Sagittarius: "Săgetător",
  Capricorn: "Capricorn",
  Aquarius: "Vărsător",
  Pisces: "Pești",
};

const ZODIAC_TO_SLUG = {
  Aries: "berbec",
  Taurus: "taur",
  Gemini: "gemeni",
  Cancer: "rac",
  Leo: "leu",
  Virgo: "fecioara",
  Libra: "balanta",
  Scorpio: "scorpion",
  Sagittarius: "sagetator",
  Capricorn: "capricorn",
  Aquarius: "varsator",
  Pisces: "pesti",
};

function normalizeSign(sign) {
  if (!sign || typeof sign !== "string") return undefined;
  const trimmed = sign.trim();
  const capitalized =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  if (ZODIAC_TO_RO[capitalized]) return capitalized;
  const upper = trimmed.toUpperCase();
  for (const key of Object.keys(ZODIAC_TO_RO)) {
    if (key.toUpperCase() === upper) return key;
  }
  return undefined;
}

function getZodiacCategorySlug(zodiacSign) {
  const key = normalizeSign(zodiacSign);
  return key ? ZODIAC_TO_SLUG[key] ?? null : null;
}

function getZodiacCategoryName(zodiacSign) {
  const key = normalizeSign(zodiacSign);
  return key ? ZODIAC_TO_RO[key] ?? null : null;
}

function isKnownZodiacSign(zodiacSign) {
  return normalizeSign(zodiacSign) !== undefined;
}

module.exports = { getZodiacCategorySlug, getZodiacCategoryName, isKnownZodiacSign };

exports.REGION_EMOJIS = [
  "🏙️","🌆","🌃","🌇","🗺️","📍","🏞️","⛰️","🌄","🌉","🏘️","🌿","🍀","🌸","✨"
];

exports.pickEmojiStable = function pickEmojiStable(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return exports.REGION_EMOJIS[hash % exports.REGION_EMOJIS.length];
};

exports.REGION_EMOJIS = [
    "🏙️", "🌆", "🌃", "🌇", "🗺️", "📍", "🏞️", "⛰️", "🌄", "🌉", "🏘️", "🌿", "🍀", "🌸", "✨"
];

// 1) Simple random (uses Math.random)
exports.pickEmojiRandom = function pickEmojiRandom() {
    const i = Math.floor(Math.random() * exports.REGION_EMOJIS.length);
    return exports.REGION_EMOJIS[i];
};

// 2) Random BUT avoid repeating the last one (optional helper)
let _lastIndex = -1;
exports.pickEmojiRandomNoRepeat = function pickEmojiRandomNoRepeat() {
    if (exports.REGION_EMOJIS.length === 1) return exports.REGION_EMOJIS[0];

    let i;
    do {
        i = Math.floor(Math.random() * exports.REGION_EMOJIS.length);
    } while (i === _lastIndex);

    _lastIndex = i;
    return exports.REGION_EMOJIS[i];
};

// 3) Seeded random (same seed => same sequence), useful for tests / reproducible runs
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

exports.createEmojiPickerSeeded = function createEmojiPickerSeeded(seedNumber) {
    const rnd = mulberry32(seedNumber >>> 0);
    return function pick() {
        const i = Math.floor(rnd() * exports.REGION_EMOJIS.length);
        return exports.REGION_EMOJIS[i];
    };
};

const { Markup } = require("telegraf");

exports.toTwoColumns = function toTwoColumns(buttonsFlat) {
    const rows = [];
    for (let i = 0; i < buttonsFlat.length; i += 2) {
        rows.push(buttonsFlat.slice(i, i + 2));
    }
    return rows;
};

exports.removeKb = () => Markup.removeKeyboard();

exports.contactKb = () =>
    Markup.keyboard([Markup.button.contactRequest("📲 Telefonni yuborish")])
        .oneTime()
        .resize();

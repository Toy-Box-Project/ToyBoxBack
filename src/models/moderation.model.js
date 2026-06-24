// src/models/moderation.model.js
const db = require("../config/db");

const takeAction = async (data) => {
    const [result] = await db.query("INSERT INTO moderation_actions SET ?", [data]);
    return result;
};

module.exports = { takeAction };

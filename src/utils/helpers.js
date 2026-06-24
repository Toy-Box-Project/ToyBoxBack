// src/utils/helpers.js

const formatDate = (date) => {
    return new Date(date).toISOString().split("T")[0];
};

const isEmpty = (value) => {
    return value === null || value === undefined || value === "";
};

const toNumber = (value) => {
    const n = Number(value);
    return isNaN(n) ? null : n;
};

module.exports = { formatDate, isEmpty, toNumber };

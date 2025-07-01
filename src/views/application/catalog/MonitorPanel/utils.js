/**
 * 字节格式化 - 可读
 * @param value
 * @returns {*|string}
 */
export function byteFormatter(value) {
    if (value === 0) {
        return value;
    }
    if (value > 1024 * 1024 * 1024) {
        return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
    if (value > 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(2)} MB`
    }
    if (value > 1024) {
        return `${(value / 1024).toFixed(2)} KB`
    }
    return `${value} b`
}

/**
 * 数量格式化
 * @param value {any|string},
 * @param format {any|string?},
 */
export function quantityFormatter({amount, format}) {
    return `${amount} ${format || ""}`;
}

// ========== Echarts ===========
import merge from 'lodash/merge';
import {baseOption} from "./constants";

export function buildOption(extendOption, series) {
    return merge({}, extendOption, baseOption, {
        series
    });
}


export function gaugeDetailLayout(size, index) {
    return [
        ((200 / (size - 1)) * index + -100) + '%',
        93 + Math.floor(index / 3) * 5 + "%"
    ];
}
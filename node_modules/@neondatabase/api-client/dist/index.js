"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = void 0;
__exportStar(require("./api.gen"), exports);
var api_gen_1 = require("./api.gen");
var createApiClient = function (config) {
    return new api_gen_1.Api(__assign(__assign({}, config), { 
        // this is will fix the issue with passing arrays as search params
        // before: ?project_ids[]=1&project_ids[]=2
        // after: ?project_ids=1,2
        paramsSerializer: function (params) {
            if (!params)
                return '';
            var parseValue = function (val) {
                if (Array.isArray(val)) {
                    return val.map(function (v) { return parseValue(v); }).join(',');
                }
                if (val instanceof Date) {
                    return val.toISOString();
                }
                if (typeof val === 'object' && val !== null) {
                    return JSON.stringify(val);
                }
                return String(val);
            };
            var entries = Object.entries(params);
            var transformedEntries = entries
                .filter(function (_a) {
                var _ = _a[0], val = _a[1];
                return val !== null && typeof val !== 'undefined';
            })
                .map(function (_a) {
                var key = _a[0], val = _a[1];
                return [key, parseValue(val)];
            });
            var searchParams = new URLSearchParams(transformedEntries);
            return searchParams.toString();
        }, headers: __assign(__assign({}, config.headers), (config.apiKey && {
            Authorization: "Bearer ".concat(config.apiKey),
        })) }));
};
exports.createApiClient = createApiClient;

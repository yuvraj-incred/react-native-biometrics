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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeBiometricsLegacy = exports.ReactNativeBiometrics = exports.BiometryTypes = void 0;
var react_native_1 = require("react-native");
var bridge = react_native_1.NativeModules.ReactNativeBiometrics;
/**
 * Enum for biometric sensor types
 */
exports.BiometryTypes = {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics'
};
var ReactNativeBiometrics = /** @class */ (function () {
    /**
     * @param options Configuration options for biometric authentication
     * @param options.allowDeviceCredentials Whether to allow device credentials as fallback
     */
    function ReactNativeBiometrics(options) {
        var _a;
        this.allowDeviceCredentials = (_a = options === null || options === void 0 ? void 0 : options.allowDeviceCredentials) !== null && _a !== void 0 ? _a : false;
    }
    /**
     * Checks if biometric sensor is available on the device
     * @returns Promise resolving to sensor availability details
     */
    ReactNativeBiometrics.prototype.isSensorAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('Using forked version of react-native-biometrics - isSensorAvailable called');
                        return [4 /*yield*/, bridge.isSensorAvailable({
                                allowDeviceCredentials: this.allowDeviceCredentials
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, {
                                available: false,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error occurred'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new public/private key pair for biometric authentication
     * @returns Promise resolving to the generated public key
     */
    ReactNativeBiometrics.prototype.createKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bridge.createKeys({
                                allowDeviceCredentials: this.allowDeviceCredentials
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        throw new Error("Failed to create keys: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if biometric keys exist on the device
     * @returns Promise resolving to key existence status
     */
    ReactNativeBiometrics.prototype.biometricKeysExist = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bridge.biometricKeysExist()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, { keysExist: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes existing biometric keys from the device
     * @returns Promise resolving to deletion status
     */
    ReactNativeBiometrics.prototype.deleteKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bridge.deleteKeys()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, { keysDeleted: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a cryptographic signature using biometric authentication
     * @param options Signature creation options
     * @returns Promise resolving to signature details
     */
    ReactNativeBiometrics.prototype.createSignature = function (options) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var signatureOptions, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        signatureOptions = __assign({ allowDeviceCredentials: this.allowDeviceCredentials, cancelButtonText: (_a = options.cancelButtonText) !== null && _a !== void 0 ? _a : 'Cancel' }, options);
                        return [4 /*yield*/, bridge.createSignature(signatureOptions)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        error_5 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : 'Failed to create signature'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Prompts user for biometric authentication
     * @param options Prompt options
     * @returns Promise resolving to authentication result
     */
    ReactNativeBiometrics.prototype.simplePrompt = function (options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var promptOptions, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        promptOptions = __assign({ allowDeviceCredentials: this.allowDeviceCredentials, cancelButtonText: (_a = options.cancelButtonText) !== null && _a !== void 0 ? _a : 'Cancel', fallbackPromptMessage: (_b = options.fallbackPromptMessage) !== null && _b !== void 0 ? _b : 'Use Passcode' }, options);
                        return [4 /*yield*/, bridge.simplePrompt(promptOptions)];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        error_6 = _c.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_6 instanceof Error ? error_6.message : 'Authentication failed'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ReactNativeBiometrics;
}());
exports.ReactNativeBiometrics = ReactNativeBiometrics;
// For backward compatibility
exports.ReactNativeBiometricsLegacy = {
    isSensorAvailable: function () { return new ReactNativeBiometrics().isSensorAvailable(); },
    createKeys: function () { return new ReactNativeBiometrics().createKeys(); },
    biometricKeysExist: function () { return new ReactNativeBiometrics().biometricKeysExist(); },
    deleteKeys: function () { return new ReactNativeBiometrics().deleteKeys(); },
    createSignature: function (options) { return new ReactNativeBiometrics().createSignature(options); },
    simplePrompt: function (options) { return new ReactNativeBiometrics().simplePrompt(options); }
};
exports.default = ReactNativeBiometrics;

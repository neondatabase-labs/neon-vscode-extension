"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const vscode = __importStar(require("vscode"));
const authService_1 = require("./authService");
class AuthManager {
    constructor(context) {
        this._isAuthenticated = false;
        this._onDidChangeAuthentication = new vscode.EventEmitter();
        this.onDidChangeAuthentication = this._onDidChangeAuthentication.event;
        this.context = context;
        this._tokenSet = this.context.globalState.get('neon.tokenSet');
        this._isAuthenticated = !!this._tokenSet;
    }
    static getInstance(context) {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager(context);
        }
        return AuthManager.instance;
    }
    get isAuthenticated() {
        return this._isAuthenticated;
    }
    get tokenSet() {
        return this._tokenSet;
    }
    async signIn() {
        try {
            const authProps = {
                oauthHost: 'https://oauth2.neon.tech',
                clientId: 'neonctl',
            };
            const tokenSet = await (0, authService_1.auth)(authProps);
            this._tokenSet = tokenSet;
            this._isAuthenticated = true;
            await this.context.globalState.update('neon.tokenSet', tokenSet);
            this._onDidChangeAuthentication.fire(true);
            vscode.window.showInformationMessage('Successfully signed in to Neon!');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to sign in: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async signOut() {
        this._tokenSet = undefined;
        this._isAuthenticated = false;
        await this.context.globalState.update('neon.tokenSet', undefined);
        this._onDidChangeAuthentication.fire(false);
        vscode.window.showInformationMessage('Signed out from Neon');
    }
    async refreshTokenIfNeeded() {
        if (!this._tokenSet || !this._tokenSet.refresh_token) {
            return false;
        }
        // Check if token is expired or about to expire (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = this._tokenSet.expires_at || 0;
        if (expiresAt - now > 300) {
            // Token is still valid for more than 5 minutes
            return true;
        }
        try {
            const authProps = {
                oauthHost: 'https://console.neon.tech',
                clientId: 'vscode-extension',
            };
            const newTokenSet = await (0, authService_1.refreshToken)(authProps, this._tokenSet);
            this._tokenSet = newTokenSet;
            await this.context.globalState.update('neon.tokenSet', newTokenSet);
            return true;
        }
        catch (error) {
            console.error('Failed to refresh token:', error);
            // If refresh fails, sign out
            await this.signOut();
            return false;
        }
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=authManager.js.map
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
exports.WelcomeViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const authManager_1 = require("../auth/authManager");
const path = __importStar(require("path"));
class WelcomeViewProvider {
    constructor(_context) {
        this._context = _context;
        this._authManager = authManager_1.AuthManager.getInstance(_context);
        // Listen for authentication changes
        this._authManager.onDidChangeAuthentication(() => {
            if (this._view) {
                this._view.webview.html = this._getHtmlForWebview();
            }
        });
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'signIn':
                    await this._authManager.signIn();
                    break;
                case 'signOut':
                    await this._authManager.signOut();
                    break;
            }
        });
    }
    _getHtmlForWebview() {
        const isAuthenticated = this._authManager.isAuthenticated;
        const nonce = this._getNonce();
        const styleResetUri = this._view?.webview.asWebviewUri(vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'reset.css')));
        const styleVSCodeUri = this._view?.webview.asWebviewUri(vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'vscode.css')));
        const styleMainUri = this._view?.webview.asWebviewUri(vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'main.css')));
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view?.webview.cspSource}; script-src 'nonce-${nonce}';">
      ${styleResetUri ? `<link href="${styleResetUri}" rel="stylesheet">` : ''}
      ${styleVSCodeUri ? `<link href="${styleVSCodeUri}" rel="stylesheet">` : ''}
      ${styleMainUri ? `<link href="${styleMainUri}" rel="stylesheet">` : ''}
      <title>Neon</title>
    </head>
    <body>
      <div class="container">
        ${isAuthenticated
            ? `<h2>Welcome to Neon VSCode Extension</h2>
             <p>You are signed in to Neon.</p>
             <button class="sign-out-button">Sign Out</button>`
            : `<h2>Neon VSCode Extension</h2>
             <p>Sign in to access your Neon projects.</p>
             <button class="sign-in-button">Sign in with Neon</button>`}
      </div>
      
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        document.querySelector('.container').addEventListener('click', (e) => {
          if (e.target.classList.contains('sign-in-button')) {
            vscode.postMessage({ command: 'signIn' });
          } else if (e.target.classList.contains('sign-out-button')) {
            vscode.postMessage({ command: 'signOut' });
          }
        });
      </script>
    </body>
    </html>`;
    }
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.WelcomeViewProvider = WelcomeViewProvider;
WelcomeViewProvider.viewType = 'neon-welcome';
//# sourceMappingURL=welcomeView.js.map
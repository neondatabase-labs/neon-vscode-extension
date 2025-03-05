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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const authManager_1 = require("./auth/authManager");
const welcomeView_1 = require("./views/welcomeView");
const neonExplorer_1 = require("./views/neonExplorer");
function activate(context) {
    console.log('Neon VSCode Extension is now active!');
    // Initialize the auth manager
    const authManager = authManager_1.AuthManager.getInstance(context);
    // Register the welcome view provider
    const welcomeViewProvider = new welcomeView_1.WelcomeViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(welcomeView_1.WelcomeViewProvider.viewType, welcomeViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    // Register the Neon Explorer tree view
    const neonExplorerProvider = new neonExplorer_1.NeonExplorerProvider(context);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('neonExplorer', neonExplorerProvider));
    // Register the sign in command
    const signInCommand = vscode.commands.registerCommand('neon-vscode-extension.signIn', async () => {
        try {
            await authManager.signIn();
            // Refresh the tree view after signing in
            neonExplorerProvider.refresh();
        }
        catch (error) {
            console.error('Sign in error:', error);
        }
    });
    // Register the sign out command
    const signOutCommand = vscode.commands.registerCommand('neon-vscode-extension.signOut', async () => {
        try {
            await authManager.signOut();
            // Refresh the tree view after signing out
            neonExplorerProvider.refresh();
        }
        catch (error) {
            console.error('Sign out error:', error);
        }
    });
    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand('neon-vscode-extension.refreshTree', () => {
        neonExplorerProvider.refresh();
    });
    context.subscriptions.push(signInCommand, signOutCommand, refreshCommand);
    // Show the welcome view when the extension is activated
    vscode.commands.executeCommand('neon-welcome.focus');
}
function deactivate() {
    // Clean up resources when the extension is deactivated
}
//# sourceMappingURL=extension.js.map
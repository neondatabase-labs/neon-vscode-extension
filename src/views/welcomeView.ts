import * as vscode from 'vscode';
import { AuthManager } from '../auth/authManager';
import * as path from 'path';

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'neon-welcome';
  private _view?: vscode.WebviewView;
  private _authManager: AuthManager;

  constructor(private readonly _context: vscode.ExtensionContext) {
    this._authManager = AuthManager.getInstance(_context);
    
    // Listen for authentication changes
    this._authManager.onDidChangeAuthentication(() => {
      if (this._view) {
        this._view.webview.html = this._getHtmlForWebview();
      }
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
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

  private _getHtmlForWebview() {
    const isAuthenticated = this._authManager.isAuthenticated;
    
    const nonce = this._getNonce();
    const styleResetUri = this._view?.webview.asWebviewUri(
      vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'reset.css'))
    );
    const styleVSCodeUri = this._view?.webview.asWebviewUri(
      vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'vscode.css'))
    );
    const styleMainUri = this._view?.webview.asWebviewUri(
      vscode.Uri.file(path.join(this._context.extensionPath, 'media', 'main.css'))
    );

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
             <button class="sign-in-button">Sign in with Neon</button>`
        }
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

  private _getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
} 
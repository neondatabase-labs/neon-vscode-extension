import * as vscode from 'vscode';
import { auth, refreshToken, TokenSet, AuthProps } from './authService';

export class AuthManager {
  private static instance: AuthManager;
  private context: vscode.ExtensionContext;
  private _isAuthenticated: boolean = false;
  private _tokenSet: TokenSet | undefined;
  private _onDidChangeAuthentication = new vscode.EventEmitter<boolean>();
  
  readonly onDidChangeAuthentication = this._onDidChangeAuthentication.event;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this._tokenSet = this.context.globalState.get<TokenSet>('neon.tokenSet');
    this._isAuthenticated = !!this._tokenSet;
  }

  static getInstance(context: vscode.ExtensionContext): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager(context);
    }
    return AuthManager.instance;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  get tokenSet(): TokenSet | undefined {
    return this._tokenSet;
  }

  async signIn(): Promise<void> {
    try {
      const authProps: AuthProps = {
        oauthHost: 'https://oauth2.neon.tech',
        clientId: 'neonctl',
      };

      const tokenSet = await auth(authProps);
      
      this._tokenSet = tokenSet;
      this._isAuthenticated = true;
      
      await this.context.globalState.update('neon.tokenSet', tokenSet);
      this._onDidChangeAuthentication.fire(true);
      
      vscode.window.showInformationMessage('Successfully signed in to Neon!');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to sign in: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this._tokenSet = undefined;
    this._isAuthenticated = false;
    
    await this.context.globalState.update('neon.tokenSet', undefined);
    this._onDidChangeAuthentication.fire(false);
    
    vscode.window.showInformationMessage('Signed out from Neon');
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
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
      const authProps: AuthProps = {
        oauthHost: 'https://console.neon.tech',
        clientId: 'vscode-extension',
      };

      const newTokenSet = await refreshToken(authProps, this._tokenSet);
      
      this._tokenSet = newTokenSet;
      await this.context.globalState.update('neon.tokenSet', newTokenSet);
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // If refresh fails, sign out
      await this.signOut();
      return false;
    }
  }
} 
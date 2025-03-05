import * as vscode from 'vscode';
import { AuthManager } from './auth/authManager';
import { WelcomeViewProvider } from './views/welcomeView';

export function activate(context: vscode.ExtensionContext) {
  console.log('Neon VSCode Extension is now active!');

  // Initialize the auth manager
  const authManager = AuthManager.getInstance(context);

  // Register the welcome view provider
  const welcomeViewProvider = new WelcomeViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WelcomeViewProvider.viewType,
      welcomeViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // Register the sign in command
  const signInCommand = vscode.commands.registerCommand('neon-vscode-extension.signIn', async () => {
    try {
      await authManager.signIn();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  });

  context.subscriptions.push(signInCommand);
  
  // Show the welcome view when the extension is activated
  vscode.commands.executeCommand('neon-welcome.focus');
}

export function deactivate() {
  // Clean up resources when the extension is deactivated
} 
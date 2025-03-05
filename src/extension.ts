import * as vscode from 'vscode';
import { AuthManager } from './auth/authManager';
import { WelcomeViewProvider } from './views/welcomeView';
import { NeonExplorerProvider } from './views/neonExplorer';

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

  // Register the Neon Explorer tree view
  const neonExplorerProvider = new NeonExplorerProvider(context);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('neonExplorer', neonExplorerProvider)
  );

  // Register the sign in command
  const signInCommand = vscode.commands.registerCommand('neon-vscode-extension.signIn', async () => {
    try {
      await authManager.signIn();
      // Refresh the tree view after signing in
      neonExplorerProvider.refresh();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  });

  // Register the sign out command
  const signOutCommand = vscode.commands.registerCommand('neon-vscode-extension.signOut', async () => {
    try {
      await authManager.signOut();
      // Refresh the tree view after signing out
      neonExplorerProvider.refresh();
    } catch (error) {
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

export function deactivate() {
  // Clean up resources when the extension is deactivated
} 
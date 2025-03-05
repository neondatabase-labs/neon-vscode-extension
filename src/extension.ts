import * as vscode from 'vscode';
import { AuthManager } from './auth/authManager';
import { WelcomeViewProvider } from './views/welcomeView';
import { NeonExplorerProvider } from './views/neonExplorer';
import { createNeonApiClient } from './api/neonClient';
import { ProjectListItem } from '@neondatabase/api-client';

// Status bar item for showing the current project
let projectStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Neon VSCode Extension is now active!');

  // Initialize the auth manager
  const authManager = AuthManager.getInstance(context);
  
  // Set initial authentication context
  vscode.commands.executeCommand(
    'setContext', 
    'neon-vscode-extension.isAuthenticated', 
    authManager.isAuthenticated
  );

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

  // Create status bar item
  projectStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  projectStatusBarItem.command = 'neon-vscode-extension.switchProject';
  context.subscriptions.push(projectStatusBarItem);

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
      updateStatusBar(context);
      // Set context for command palette visibility
      vscode.commands.executeCommand('setContext', 'neon-vscode-extension.isAuthenticated', true);
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
      // Clear the status bar
      projectStatusBarItem.hide();
      // Clear selected project
      await context.globalState.update('neon.selectedProjectId', undefined);
      await context.globalState.update('neon.selectedProjectName', undefined);
      // Set context for command palette visibility
      vscode.commands.executeCommand('setContext', 'neon-vscode-extension.isAuthenticated', false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  });

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand('neon-vscode-extension.refreshTree', () => {
    neonExplorerProvider.refresh();
    updateStatusBar(context);
  });

  // Register switch project command
  const switchProjectCommand = vscode.commands.registerCommand('neon-vscode-extension.switchProject', async () => {
    try {
      const isAuthenticated = await authManager.isAuthenticated;
      if (!isAuthenticated) {
        vscode.window.showInformationMessage('Please sign in to Neon first');
        return;
      }

      await authManager.refreshTokenIfNeeded();
      const tokenSet = authManager.tokenSet;
      
      if (!tokenSet) {
        throw new Error('No valid token available');
      }
      
      // Create API client and fetch projects
      const neonClient = createNeonApiClient(tokenSet);
      const response = await neonClient.listProjects({});
      
      // Extract projects from the response data
      const projects = response.data.projects;
      
      if (!projects || projects.length === 0) {
        vscode.window.showInformationMessage('No projects found in your Neon account');
        return;
      }

      // Create QuickPick items from projects
      const projectItems = projects.map((project: ProjectListItem) => ({
        label: project.name,
        description: `ID: ${project.id}, Region: ${project.region_id}`,
        project: project
      }));

      // Show QuickPick to select a project
      const selectedItem = await vscode.window.showQuickPick(projectItems, {
        placeHolder: 'Select a Neon project'
      });

      if (selectedItem) {
        // Save the selected project to global state
        await context.globalState.update('neon.selectedProjectId', selectedItem.project.id);
        await context.globalState.update('neon.selectedProjectName', selectedItem.project.name);
        
        // Update status bar and refresh tree view
        updateStatusBar(context);
        neonExplorerProvider.refresh();
        
        vscode.window.showInformationMessage(`Switched to project: ${selectedItem.project.name}`);
      }
    } catch (error) {
      console.error('Error switching project:', error);
      vscode.window.showErrorMessage(`Failed to switch project: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register select project from tree view command
  const selectProjectCommand = vscode.commands.registerCommand('neon-vscode-extension.selectProject', async (projectId: string, projectName: string) => {
    await context.globalState.update('neon.selectedProjectId', projectId);
    await context.globalState.update('neon.selectedProjectName', projectName);
    
    // Update status bar and refresh tree view
    updateStatusBar(context);
    neonExplorerProvider.refresh();
    
    vscode.window.showInformationMessage(`Switched to project: ${projectName}`);
  });

  context.subscriptions.push(signInCommand, signOutCommand, refreshCommand, switchProjectCommand, selectProjectCommand);
  
  // Show the welcome view when the extension is activated
  vscode.commands.executeCommand('neon-welcome.focus');
  
  // Update status bar on activation
  updateStatusBar(context);
}

// Function to update the status bar with the current project
async function updateStatusBar(context: vscode.ExtensionContext) {
  const authManager = AuthManager.getInstance(context);
  const isAuthenticated = await authManager.isAuthenticated;
  
  if (!isAuthenticated) {
    projectStatusBarItem.hide();
    return;
  }
  
  const projectName = context.globalState.get<string>('neon.selectedProjectName');
  
  if (projectName) {
    projectStatusBarItem.text = `$(database) Neon: ${projectName}`;
    projectStatusBarItem.tooltip = 'Click to switch Neon project';
    projectStatusBarItem.show();
  } else {
    projectStatusBarItem.text = '$(database) Neon: No project selected';
    projectStatusBarItem.tooltip = 'Click to select a Neon project';
    projectStatusBarItem.show();
  }
}

export function deactivate() {
  // Clean up resources when the extension is deactivated
  if (projectStatusBarItem) {
    projectStatusBarItem.dispose();
  }
} 
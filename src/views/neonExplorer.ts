import * as vscode from 'vscode';
import { AuthManager } from '../auth/authManager';
import { createNeonApiClient } from '../api/neonClient';
import { ProjectListItem } from '@neondatabase/api-client';

export class NeonExplorerProvider implements vscode.TreeDataProvider<NeonTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<NeonTreeItem | undefined | null> = new vscode.EventEmitter<NeonTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<NeonTreeItem | undefined | null> = this._onDidChangeTreeData.event;
  
  constructor(private context: vscode.ExtensionContext) {
    // Refresh the tree view when authentication state changes
    const authManager = AuthManager.getInstance(this.context);
    authManager.onDidChangeAuthentication(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: NeonTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: NeonTreeItem): Promise<NeonTreeItem[]> {
    const authManager = AuthManager.getInstance(this.context);
    const isAuthenticated = await authManager.isAuthenticated;
    
    // If not authenticated, show sign-in option
    if (!isAuthenticated) {
      return [new NeonTreeItem('Sign in to Neon', 'signin', vscode.TreeItemCollapsibleState.None)];
    }
    
    // If this is the root level and we're authenticated
    if (!element) {
      return [
        new NeonTreeItem('Projects', 'projects', vscode.TreeItemCollapsibleState.Collapsed),
        new NeonTreeItem('Sign Out', 'signout', vscode.TreeItemCollapsibleState.None)
      ];
    }
    
    // Handle child items based on parent
    if (element.id === 'projects') {
      try {
        // Ensure token is refreshed if needed
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
          return [new NeonTreeItem('No projects found', 'no-projects', vscode.TreeItemCollapsibleState.None)];
        }
        
        // Map projects to tree items
        return projects.map((project: ProjectListItem) => {
          const treeItem = new NeonTreeItem(
            project.name, 
            `project-${project.id}`, 
            vscode.TreeItemCollapsibleState.None
          );
          
          // Store project data in the context value for later use
          treeItem.tooltip = `Project ID: ${project.id}\nRegion: ${project.region_id}\nCreated: ${new Date(project.created_at).toLocaleDateString()}`;
          treeItem.contextValue = 'project';
          
          return treeItem;
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
        vscode.window.showErrorMessage(`Failed to fetch Neon projects: ${error instanceof Error ? error.message : String(error)}`);
        return [new NeonTreeItem('Error fetching projects', 'error', vscode.TreeItemCollapsibleState.None)];
      }
    }
    
    return [];
  }
}

export class NeonTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = label;
    this.id = id;
    
    // Set command for clickable items
    if (id === 'signin') {
      this.command = {
        command: 'neon.signIn',
        title: 'Sign In'
      };
    } else if (id === 'signout') {
      this.command = {
        command: 'neon.signOut',
        title: 'Sign Out'
      };
    }
  }
}
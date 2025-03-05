import * as vscode from 'vscode';
import { AuthManager } from '../auth/authManager';
import { createNeonApiClient } from '../api/neonClient';
import { ProjectListItem } from '@neondatabase/api-client';

// Define the branch interface since it's not exported from the API client
interface ProjectBranchListItem {
  id: string;
  name: string;
  created_at: string;
  // Add other properties as needed
}

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
      const selectedProjectId = this.context.globalState.get<string>('neon.selectedProjectId');
      const selectedProjectName = this.context.globalState.get<string>('neon.selectedProjectName');
      
      const items: NeonTreeItem[] = [];
      
      // If a project is selected, show its branches
      if (selectedProjectId && selectedProjectName) {
        const projectItem = new NeonTreeItem(
          `Current Project: ${selectedProjectName}`,
          'current-project',
          vscode.TreeItemCollapsibleState.Collapsed
        );
        projectItem.tooltip = `Project ID: ${selectedProjectId}\nName: ${selectedProjectName}`;
        projectItem.contextValue = 'current-project';
        items.push(projectItem);
      }
      
      items.push(new NeonTreeItem('Sign Out', 'signout', vscode.TreeItemCollapsibleState.None));
      return items;
    }
    
    // Handle child items based on parent
    if (element.id === 'current-project') {
      try {
        // Get the selected project ID
        const projectId = this.context.globalState.get<string>('neon.selectedProjectId');
        
        if (!projectId) {
          return [new NeonTreeItem('No project selected', 'no-project-selected', vscode.TreeItemCollapsibleState.None)];
        }
        
        // Ensure token is refreshed if needed
        await authManager.refreshTokenIfNeeded();
        const tokenSet = authManager.tokenSet;
        
        if (!tokenSet) {
          throw new Error('No valid token available');
        }
        
        // Create API client and fetch branches for the selected project
        const neonClient = createNeonApiClient(tokenSet);
        const response = await neonClient.listProjectBranches({
          projectId: projectId,
        });
        
        // Extract branches from the response data
        const branches = response.data.branches;
        
        if (!branches || branches.length === 0) {
          return [new NeonTreeItem('No branches found', 'no-branches', vscode.TreeItemCollapsibleState.None)];
        }
        
        // Map branches to tree items
        return branches.map((branch: ProjectBranchListItem) => {
          const treeItem = new NeonTreeItem(
            branch.name, 
            `branch-${branch.id}`, 
            vscode.TreeItemCollapsibleState.None
          );
          
          // Store branch data in the context value for later use
          treeItem.tooltip = `Branch ID: ${branch.id}\nCreated: ${new Date(branch.created_at).toLocaleDateString()}`;
          treeItem.contextValue = 'branch';
          
          return treeItem;
        });
      } catch (error) {
        console.error('Error fetching branches:', error);
        vscode.window.showErrorMessage(`Failed to fetch Neon branches: ${error instanceof Error ? error.message : String(error)}`);
        return [new NeonTreeItem('Error fetching branches', 'error', vscode.TreeItemCollapsibleState.None)];
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
        command: 'neon-vscode-extension.signIn',
        title: 'Sign In'
      };
    } else if (id === 'signout') {
      this.command = {
        command: 'neon-vscode-extension.signOut',
        title: 'Sign Out'
      };
    }
  }
}
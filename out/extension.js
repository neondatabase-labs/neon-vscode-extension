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
const neonClient_1 = require("./api/neonClient");
const api_client_1 = require("@neondatabase/api-client");
// Status bar item for showing the current project
let projectStatusBarItem;
function activate(context) {
    console.log('Neon VSCode Extension is now active!');
    // Initialize the auth manager
    const authManager = authManager_1.AuthManager.getInstance(context);
    // Set initial authentication context
    vscode.commands.executeCommand('setContext', 'neon-vscode-extension.isAuthenticated', authManager.isAuthenticated);
    // Register the welcome view provider
    const welcomeViewProvider = new welcomeView_1.WelcomeViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(welcomeView_1.WelcomeViewProvider.viewType, welcomeViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    // Create status bar item
    projectStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    projectStatusBarItem.command = 'neon-vscode-extension.switchProject';
    context.subscriptions.push(projectStatusBarItem);
    // Register the Neon Explorer tree view
    const neonExplorerProvider = new neonExplorer_1.NeonExplorerProvider(context);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('neonExplorer', neonExplorerProvider));
    // Register the sign in command
    const signInCommand = vscode.commands.registerCommand('neon-vscode-extension.signIn', async () => {
        try {
            await authManager.signIn();
            // Refresh the tree view after signing in
            neonExplorerProvider.refresh();
            updateStatusBar(context);
            // Set context for command palette visibility
            vscode.commands.executeCommand('setContext', 'neon-vscode-extension.isAuthenticated', true);
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
            // Clear the status bar
            projectStatusBarItem.hide();
            // Clear selected project
            await context.globalState.update('neon.selectedProjectId', undefined);
            await context.globalState.update('neon.selectedProjectName', undefined);
            // Set context for command palette visibility
            vscode.commands.executeCommand('setContext', 'neon-vscode-extension.isAuthenticated', false);
        }
        catch (error) {
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
            const neonClient = (0, neonClient_1.createNeonApiClient)(tokenSet);
            const response = await neonClient.listProjects({});
            // Extract projects from the response data
            const projects = response.data.projects;
            if (!projects || projects.length === 0) {
                vscode.window.showInformationMessage('No projects found in your Neon account');
                return;
            }
            // Create QuickPick items from projects
            const projectItems = projects.map((project) => ({
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
        }
        catch (error) {
            console.error('Error switching project:', error);
            vscode.window.showErrorMessage(`Failed to switch project: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    // Register select project from tree view command
    const selectProjectCommand = vscode.commands.registerCommand('neon-vscode-extension.selectProject', async (projectId, projectName) => {
        await context.globalState.update('neon.selectedProjectId', projectId);
        await context.globalState.update('neon.selectedProjectName', projectName);
        // Update status bar and refresh tree view
        updateStatusBar(context);
        neonExplorerProvider.refresh();
        vscode.window.showInformationMessage(`Switched to project: ${projectName}`);
    });
    // Register create branch command
    const createBranchCommand = vscode.commands.registerCommand('neon-vscode-extension.createBranch', async () => {
        try {
            const isAuthenticated = await authManager.isAuthenticated;
            if (!isAuthenticated) {
                vscode.window.showInformationMessage('Please sign in to Neon first');
                return;
            }
            // Get the selected project ID
            const projectId = context.globalState.get('neon.selectedProjectId');
            if (!projectId) {
                vscode.window.showInformationMessage('No project selected');
                return;
            }
            // Prompt user for branch name
            const branchName = await vscode.window.showInputBox({
                placeHolder: 'Enter branch name',
                prompt: 'Enter a name for the new branch',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Branch name cannot be empty';
                    }
                    return null;
                }
            });
            if (!branchName) {
                // User cancelled the input
                return;
            }
            // Ensure token is refreshed if needed
            await authManager.refreshTokenIfNeeded();
            const tokenSet = authManager.tokenSet;
            if (!tokenSet) {
                throw new Error('No valid token available');
            }
            // Create API client and create branch
            const neonClient = (0, neonClient_1.createNeonApiClient)(tokenSet);
            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Creating branch '${branchName}'...`,
                cancellable: false
            }, async () => {
                const response = await neonClient.createProjectBranch(projectId, {
                    branch: {
                        name: branchName,
                    },
                    endpoints: [
                        {
                            type: api_client_1.EndpointType.ReadWrite,
                            autoscaling_limit_min_cu: 0.25,
                            autoscaling_limit_max_cu: 0.25,
                            provisioner: 'k8s-neonvm',
                        },
                    ],
                });
                // Refresh the tree view to show the new branch
                neonExplorerProvider.refresh();
                vscode.window.showInformationMessage(`Branch '${branchName}' created successfully`);
            });
        }
        catch (error) {
            console.error('Error creating branch:', error);
            vscode.window.showErrorMessage(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    context.subscriptions.push(signInCommand, signOutCommand, refreshCommand, switchProjectCommand, selectProjectCommand, createBranchCommand);
    // Show the welcome view when the extension is activated
    vscode.commands.executeCommand('neon-welcome.focus');
    // Update status bar on activation
    updateStatusBar(context);
}
// Function to update the status bar with the current project
async function updateStatusBar(context) {
    const authManager = authManager_1.AuthManager.getInstance(context);
    const isAuthenticated = await authManager.isAuthenticated;
    if (!isAuthenticated) {
        projectStatusBarItem.hide();
        return;
    }
    const projectName = context.globalState.get('neon.selectedProjectName');
    if (projectName) {
        projectStatusBarItem.text = `$(database) Neon: ${projectName}`;
        projectStatusBarItem.tooltip = 'Click to switch Neon project';
        projectStatusBarItem.show();
    }
    else {
        projectStatusBarItem.text = '$(database) Neon: No project selected';
        projectStatusBarItem.tooltip = 'Click to select a Neon project';
        projectStatusBarItem.show();
    }
}
function deactivate() {
    // Clean up resources when the extension is deactivated
    if (projectStatusBarItem) {
        projectStatusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map
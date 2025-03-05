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
exports.NeonTreeItem = exports.NeonExplorerProvider = void 0;
const vscode = __importStar(require("vscode"));
const authManager_1 = require("../auth/authManager");
const neonClient_1 = require("../api/neonClient");
class NeonExplorerProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        // Refresh the tree view when authentication state changes
        const authManager = authManager_1.AuthManager.getInstance(this.context);
        authManager.onDidChangeAuthentication(() => {
            this.refresh();
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        const authManager = authManager_1.AuthManager.getInstance(this.context);
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
                const neonClient = (0, neonClient_1.createNeonApiClient)(tokenSet);
                const response = await neonClient.listProjects({});
                // Extract projects from the response data
                const projects = response.data.projects;
                if (!projects || projects.length === 0) {
                    return [new NeonTreeItem('No projects found', 'no-projects', vscode.TreeItemCollapsibleState.None)];
                }
                // Map projects to tree items
                return projects.map((project) => {
                    const treeItem = new NeonTreeItem(project.name, `project-${project.id}`, vscode.TreeItemCollapsibleState.None);
                    // Store project data in the context value for later use
                    treeItem.tooltip = `Project ID: ${project.id}\nRegion: ${project.region_id}\nCreated: ${new Date(project.created_at).toLocaleDateString()}`;
                    treeItem.contextValue = 'project';
                    return treeItem;
                });
            }
            catch (error) {
                console.error('Error fetching projects:', error);
                vscode.window.showErrorMessage(`Failed to fetch Neon projects: ${error instanceof Error ? error.message : String(error)}`);
                return [new NeonTreeItem('Error fetching projects', 'error', vscode.TreeItemCollapsibleState.None)];
            }
        }
        return [];
    }
}
exports.NeonExplorerProvider = NeonExplorerProvider;
class NeonTreeItem extends vscode.TreeItem {
    constructor(label, id, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.id = id;
        this.collapsibleState = collapsibleState;
        this.tooltip = label;
        this.id = id;
        // Set command for clickable items
        if (id === 'signin') {
            this.command = {
                command: 'neon.signIn',
                title: 'Sign In'
            };
        }
        else if (id === 'signout') {
            this.command = {
                command: 'neon.signOut',
                title: 'Sign Out'
            };
        }
    }
}
exports.NeonTreeItem = NeonTreeItem;
//# sourceMappingURL=neonExplorer.js.map
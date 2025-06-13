import * as vscode from 'vscode';
import { SSHConfigManager } from './sshConfigManager';
import { SSHConfig } from './types';

export class SSHHostProvider implements vscode.TreeDataProvider<SSHHostItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SSHHostItem | undefined | null | void> = new vscode.EventEmitter<SSHHostItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SSHHostItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private configManager: SSHConfigManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SSHHostItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SSHHostItem): Promise<SSHHostItem[]> {
        if (!element) {
            const hosts = await this.configManager.getHosts();
            return hosts.map(host => new SSHHostItem(host));
        }
        return [];
    }
}

class SSHHostItem extends vscode.TreeItem {
    constructor(public readonly config: SSHConfig) {
        super(config.name, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${config.user}@${config.host}:${config.port || 22}`;
        this.description = `${config.user}@${config.host}`;
        
        this.command = {
            command: 'openremotessh.connectToHost',
            title: 'Connect',
            arguments: [config]
        };

        this.contextValue = 'sshHost';
    }
}
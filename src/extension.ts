import * as vscode from 'vscode';
import { SSHConnectionManager } from './sshConnectionManager';
import { RemoteFileSystemProvider } from './remoteFileSystemProvider';
import { SSHHostProvider } from './sshHostProvider';
import { SSHConfigManager } from './sshConfigManager';
import { RemoteTerminalProvider } from './remoteTerminalProvider';

let connectionManager: SSHConnectionManager;
let fileSystemProvider: RemoteFileSystemProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Open Remote SSH extension is now active!');

    connectionManager = new SSHConnectionManager(context);
    fileSystemProvider = new RemoteFileSystemProvider(connectionManager);
    
    const sshConfigManager = new SSHConfigManager();
    const hostProvider = new SSHHostProvider(sshConfigManager);
    const terminalProvider = new RemoteTerminalProvider(connectionManager);

    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('openssh', fileSystemProvider, { 
            isCaseSensitive: true,
            isReadonly: false
        })
    );

    context.subscriptions.push(
        vscode.window.createTreeView('sshHosts', {
            treeDataProvider: hostProvider,
            showCollapseAll: true
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.connect', async () => {
            try {
                const hosts = await sshConfigManager.getHosts();
                const hostLabels = hosts.map(h => ({
                    label: h.name,
                    description: `${h.user}@${h.host}:${h.port || 22}`,
                    host: h
                }));

                const selected = await vscode.window.showQuickPick(hostLabels, {
                    placeHolder: 'Select SSH host to connect'
                });

                if (selected) {
                    const password = await vscode.window.showInputBox({
                        prompt: `Enter password for ${selected.host.user}@${selected.host.host}`,
                        password: true,
                        ignoreFocusOut: true
                    });

                    if (password !== undefined) {
                        await connectionManager.connect({
                            ...selected.host,
                            password
                        });

                        // Show folder picker for remote folder
                        const folderPath = await vscode.window.showInputBox({
                            prompt: 'Enter remote folder path to open (e.g., /home/user)',
                            value: '/home/' + selected.host.user,
                            ignoreFocusOut: true
                        });

                        if (folderPath) {
                            const remoteUri = vscode.Uri.parse(`openssh://${selected.host.name}${folderPath}`);
                            await vscode.commands.executeCommand('vscode.openFolder', remoteUri);
                        }
                        
                        vscode.window.showInformationMessage(`Connected to ${selected.host.name}`);
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Connection failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.disconnect', async () => {
            const activeHost = connectionManager.getActiveConnection();
            if (activeHost) {
                await connectionManager.disconnect(activeHost);
                vscode.window.showInformationMessage(`Disconnected from ${activeHost}`);
            } else {
                vscode.window.showWarningMessage('No active SSH connection');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.settings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'remote-ssh');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.showLog', () => {
            connectionManager.showLog();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.connectToHost', async (config) => {
            try {
                const password = await vscode.window.showInputBox({
                    prompt: `Enter password for ${config.user}@${config.host}`,
                    password: true,
                    ignoreFocusOut: true
                });

                if (password !== undefined) {
                    await connectionManager.connect({
                        ...config,
                        password
                    });

                    // Show folder picker for remote folder
                    const folderPath = await vscode.window.showInputBox({
                        prompt: 'Enter remote folder path to open (e.g., /home/user)',
                        value: '/home/' + config.user,
                        ignoreFocusOut: true
                    });

                    if (folderPath) {
                        const remoteUri = vscode.Uri.parse(`openssh://${config.name}${folderPath}`);
                        await vscode.commands.executeCommand('vscode.openFolder', remoteUri);
                    }
                    
                    vscode.window.showInformationMessage(`Connected to ${config.name}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Connection failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openremotessh.openTerminal', async () => {
            const activeHost = connectionManager.getActiveConnection();
            if (activeHost) {
                terminalProvider.createTerminal(activeHost);
            } else {
                vscode.window.showWarningMessage('No active SSH connection');
            }
        })
    );
}

export function deactivate() {
    // Clean up all connections
    if (connectionManager) {
        connectionManager.disconnectAll();
    }
    
    // Dispose of file system provider
    if (fileSystemProvider) {
        fileSystemProvider.dispose();
    }
    
    // Clear any stored state
    console.log('Open Remote SSH extension deactivated and cleaned up');
}
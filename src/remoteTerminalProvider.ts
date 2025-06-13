import * as vscode from 'vscode';
import { Client } from 'ssh2';
import { SSHConnectionManager } from './sshConnectionManager';

export class RemoteTerminalProvider {
    constructor(private connectionManager: SSHConnectionManager) {
        vscode.window.onDidOpenTerminal((terminal) => {
            if (terminal.creationOptions && 'pty' in terminal.creationOptions) {
                const pty = terminal.creationOptions.pty;
                if (pty instanceof RemoteTerminal) {
                    pty.setTerminal(terminal);
                }
            }
        });
    }

    createTerminal(hostName: string): vscode.Terminal {
        const connection = this.connectionManager.getConnection(hostName);
        if (!connection) {
            throw new Error(`No active connection to ${hostName}`);
        }

        const pty = new RemoteTerminal(connection, hostName);
        const terminal = vscode.window.createTerminal({
            name: `SSH: ${hostName}`,
            pty
        });

        return terminal;
    }
}

class RemoteTerminal implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    
    private closeEmitter = new vscode.EventEmitter<number | void>();
    onDidClose?: vscode.Event<number | void> = this.closeEmitter.event;
    
    private changeNameEmitter = new vscode.EventEmitter<string>();
    onDidChangeName?: vscode.Event<string> = this.changeNameEmitter.event;

    private stream: any;
    private terminal?: vscode.Terminal;

    constructor(private connection: Client, private hostName: string) {}

    setTerminal(terminal: vscode.Terminal): void {
        this.terminal = terminal;
    }

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.connection.shell({ 
            term: 'xterm-256color',
            cols: initialDimensions?.columns || 80,
            rows: initialDimensions?.rows || 24
        }, (err, stream) => {
            if (err) {
                this.writeEmitter.fire(`Error: ${err.message}\r\n`);
                this.closeEmitter.fire(1);
                return;
            }

            this.stream = stream;

            stream.on('data', (data: Buffer) => {
                this.writeEmitter.fire(data.toString());
            });

            stream.on('close', () => {
                this.closeEmitter.fire();
            });

            stream.stderr.on('data', (data: Buffer) => {
                this.writeEmitter.fire(data.toString());
            });
        });
    }

    close(): void {
        if (this.stream) {
            this.stream.close();
        }
    }

    handleInput(data: string): void {
        if (this.stream) {
            this.stream.write(data);
        }
    }

    setDimensions(dimensions: vscode.TerminalDimensions): void {
        if (this.stream && this.stream.setWindow) {
            this.stream.setWindow(dimensions.rows, dimensions.columns, 0, 0);
        }
    }
}
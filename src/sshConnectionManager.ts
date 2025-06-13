import * as vscode from 'vscode';
import { Client } from 'ssh2';
import { SSHConfig } from './types';

export class SSHConnectionManager {
    private connections: Map<string, Client> = new Map();
    private activeConnection: string | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Remote SSH');
    }

    async connect(config: SSHConfig): Promise<Client> {
        const connectionId = `${config.user}@${config.host}:${config.port || 22}`;
        
        if (this.connections.has(connectionId)) {
            const existingConn = this.connections.get(connectionId)!;
            this.activeConnection = connectionId;
            return existingConn;
        }

        return new Promise((resolve, reject) => {
            const conn = new Client();
            
            conn.on('ready', () => {
                this.log(`Connected to ${connectionId}`);
                this.connections.set(connectionId, conn);
                this.activeConnection = connectionId;
                resolve(conn);
            });

            conn.on('error', (err) => {
                this.log(`Connection error for ${connectionId}: ${err.message}`);
                reject(err);
            });

            conn.on('close', () => {
                this.log(`Connection closed for ${connectionId}`);
                this.connections.delete(connectionId);
                if (this.activeConnection === connectionId) {
                    this.activeConnection = null;
                }
            });

            const timeout = vscode.workspace.getConfiguration('remote-ssh').get<number>('connectTimeout', 15000);

            const connectConfig: any = {
                host: config.host,
                port: config.port || 22,
                username: config.user,
                readyTimeout: timeout,
                keepaliveInterval: 10000,
                keepaliveCountMax: 3
            };

            if (config.password) {
                connectConfig.password = config.password;
            } else if (config.privateKey) {
                connectConfig.privateKey = config.privateKey;
            }

            this.log(`Connecting to ${connectionId}...`);
            conn.connect(connectConfig);
        });
    }

    getConnection(hostName: string): Client | undefined {
        for (const [key, conn] of this.connections.entries()) {
            if (key.includes(hostName)) {
                return conn;
            }
        }
        return undefined;
    }

    getActiveConnection(): string | null {
        return this.activeConnection;
    }

    async disconnect(connectionId: string): Promise<void> {
        const conn = this.connections.get(connectionId);
        if (conn) {
            conn.end();
            this.connections.delete(connectionId);
            if (this.activeConnection === connectionId) {
                this.activeConnection = null;
            }
        }
    }

    disconnectAll(): void {
        for (const [id, conn] of this.connections.entries()) {
            conn.end();
        }
        this.connections.clear();
        this.activeConnection = null;
    }

    showLog(): void {
        this.outputChannel.show();
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SSHConfig } from './types';

export class SSHConfigManager {
    private configPath: string;

    constructor() {
        const configFile = vscode.workspace.getConfiguration('remote-ssh').get<string>('configFile', '~/.ssh/config');
        this.configPath = this.expandPath(configFile);
    }

    private expandPath(filePath: string): string {
        if (filePath.startsWith('~')) {
            return path.join(os.homedir(), filePath.slice(1));
        }
        return filePath;
    }

    async getHosts(): Promise<SSHConfig[]> {
        const hosts: SSHConfig[] = [];

        try {
            if (!fs.existsSync(this.configPath)) {
                return hosts;
            }

            const content = fs.readFileSync(this.configPath, 'utf8');
            const lines = content.split('\n');
            
            let currentHost: Partial<SSHConfig> | null = null;

            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('#') || trimmed === '') {
                    continue;
                }

                const match = trimmed.match(/^(\w+)\s+(.+)$/);
                if (!match) {
                    continue;
                }

                const [, key, value] = match;
                const lowerKey = key.toLowerCase();

                if (lowerKey === 'host') {
                    if (currentHost && currentHost.name && currentHost.host && currentHost.user) {
                        hosts.push(currentHost as SSHConfig);
                    }
                    currentHost = { name: value };
                } else if (currentHost) {
                    switch (lowerKey) {
                        case 'hostname':
                            currentHost.host = value;
                            break;
                        case 'user':
                            currentHost.user = value;
                            break;
                        case 'port':
                            currentHost.port = parseInt(value, 10);
                            break;
                        case 'identityfile':
                            currentHost.privateKey = this.expandPath(value);
                            break;
                    }
                }
            }

            if (currentHost && currentHost.name && currentHost.host && currentHost.user) {
                hosts.push(currentHost as SSHConfig);
            }

            const manualHost: SSHConfig = {
                name: 'Manual Connection',
                host: 'Enter hostname',
                user: 'Enter username'
            };
            hosts.unshift(manualHost);

        } catch (error) {
            console.error('Error reading SSH config:', error);
        }

        return hosts;
    }

    async saveHost(config: SSHConfig): Promise<void> {
        const configDir = path.dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        let content = '';
        if (fs.existsSync(this.configPath)) {
            content = fs.readFileSync(this.configPath, 'utf8');
            if (!content.endsWith('\n')) {
                content += '\n';
            }
        }

        content += `\nHost ${config.name}\n`;
        content += `    HostName ${config.host}\n`;
        content += `    User ${config.user}\n`;
        
        if (config.port && config.port !== 22) {
            content += `    Port ${config.port}\n`;
        }
        
        if (config.privateKey) {
            content += `    IdentityFile ${config.privateKey}\n`;
        }

        fs.writeFileSync(this.configPath, content);
    }
}
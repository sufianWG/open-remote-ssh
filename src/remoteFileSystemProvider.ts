import * as vscode from 'vscode';
import { Client, SFTPWrapper } from 'ssh2';
import * as path from 'path';
import { SSHConnectionManager } from './sshConnectionManager';

export class RemoteFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    constructor(private connectionManager: SSHConnectionManager) {}

    private async getSFTP(uri: vscode.Uri): Promise<SFTPWrapper> {
        const hostName = uri.authority;
        const connection = this.connectionManager.getConnection(hostName);
        
        if (!connection) {
            throw vscode.FileSystemError.Unavailable(`No connection to ${hostName}`);
        }

        return new Promise((resolve, reject) => {
            connection.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(sftp);
                }
            });
        });
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        return new Promise((resolve, reject) => {
            sftp.stat(remotePath, (err: any, stats) => {
                if (err) {
                    if (err.code === 2) {
                        reject(vscode.FileSystemError.FileNotFound(uri));
                    } else {
                        reject(err);
                    }
                    return;
                }

                const type = stats.isDirectory() ? vscode.FileType.Directory :
                           stats.isFile() ? vscode.FileType.File :
                           stats.isSymbolicLink() ? vscode.FileType.SymbolicLink :
                           vscode.FileType.Unknown;

                resolve({
                    type,
                    ctime: stats.mtime * 1000,
                    mtime: stats.mtime * 1000,
                    size: stats.size
                });
            });
        });
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        return new Promise((resolve, reject) => {
            sftp.readdir(remotePath, (err, list) => {
                if (err) {
                    reject(err);
                    return;
                }

                const result: [string, vscode.FileType][] = list.map(item => {
                    const type = item.attrs.isDirectory() ? vscode.FileType.Directory :
                               item.attrs.isFile() ? vscode.FileType.File :
                               item.attrs.isSymbolicLink() ? vscode.FileType.SymbolicLink :
                               vscode.FileType.Unknown;
                    
                    return [item.filename, type];
                });

                resolve(result);
            });
        });
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        return new Promise((resolve, reject) => {
            sftp.mkdir(remotePath, (err: any) => {
                if (err) {
                    if (err.code === 4) {
                        reject(vscode.FileSystemError.FileExists(uri));
                    } else {
                        reject(err);
                    }
                    return;
                }
                resolve();
            });
        });
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = sftp.createReadStream(remotePath);

            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            stream.on('error', (err: any) => {
                if (err.code === 2) {
                    reject(vscode.FileSystemError.FileNotFound(uri));
                } else {
                    reject(err);
                }
            });
        });
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        const exists = await this.exists(sftp, remotePath);

        if (!options.create && !exists) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        if (options.create && !options.overwrite && exists) {
            throw vscode.FileSystemError.FileExists(uri);
        }

        return new Promise((resolve, reject) => {
            const stream = sftp.createWriteStream(remotePath);

            stream.on('finish', () => {
                resolve();
            });

            stream.on('error', (err: any) => {
                reject(err);
            });

            stream.write(content);
            stream.end();
        });
    }

    async delete(uri: vscode.Uri, options: { recursive: boolean; }): Promise<void> {
        const sftp = await this.getSFTP(uri);
        const remotePath = uri.path;

        const stats = await this.stat(uri);

        if (stats.type === vscode.FileType.Directory) {
            if (options.recursive) {
                await this.deleteRecursive(sftp, remotePath);
            } else {
                return new Promise((resolve, reject) => {
                    sftp.rmdir(remotePath, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        } else {
            return new Promise((resolve, reject) => {
                sftp.unlink(remotePath, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        const sftp = await this.getSFTP(oldUri);
        const oldPath = oldUri.path;
        const newPath = newUri.path;

        if (!options.overwrite) {
            const exists = await this.exists(sftp, newPath);
            if (exists) {
                throw vscode.FileSystemError.FileExists(newUri);
            }
        }

        return new Promise((resolve, reject) => {
            sftp.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private async exists(sftp: SFTPWrapper, remotePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            sftp.stat(remotePath, (err) => {
                resolve(!err);
            });
        });
    }

    private async deleteRecursive(sftp: SFTPWrapper, remotePath: string): Promise<void> {
        const entries = await this.readdirPromise(sftp, remotePath);

        for (const entry of entries) {
            const fullPath = path.posix.join(remotePath, entry.filename);
            
            if (entry.attrs.isDirectory()) {
                await this.deleteRecursive(sftp, fullPath);
                await this.rmdirPromise(sftp, fullPath);
            } else {
                await this.unlinkPromise(sftp, fullPath);
            }
        }

        await this.rmdirPromise(sftp, remotePath);
    }

    private readdirPromise(sftp: SFTPWrapper, path: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            sftp.readdir(path, (err, list) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(list);
                }
            });
        });
    }

    private rmdirPromise(sftp: SFTPWrapper, path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            sftp.rmdir(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private unlinkPromise(sftp: SFTPWrapper, path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            sftp.unlink(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
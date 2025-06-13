export interface SSHConfig {
    name: string;
    host: string;
    port?: number;
    user: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

export interface RemoteFile {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size: number;
    mtime: Date;
    permissions: string;
}
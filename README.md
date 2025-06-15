# Open Remote - SSH

![Open Remote SSH](https://raw.githubusercontent.com/sufianWG/open-remote-ssh/master/docs/images/open-remote-ssh.gif)

## Remote - SSH for PearAI (v1.0.0)

This is a **drop-in replacement** for Microsoft's Remote-SSH extension specifically designed for **PearAI**, **Cursor**, **VSCodium**, and other VS Code forks that cannot use Microsoft's proprietary Remote-SSH extension.

### Key Features:
- **Full Compatibility**: Works exactly like Microsoft's Remote-SSH extension
- **No License Restrictions**: Works on any VS Code fork including PearAI
- **Complete Functionality**: SSH connections, port forwarding, remote development
- **Seamless Integration**: Uses the same extension ID (`ms-vscode-remote.remote-ssh`) to satisfy PearAI's requirements
- **Automatic Server Installation**: Downloads and installs VS Code server on remote machines
- **Fallback Support**: Multiple download sources for maximum compatibility

### Installation

Download the latest release from the [Releases page](https://github.com/sufianWG/open-remote-ssh/releases) and install the `.vsix` file in your VSCode-compatible editor.

### For PearAI Users

This extension **completely solves** the "Remote - SSH is required" issue in PearAI by:

1. **Using the exact extension ID** that PearAI expects (`ms-vscode-remote.remote-ssh`)
2. **Providing all required functionality** without Microsoft's license restrictions
3. **No more error messages** - PearAI will recognize this as the "official" Remote-SSH extension

**Installation Steps:**
1. Download the `.vsix` file from releases
2. Install via "Install from VSIX" in PearAI
3. Restart PearAI
4. Use SSH functionality normally - no more warnings!

## About This Extension

Open Remote - SSH allows you to use any remote machine with an SSH server as your development environment. This extension complements the [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) extension available in the Visual Studio Code Marketplace, providing similar functionality for VSCode forks and distributions.

### Key Features

- Connect to any remote machine with SSH access
- Full VSCode functionality on remote machines
- Support for various platforms including Linux, macOS, Windows, and BSD variants
- Automatic server binary installation with fallback mechanisms
- Compatible with VSCode forks like VSCodium, Void editor, and others

## SSH Host Requirements
You can connect to a running SSH server on the following platforms.

**Supported**:

- x86_64 Debian 8+, Ubuntu 16.04+, CentOS / RHEL 7+ Linux.
- ARMv7l (AArch32) Raspbian Stretch/9+ (32-bit).
- ARMv8l (AArch64) Ubuntu 18.04+ (64-bit).
- macOS 10.14+ (Mojave)
- Windows 10+
- FreeBSD 13 (Requires manual remote-extension-host installation)
- DragonFlyBSD (Requires manual remote-extension-host installation)

## Requirements

No special requirements. The extension works out of the box with PearAI, VSCodium, and other VSCode forks.

**Alpine linux**

When running on alpine linux, the packages `libstdc++` and `bash` are necessary and can be installed via
running
```bash
sudo apk add bash libstdc++
```

## SSH configuration file

[OpenSSH](https://www.openssh.com/) supports using a [configuration file](https://linuxize.com/post/using-the-ssh-config-file/) to store all your different SSH connections. To use an SSH config file, run the `Remote-SSH: Open SSH Configuration File...` command.

## Troubleshooting

### Server Binary Download Issues

If you encounter a 404 error when connecting to a remote host, this extension will automatically try alternative download sources. The fallback mechanism will attempt to download compatible server binaries from:
1. The configured primary source (your VSCode fork's releases)
2. Official VSCode releases
3. VSCodium releases

### Reporting Issues

If you encounter any problems, please report them on the [Issues page](https://github.com/sufianWG/open-remote-ssh/issues).

## Credits

This extension is based on the original work by [jeanp413](https://github.com/jeanp413/open-remote-ssh). The v1.0.0 release provides complete Remote-SSH functionality for VS Code forks.

# Open Remote - SSH

![Open Remote SSH](https://raw.githubusercontent.com/sufianWG/open-remote-ssh/master/docs/images/open-remote-ssh.gif)

## Latest Update (v0.0.50)

This fork includes a critical fix for issue [#201](https://github.com/jeanp413/open-remote-ssh/issues/201):
- **Fixed**: 404 error when downloading server binaries for Void editor and other VSCode forks
- **Added**: Automatic fallback to VSCode/VSCodium server binaries when primary download fails
- **Improved**: Better error handling and logging during server installation

### Installation

Download the latest release from the [Releases page](https://github.com/sufianWG/open-remote-ssh/releases) and install the `.vsix` file in your VSCode-compatible editor.

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

**Activation**

> NOTE: Not needed in VSCodium since version 1.75

Enable the extension in your `argv.json`


```json
{
    ...
    "enable-proposed-api": [
        ...,
        "sufian-dev.open-remote-ssh",
    ]
    ...
}
```
which you can open by running the `Preferences: Configure Runtime Arguments` command.
The file is located in `~/.vscode-oss/argv.json`.

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

This extension is based on the original work by [jeanp413](https://github.com/jeanp413/open-remote-ssh). The v0.0.50 release includes critical fixes for broader VSCode fork compatibility.

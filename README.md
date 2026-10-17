# WindCli Releases

WindCli 客户端、Web 服务和 MCP 的统一 GitHub Release 仓库。

## WindBrowser MCP

独立的浏览器控制服务，包含 MCP、管理控制台与 Chrome 扩展。WindCli 可作为客户端连接它。

- [下载 MCP 与配套扩展](https://github.com/CaineWind/WindCli/releases/tag/mcp-v0.1.0)
- [源码与使用说明](packages/windbrowser-mcp/README.md)
- [统一发布约定](docs/development/releases.md)

需要 Node.js 22 或更新版本。下载 Release 中的 `.tgz`，核对 `SHA256SUMS` 后安装：

```powershell
npm install --global ./windbrowser-mcp-0.1.0.tgz
windbrowser-mcp serve
```

打开 `http://127.0.0.1:5315`。另开终端运行 `windbrowser-mcp console-token` 查看本机管理凭证。扩展 ZIP 解压后，可在 `chrome://extensions` 开启开发者模式并加载；连接时使用控制台生成的一次性配对码。

客户端与 Web 服务的后续发布统一进入本仓库；当前 `mcp-v0.1.0` 仅包含独立 MCP 和配套扩展，不包含桌面安装程序。

## License

本仓库初始骨架沿用根目录 Apache-2.0 LICENSE。`packages/windbrowser-mcp/` 的浏览器引擎、扩展与配套代码源自 WindCli，适用该目录的 **AGPL-3.0-or-later** LICENSE。下载的 MCP 包也包含该许可证。

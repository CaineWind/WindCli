# WindCli Releases

WindCli 客户端、Web 服务和 MCP 的统一 GitHub Release 仓库。

## WindBrowser MCP

独立的浏览器控制服务，包含 MCP、管理控制台与 Chrome 扩展。WindCli 可作为客户端连接它。

- [下载 MCP 与配套扩展](https://github.com/CaineWind/WindCli/releases/tag/mcp-v0.1.1)
- [统一发布约定](docs/development/releases.md)

需要 Node.js 22 或更新版本。下载 Release 中的 `.tgz`，核对 `SHA256SUMS` 后安装：

```powershell
npm install --global ./windbrowser-mcp-0.1.1.tgz
windbrowser-mcp serve
```

打开 `http://127.0.0.1:5315`。另开终端运行 `windbrowser-mcp console-token` 查看本机管理凭证。扩展 ZIP 解压后，可在 `chrome://extensions` 开启开发者模式并加载；连接时使用控制台生成的一次性配对码。

本仓库只管理构建产物、下载说明和发布自动化。产品开发源码在独立源码项目管理，不放进这个仓库。MCP 后端、控制台和扩展在源码项目构建并压缩，发布包不包含 TypeScript 源文件、测试、source map 或类型声明。

桌面客户端使用 `v<版本>`，Web 服务使用 `web-v<版本>`，MCP 使用 `mcp-v<版本>`。MCP Release 只包含 MCP 与配套扩展，桌面安装程序在对应客户端 Release 中下载。

## License

本仓库初始骨架沿用根目录 Apache-2.0 LICENSE。WindBrowser MCP 沿用 **AGPL-3.0-or-later**，完整许可证随安装包分发。构建压缩不改变组件的许可证。

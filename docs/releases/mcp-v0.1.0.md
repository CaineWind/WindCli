WindBrowser MCP 首个独立 GitHub 版本，统一发布于 CaineWind/WindCli。

包含独立 Node.js 服务、stdio/HTTP MCP、浏览器管理控制台，以及配套 Chrome 扩展。WindCli 可连接该服务；MCP 不再依赖 WindCli 后端进程。需要 Node.js 22 或更新版本。

### 安装

1. 下载 `windbrowser-mcp-0.1.0.tgz`，使用 `SHA256SUMS` 核对文件。
2. 运行 `npm install --global ./windbrowser-mcp-0.1.0.tgz`。
3. 运行 `windbrowser-mcp serve`，打开 `http://127.0.0.1:5315`。
4. 另开终端运行 `windbrowser-mcp console-token` 查看本机管理凭证。
5. 解压 `windbrowser-extension-0.1.0.zip`，在 Chrome 扩展页面以开发者模式加载，并使用控制台的一次性配对码连接。

安装包通过 npm 安装本地文件，无需 npm registry 已发布同名包；安装依赖时需要网络。Chrome 扩展需要手动加载，未提交 Chrome Web Store。

### 传输与安全

- 文件以二进制内容传输，上传绑定客户端、会话和页面，单次消费，支持过期和撤销，不向浏览器传送服务器文件路径。
- 截图使用二进制资源、受限缓存和合并采集；WindCli 转发图片时不解码或重新编码。
- 管理端、Agent、扩展和临时支持使用分离的凭证；远程部署要求 HTTPS 和明确的可信代理配置。
- 原 WindCli 扩展绑定需要重新配对，Agent 需要重新授权。

独立组件 29 项测试通过，包含官方 MCP 客户端互通、授权边界、CSRF、上传限制、撤销和截图隔离。发布工作流另在 Windows 和 Linux 验证。实际 Chrome 扩展上传、移动模拟和控制台已在应用工作区验证。

本机 50 次采样的 P95：原内嵌 HTTP 152.00 ms、独立服务直连 151.23 ms、WindCli 转发 151.39 ms；图片字节数一致。这是本机结果，不代表公网性能。

此 Release 包含 MCP 与扩展，不包含 WindCli 桌面安装程序或 Web 服务整包，也未向 npm registry 发布。MCP 代码适用 AGPL-3.0-or-later，见包内 LICENSE。

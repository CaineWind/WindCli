WindBrowser MCP v0.1.1：独立服务、控制台和 Chrome 扩展的压缩构建版本。

此仓库只分发构建产物，开发源码在独立项目管理。后端采用打包压缩和标识符缩短，控制台与扩展 JavaScript/CSS 同步压缩。安装包不包含 TypeScript 源文件、测试、构建脚本、source map 或类型声明。压缩不等于加密，组件许可证保持不变。

下载 `.tgz` 并核对 `SHA256SUMS` 后执行：

```powershell
npm install --global ./windbrowser-mcp-0.1.1.tgz
windbrowser-mcp serve
```

打开 `http://127.0.0.1:5315`，另开终端运行 `windbrowser-mcp console-token` 查看本机管理凭证。配套 ZIP 解压后在 Chrome 扩展页面加载，使用控制台的一次性配对码连接。扩展自身版本为 2.4.3。

文件内容传输、凭证隔离、会话授权和截图传输行为保持一致。开发源码协议测试及压缩后的真实 Chrome 扩展验收通过。此 Release 不包含桌面安装程序，也未向 npm registry 发布。MCP 适用包内 AGPL-3.0-or-later LICENSE。

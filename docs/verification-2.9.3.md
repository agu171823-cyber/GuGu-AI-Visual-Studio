# GuGu AI Visual Studio 2.9.3 验证记录

日期：2026-10-05。

## 更名范围

- 页面顶部品牌、浏览器标题、说明文字和页脚统一为 `GuGu AI Visual Studio`。
- PWA 完整名称改为 `GuGu AI Visual Studio`，短名称改为 `GuGu AI Studio`。
- 后台 `/api/status` 的应用身份、服务启动日志和命令行提示统一使用新名称。
- Windows 快捷方式更新为 `GuGu AI Visual Studio.lnk`。
- npm 包标识更新为 `gugu-ai-visual-studio`。
- 便携包更新为 `GuGu-AI-Visual-Studio-Portable-2.9.3-win-x64.zip`，解压目录为 `GuGu AI Visual Studio Portable`。
- 版本 2.9.2 → 2.9.3，并更新主题资源查询与 Service Worker 缓存名称。

## 兼容性

- 项目所在目录保持不变。
- `config`、`data`、`output` 与现有 API Key、历史记录、生成结果均不迁移、不重命名。
- 3D 场景 IndexedDB 继续使用原数据库名称，避免丢失现有本地场景。
- 新版快速启动器仍可识别后台返回旧应用名称的 2.9.2 服务，升级过程不会将其误判为其他程序。
- API 路径、任务数据结构、模型参数和生成流程未修改。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| 主项目 `npm test` | 50/50 通过 |
| 角色模块 `npm run check:character` | 类型检查通过；20 个测试文件、154/154 测试通过；构建成功 |
| 启动器、后台与 Service Worker 语法检查 | 通过 |
| `/api/status` | `app` 为 `GuGu AI Visual Studio`，版本 2.9.3，队列为空 |
| 页面 `<title>` 与顶部品牌 | 均为 `GuGu AI Visual Studio` |
| PWA manifest | 完整名称与短名称均已更新 |

角色测试环境输出 jsdom 的 Canvas `getContext()` 未实现提示；不影响 154 项测试全部通过。

当前浏览器控制连接在更名验收阶段不可用，因此没有将旧截图当作新品牌截图使用。页面结构和主题布局未改动，HTTP 返回内容已直接核对。

## 便携包验收

`release/GuGu-AI-Visual-Studio-Portable-2.9.3-win-x64.zip`，约 46.1 MB。

归档检查确认包含新版页面、主题和本验证记录，不包含 `config`、`data`、`output` 私有目录或真实 `.env`。已在全新隔离目录使用包内 Node 和随机端口启动，核对新应用名、2.9.3 版本、空队列、未配置密钥及主要静态资源。

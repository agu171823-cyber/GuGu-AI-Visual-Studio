# Gugu 角色模卡工作室模块

由 character-model-card-studio 提取，保留原项目 MIT 许可和版权声明（见 LICENSE）。仅用于已获授权的成年人真人或具有明确成年外观的写实角色。

运行时使用 Gugu 的单一服务与 API Key 设置。147 图片支持 GPT Image 2.5 Flare / Sunburst；火山渠道支持 Seedream 5.0 Flash / Pro。模块不读取或保存独立密钥，资产记录真实渠道、模型和父资产来源（provenance）。原始参考图不落盘，未接受候选图只驻留当前服务内存，两小时后过期；重新启动服务不会自动续费重试。候选图需主动接受才写入 data/character-studio/projects。

开发构建：在此目录执行 `npm ci`、`npm run check`。浏览器和服务端 bundle 分别写入主项目 public/character-studio 与 server/character-studio.cjs；发布便携包不需要安装 npm 依赖。正常使用从主项目 quick-start.cmd 启动，默认 8797 端口。

工作流覆盖项目创建/导入/重开、六张规范图、三项人工审核压力测试、身份锁定与新版本、模卡/表情/服装/动作资产、Canvas 展示板、PNG 模型参考包 ZIP、跨模块图片发送。身份一致性仍需人工逐图验收。导出和下载不会调用图片模型。

自动测试使用模拟 Provider，不产生上游费用；实际模型质量和账户权限需用户主动生成验证。

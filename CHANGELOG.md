# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-09-26

 
### Breaking Changes

- 包的顶层仅保留命名导出，移除默认导出（避免 CJS named+default 警告，使用方式更清晰）
- 提供两个互斥入口，必须二选一使用：
  - `UniViteRootInjector`（推荐，高性能、类型友好，支持按页面/按需注入与自动路由类型生成）
  - `UniViteInsetLoader`（兼容旧版，沿用 pages.json 注入方式）

### Features

- 新增 RootInjector 入口：
  - 支持基于 components 的 const 断言自动推断插入键名
  - 支持 dts 生成路由 Path 类型
  - 支持按页面 handlePos 精细化注入与 exclude 排除策略
  - 内置 pages.json 缓存与增量计算优化，构建更快
- 文档拆分为两份：`docs/UniViteRootInjector.md` 与 `docs/UniViteInsetLoader.md`，并随包发布

### Docs

- README 重写：给出两种入口、互斥说明、性能建议、使用示例
- RootInjector 文档补充精确类型定义与默认值说明

### Chore

- 打包配置简化与优化：ESM + CJS、sourcemap、dts 输出、外部依赖声明
- 包含 docs 目录到 npm 包（package.json files 增加 docs）

## [1.0.10] - 2025-09-XX

- 旧版本维护节点，细节见对应 Git 历史

# 国家统计局MCP/Agent数据获取工具

## 项目概述
本项目是一个基于MCP（Model Context Protocol）协议的国家统计局数据获取服务，为AI Agent提供直接访问国家统计局API的功能。项目支持获取各种统计数据，包含关键词搜索、分类浏览、时间维度查询等功能，遵循国家统计局官方API接口最佳实践。

主要特点：
- ✅ 关键词搜索：直接搜索获取指标代码及最新值（推荐用于快速查询）
- ✅ 树形分类：可浏览和递归获取所有分类/指标体系
- ✅ 时间范围：可查询各数据库对应可用时间维度
- ✅ 标准API：遵循国家统计局接口文档的全部规范
- ✅ 容错机制：内置重试逻辑、请求延迟、数据验证等功能

## 环境要求
- Node.js 18+
- npm or yarn

## 安装指南
安装所需依赖，请运行以下命令：
```bash
npm install
```

## 服务启动
启动MCP服务器：
```bash
# 构建项目
npm run build

# 启动服务器（STDIO模式 - 适用于Claude Desktop等）
npm start

# 或启动HTTP服务器（端口模式）
node dist/index.js --port 8080
```

## 可用工具

### search_statistics（推荐）
通过关键词搜索国家统计局指标和数据。可以快速查找指标及其最新值。
- 参数：`keyword`（必需）- 搜索关键词，如 "GDP"、"人均可支配收入" 等
- 参数：`db`（可选）- 数据库筛选，空=全部，可选"年度数据"或"季度数据"
- 参数：`page`（可选）- 页码，从0开始

### get_statistics_categories
获取统计指标分类树，返回国家统计局分类体系（第一层）。
- 参数：`dbcode`（必需）- 数据库代码，`wdcode`（可选）- 维度代码

### get_statistics_leaf_categories
递归获取特定数据库的所有叶子指标节点（分类下全部可查询指标）。
- 参数：`dbcode`（必需）- 数据库代码

### get_statistics_time_options
获取指定数据库可选的时间范围维度。
- 参数：`dbcode`（必需）- 数据库代码

### get_statistics_data
获取国家统计局特定指标的数据。
- 参数：`zb`（必需）- 指标代码，`dbcode`（必需）- 数据库代码，`sj`（可选）- 时间范围

### batch_get_statistics
批量获取多个统计指标的数据。
- 参数：`queries`（必需）- 查询参数数组

## 模块介绍
- `src/index.ts`: MCP服务器主入口，实现MCP协议规范
- `src/api-client.ts`: 国家统计局API交互模块，提供完整的数据获取功能，包括搜索、分类、数据查询等

## 遵循国家统计局API标准
项目严格实现api_introduce.md中的接口规范，包含：
- 搜索接口 `/search.htm` 用于关键词查找和快速获取最新值
- 分类接口 `/easyquery.htm` 用于遍历指标分类树
- 数据接口 `/easyquery.htm` 用于查询历史时间序列
- 通过 `k1` 时间戳防缓存参数
- URL编码处理 `wds` 和 `dfwds` 参数
- 数据验证与错误处理最佳实践

## 数据编码对应
- `dbcode.json`: 存储数据库代码及其相应的名称
- `zb.json`: 包含用于查询不同类型国家数据的类别和子类别代码
- `wbcode.json`: 维度代码定义

## 为AI Agent的使用
本项目专门设计为MCP服务器，可以直接集成到AI Agent系统中，提供国家统计局数据查询能力。Agent可根据使用场景选择最合适的工具：

- **快速查询**：使用 `search_statistics` 直接通过关键词获取指标和最新值
- **分类浏览**：使用 `get_statistics_categories` 或 `get_statistics_leaf_categories` 查看指标体系
- **深度查询**：使用 `get_statistics_time_options` 和 `get_statistics_data` 获取历史序列数据

## 开发
进行开发时可使用：
```bash
npm run dev
```

## 贡献
欢迎对本代码进行修改。请确保遵循项目的编码标准。

## 开源协议
[MIT License](./License)




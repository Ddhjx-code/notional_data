#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { startSseAndStreamableHttpMcpServer } from 'mcp-http-server';
import { StatsApiClient } from './api-client';
import { z } from 'zod';
import { Command } from 'commander';

// 获取版本号，这里使用package.json中的版本
const VERSION = '1.0.2';

// 创建API客户端实例
const apiClient = new StatsApiClient();

// 创建MCP服务器
export const server = new McpServer({
  name: 'national-stats-mcp',
  version: VERSION,
  description: '国家统计局数据查询API'
});
// 设置服务器instructions
(server as any).instructions = `
    该服务主要用于帮助用户查询国家统计局的统计数据。

    主要工具包括：
    - search_statistics: 通过关键词搜索国家统计局数据（推荐用于快速查询）
    - get_statistics_categories: 获取统计指标分类
    - get_statistics_leaf_categories: 获取所有叶子指标（递归获取）
    - get_statistics_time_options: 获取特定数据库可选的时间范围
    - get_statistics_data: 获取特定统计指标的数据
    - batch_get_statistics: 批量获取统计数据

    使用说明：
    - 对于快速查询，直接使用search_statistics根据关键词查找数据和指标code
    - 如需浏览分类体系，调用get_statistics_categories获取分类树
    - 要获取特定分类下的所有叶子指标，使用get_statistics_leaf_categories
    - 查看可用时间范围调用get_statistics_time_options
    - 根据指标代码查询具体数据使用get_statistics_data

    配置选项：
    - dbcode: 数据库代码，hgnd (年度数据)、hgjd (季度数据) 等
    - zb: 指标代码，通过分类或搜索获取
    - sj: 时间范围，如 LAST6 (最近6个季度)、2025 (指定年份) 等
  `;

// 注册搜索统计指标的工具（最推荐使用）
server.tool(
  'search_statistics',
  '通过关键词搜索国家统计局指标和数据。可以快速查找指标及其最新值。',
  {
    keyword: z.string().describe('搜索关键词，如 "GDP"、"人均可支配收入" 等'),
    db: z.string().optional().default('').describe('数据库筛选，空=全部，可选 "年度数据" 或 "季度数据"'),
    page: z.number().optional().default(0).describe('页码，从0开始'),
  },
  async (args: { keyword: string, db?: string, page?: number }) => {
    const { keyword, db = '', page = 0 } = args;
    try {
      // 执行搜索
      const searchResult = await apiClient.search(keyword, db, page);

      // 解析搜索结果
      const parsedResults = apiClient.parseSearchResult(searchResult);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              pagecount: searchResult.pagecount,
              pagecurrent: searchResult.pagecurrent,
              results: parsedResults
            }, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 注册获取统计分类的工具
server.tool(
  'get_statistics_categories',
  '获取国家统计局的统计指标分类，返回分类树结构（第一层）',
  {
    dbcode: z.string()
      .describe('数据库代码，指定数据类型：hgnd(年度数据), hgjd(季度数据)等'),
    wdcode: z.string()
      .default('zb')
      .describe('维度代码，默认为zb(指标)'),
  },
  async (args: { dbcode: string, wdcode: string }) => {
    const { dbcode, wdcode = 'zb' } = args;
    try {
      const data = await apiClient.getCategories(dbcode, wdcode);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 注册获取统计指标叶子节点的工具（递归获取所有叶子指标）
server.tool(
  'get_statistics_leaf_categories',
  '递归获取国家统计局特定数据库的所有叶子指标节点（可查看分类下所有可查询指标）',
  {
    dbcode: z.string()
      .describe('数据库代码，指定数据类型：hgnd(年度数据), hgjd(季度数据)等'),
  },
  async (args: { dbcode: string }) => {
    const { dbcode } = args;
    try {
      const data = await apiClient.getLeafCategories(dbcode);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 注册获取统计时间维度选项的工具
server.tool(
  'get_statistics_time_options',
  '获取指定数据库可选的时间范围维度',
  {
    dbcode: z.string()
      .describe('数据库代码，指定数据类型：hgnd(年度数据), hgjd(季度数据)等'),
  },
  async (args: { dbcode: string }) => {
    const { dbcode } = args;
    try {
      const data = await apiClient.getTimeDimensions(dbcode);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 注册获取统计数据的工具
server.tool(
  'get_statistics_data',
  '获取国家统计局特定指标的数据',
  {
    zb: z.string().describe('指标代码，通过分类或搜索获取'),
    dbcode: z.string()
      .describe('数据库代码，指定数据类型：hgnd(年度数据), hgjd(季度数据)等'),
    sj: z.string()
      .default('LAST30')
      .describe('时间范围，例如 LAST6 (最近6季度), 2025 (指定年份), LAST30 (最近30年) 等'),
  },
  async (args: { zb: string, dbcode: string, sj: string }) => {
    const { zb, dbcode, sj = 'LAST30' } = args;
    try {
      const data = await apiClient.getData(zb, dbcode, sj);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 注册批量获取统计数据的工具
server.tool(
  'batch_get_statistics',
  '批量获取国家统计局多个指标的数据',
  {
    queries: z.array(
      z.object({
        zb: z.string().describe('指标代码'),
        dbcode: z.string().describe('数据库代码'),
        sj: z.string().optional().default('LAST30').describe('时间范围'),
      })
    ).describe('查询参数数组')
  },
  async (args: { queries: Array<{ zb: string, dbcode: string, sj?: string }> }) => {
    const { queries } = args;
    try {
      const results = await apiClient.batchGet(queries.map(q => ({
        zb: q.zb,
        dbcode: q.dbcode,
        sj: q.sj || 'LAST30'
      })));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 启动服务器
async function startServer() {
  const program = new Command();

  program
    .option('-p, --port <number>', 'Port to listen on for HTTP/SSE mode')
    .option('-h, --host <host>', 'Host to listen on for HTTP/SSE mode', 'localhost')
    .parse();

  const options = program.opts();

  // 通过端口参数判断是否使用HTTP模式还是STDIO模式
  if (options.port) {
    await startSseAndStreamableHttpMcpServer({
      host: options.host,
      port: parseInt(options.port),
      createMcpServer: async ({ headers }) => {
        return server;
      },
    });
  } else {
    // 使用STDIO模式
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;
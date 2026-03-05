// MCP SDK 类型定义
export interface McpServer {
  new (options: {
    name: string;
    version: string;
    capabilities: {
      resources?: Record<string, any>;
      tools?: Record<string, any>;
    };
    instructions?: string;
  }): McpServer;

  tool(
    name: string,
    description: string,
    parameters: any,
    implementation: (args: any) => Promise<any>
  ): void;

  connect(transport: any): Promise<void>;
}

// HTTP Transport 类型定义
export interface SseAndStreamableHttpMcpServerOptions {
  host: string;
  port: number;
  createMcpServer: (context: { headers: Record<string, string> }) => Promise<any>;
}

export interface StdioServerTransport {
  new (): StdioServerTransport;
}

// 为startSseAndStreamableHttpMcpServer定义类型
export type StartHttpServerFn = (options: SseAndStreamableHttpMcpServerOptions) => Promise<void>;
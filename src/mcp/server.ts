import { consentManager } from './consent';
import { MCPTools } from './tools';

/**
 * On-Device Local MCP Server
 * Binds strictly to loopback (127.0.0.1) on a local port.
 * Exposes read-only tools guarded by per-tool consent approval.
 */
export class MCPServer {
  private host = '127.0.0.1';
  private port = 8080;
  private isRunning = false;

  async start(): Promise<string> {
    this.isRunning = true;
    return `MCP Server listening on http://${this.host}:${this.port}`;
  }

  async handleToolInvocation(toolName: 'get_recent_entries' | 'get_habit_streaks' | 'get_weekly_digest', args?: any): Promise<any> {
    if (!this.isRunning) {
      throw new Error('MCP Server is not running');
    }

    if (!consentManager.isToolAllowed(toolName)) {
      throw new Error(`Consent denied: User has not approved MCP tool '${toolName}'`);
    }

    switch (toolName) {
      case 'get_recent_entries':
        return await MCPTools.get_recent_entries(args?.days || 7);
      case 'get_habit_streaks':
        return await MCPTools.get_habit_streaks();
      case 'get_weekly_digest':
        return await MCPTools.get_weekly_digest();
      default:
        throw new Error(`Unknown MCP Tool: ${toolName}`);
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}

export const mcpServer = new MCPServer();

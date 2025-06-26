import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SecureConfig, clearSensitiveData } from './config-secure';
import { RuntimeProtection, SecureString } from './security/runtime-protection';
import { RoamClient } from './roam-client';
import { PageTools } from './tools/pages';
import { BlockTools } from './tools/blocks';
import { SearchTools } from './tools/search';
import { QueryTools } from './tools/query';
import { DailyTools } from './tools/daily';

class SecureRoamMCPServer {
  private server: Server;
  private client: RoamClient | null = null;
  private tokenIdentifier: string | null = null;
  
  constructor() {
    // Initialize runtime protection
    RuntimeProtection.initialize();
    
    // Validate process integrity
    if (!RuntimeProtection.validateIntegrity()) {
      console.error('❌ Security validation failed. Exiting.');
      process.exit(1);
    }

    this.server = new Server(
      {
        name: 'roam-mcp-secure',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async initializeClient() {
    if (this.client) return;

    try {
      // Load config securely
      const config = SecureConfig.loadSecureConfig();
      
      // Encrypt token in memory immediately
      this.tokenIdentifier = RuntimeProtection.encryptInMemory(
        config.apiToken,
        `token-${Date.now()}`
      );
      
      // Create client with temporary decryption
      const tempToken = RuntimeProtection.decryptFromMemory(this.tokenIdentifier);
      this.client = new RoamClient({
        ...config,
        apiToken: tempToken
      });
      
      // Clear temporary token
      clearSensitiveData(tempToken);
      
      // Initialize client
      await this.client.initialize();
      
      console.error('✅ Secure connection established');
    } catch (error) {
      console.error('❌ Failed to initialize secure client:', error);
      throw error;
    }
  }

  private getSecureClient(): RoamClient {
    if (!this.client || !this.tokenIdentifier) {
      throw new Error('Client not initialized');
    }
    
    // Temporarily inject token for API calls
    const token = RuntimeProtection.decryptFromMemory(this.tokenIdentifier);
    (this.client as any).config.apiToken = token;
    
    // Clear after a short delay
    setTimeout(() => {
      if (this.client) {
        (this.client as any).config.apiToken = '';
      }
      clearSensitiveData(token);
    }, 100);
    
    return this.client;
  }

  private setupToolHandlers() {
    // Tool initialization without exposing client
    let pageTools: PageTools;
    let blockTools: BlockTools;
    let searchTools: SearchTools;
    let queryTools: QueryTools;
    let dailyTools: DailyTools;

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Initialize on first request
      if (!this.client) {
        await this.initializeClient();
        const client = this.getSecureClient();
        
        pageTools = new PageTools(client);
        blockTools = new BlockTools(client);
        searchTools = new SearchTools(client);
        queryTools = new QueryTools(client);
        dailyTools = new DailyTools(client);
      }

      // Rate limiting
      this.checkRateLimit(request.params.name);
      
      // Input validation
      this.validateInput(request.params.name, request.params.arguments || {});
      
      // Execute with secure client
      const result = await this.handleToolCall(
        request.params.name,
        request.params.arguments || {},
        { pageTools, blockTools, searchTools, queryTools, dailyTools }
      );
      
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    });
  }

  private requestCounts = new Map<string, number>();
  
  private checkRateLimit(operation: string): void {
    const key = `${operation}-${Math.floor(Date.now() / 60000)}`;
    const count = (this.requestCounts.get(key) || 0) + 1;
    
    if (count > 100) { // 100 requests per minute per operation
      throw new Error('Rate limit exceeded');
    }
    
    this.requestCounts.set(key, count);
    
    // Clean old entries
    if (this.requestCounts.size > 100) {
      const cutoff = Math.floor(Date.now() / 60000) - 5;
      for (const [k] of this.requestCounts) {
        const time = parseInt(k.split('-')[1]);
        if (time < cutoff) {
          this.requestCounts.delete(k);
        }
      }
    }
  }

  private validateInput(toolName: string, args: any): void {
    // Validate based on tool
    switch (toolName) {
      case 'roam_query':
        if (args.query) {
          this.validateDatalogQuery(args.query);
        }
        break;
      
      case 'roam_create_page':
      case 'roam_update_page':
        if (args.title) {
          this.validatePageTitle(args.title);
        }
        if (args.newTitle) {
          this.validatePageTitle(args.newTitle);
        }
        break;
      
      case 'roam_create_block':
      case 'roam_update_block':
        if (args.content) {
          this.validateBlockContent(args.content);
        }
        break;
    }
  }

  private validatePageTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Invalid page title');
    }
    if (title.length > 255) {
      throw new Error('Page title too long');
    }
    // Prevent XSS
    if (/<script|<iframe|javascript:/i.test(title)) {
      throw new Error('Invalid characters in page title');
    }
  }

  private validateBlockContent(content: string): void {
    if (typeof content !== 'string') {
      throw new Error('Invalid block content');
    }
    if (content.length > 10000) {
      throw new Error('Block content too long');
    }
    // Prevent XSS
    if (/<script|<iframe|javascript:/i.test(content)) {
      throw new Error('Invalid characters in block content');
    }
  }

  private validateDatalogQuery(query: string): void {
    const dangerousPatterns = [
      /\btransact\b/i,
      /\bpull-many\b/i,
      /\bdb\.fn/i,
      /\bdb\/retract/i,
      /\bdb\/add/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error('Query contains restricted operations');
      }
    }
  }

  private async handleToolCall(
    toolName: string, 
    args: any,
    tools: any
  ) {
    // Use secure client for all operations
    const secureClient = this.getSecureClient();
    
    // ... rest of the handleToolCall implementation
    // (Same as original but using the tools parameter)
    
    try {
      switch (toolName) {
        case 'roam_get_page':
          return await tools.pageTools.getPage(args);
        case 'roam_create_page':
          return await tools.pageTools.createPage(args);
        // ... other cases
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      // Don't expose internal errors
      return {
        error: 'Operation failed. Please check your input and try again.'
      };
    }
  }

  private getTools() {
    // Same tools as before
    return [];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🔐 Secure Roam MCP server running');
  }
}

// Run with additional security
if (require.main === module) {
  const server = new SecureRoamMCPServer();
  server.run().catch((error) => {
    console.error('Server error:', error.message);
    process.exit(1);
  });
}
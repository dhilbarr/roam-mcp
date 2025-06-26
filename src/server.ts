import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, validateConfig } from './config';
import { RoamClient } from './roam-client';
import { PageTools } from './tools/pages';
import { BlockTools } from './tools/blocks';
import { SearchTools } from './tools/search';
import { QueryTools } from './tools/query';
import { DailyTools } from './tools/daily';
import { markdownToRoam } from './utils/markdown';

class RoamMCPServer {
  private server: Server;
  private client: RoamClient;
  private pageTools: PageTools;
  private blockTools: BlockTools;
  private searchTools: SearchTools;
  private queryTools: QueryTools;
  private dailyTools: DailyTools;

  constructor() {
    this.server = new Server(
      {
        name: 'roam-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const config = loadConfig();
    validateConfig(config);
    
    this.client = new RoamClient(config);
    this.pageTools = new PageTools(this.client);
    this.blockTools = new BlockTools(this.client);
    this.searchTools = new SearchTools(this.client);
    this.queryTools = new QueryTools(this.client);
    this.dailyTools = new DailyTools(this.client);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.ensureInitialized();
      const result = await this.handleToolCall(request.params.name, request.params.arguments || {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    });
  }

  private async ensureInitialized() {
    if (!this.client['api']) {
      await this.client.initialize();
    }
  }

  private async handleToolCall(toolName: string, args: any) {
    try {
      switch (toolName) {
        case 'roam_get_page':
          return await this.pageTools.getPage(args);
        
        case 'roam_create_page':
          return await this.pageTools.createPage(args);
        
        case 'roam_update_page':
          return await this.pageTools.updatePage(args);
        
        case 'roam_list_pages':
          return await this.pageTools.listPages(args);
        
        case 'roam_export_page':
          return await this.pageTools.exportPageAsMarkdown(args);

        case 'roam_create_block':
          return await this.blockTools.createBlock(args);
        
        case 'roam_update_block':
          return await this.blockTools.updateBlock(args);
        
        case 'roam_delete_block':
          return await this.blockTools.deleteBlock(args);
        
        case 'roam_get_block_tree':
          return await this.blockTools.getBlockTree(args);
        
        case 'roam_move_block':
          return await this.blockTools.moveBlock(args);

        case 'roam_search':
          return await this.searchTools.searchByText(args);
        
        case 'roam_search_by_tag':
          return await this.searchTools.searchByTag(args);
        
        case 'roam_search_references':
          return await this.searchTools.searchReferences(args);
        
        case 'roam_find_orphan_pages':
          return await this.searchTools.findOrphanPages(args);
        
        case 'roam_search_by_date':
          return await this.searchTools.searchByDate(args);

        case 'roam_query':
          return await this.queryTools.executeQuery(args);
        
        case 'roam_get_common_queries':
          return await this.queryTools.getCommonQueries();
        
        case 'roam_analyze_tags':
          return await this.queryTools.analyzeTags(args);
        
        case 'roam_get_graph_stats':
          return await this.queryTools.getGraphStats();

        case 'roam_get_daily_note':
          return await this.dailyTools.getDailyNote(args);
        
        case 'roam_add_to_daily':
          return await this.dailyTools.addToDaily(args);
        
        case 'roam_create_todo':
          return await this.dailyTools.createTodo(args);
        
        case 'roam_list_todos':
          return await this.dailyTools.listTodos(args);
        
        case 'roam_complete_todo':
          return await this.dailyTools.completeTodo(args);
        
        case 'roam_get_recent_daily_notes':
          return await this.dailyTools.getRecentDailyNotes(args);

        case 'roam_import_markdown':
          const blocks = markdownToRoam(args.markdown);
          const page = await this.pageTools.createPage({ 
            title: args.title, 
            content: blocks.map(b => b.string) 
          });
          return { ...page, blocksCreated: blocks.length };

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'roam_get_page',
        description: 'Get a page by title or UID',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Page title' },
            uid: { type: 'string', description: 'Page UID' }
          }
        }
      },
      {
        name: 'roam_create_page',
        description: 'Create a new page with optional content',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Page title' },
            content: { type: 'array', items: { type: 'string' }, description: 'Initial content blocks' }
          },
          required: ['title']
        }
      },
      {
        name: 'roam_update_page',
        description: 'Update a page title or content',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Current page title' },
            newTitle: { type: 'string', description: 'New page title' },
            content: { type: 'array', items: { type: 'string' }, description: 'New content blocks' },
            append: { type: 'boolean', description: 'Append content instead of replacing' }
          },
          required: ['title']
        }
      },
      {
        name: 'roam_list_pages',
        description: 'List pages in the graph',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of pages to return' },
            includeDaily: { type: 'boolean', description: 'Include daily notes' },
            searchTerm: { type: 'string', description: 'Filter pages by title' }
          }
        }
      },
      {
        name: 'roam_export_page',
        description: 'Export a page as markdown',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Page title' }
          },
          required: ['title']
        }
      },
      {
        name: 'roam_create_block',
        description: 'Create a new block',
        inputSchema: {
          type: 'object',
          properties: {
            parentUid: { type: 'string', description: 'Parent block/page UID' },
            content: { type: 'string', description: 'Block content' },
            order: { type: ['number', 'string'], description: 'Position (number, "first", or "last")' },
            heading: { type: 'number', description: 'Heading level (1-3)' },
            viewType: { type: 'string', enum: ['bullet', 'numbered', 'document'] }
          },
          required: ['parentUid', 'content']
        }
      },
      {
        name: 'roam_update_block',
        description: 'Update a block\'s content',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Block UID' },
            content: { type: 'string', description: 'New content' }
          },
          required: ['uid', 'content']
        }
      },
      {
        name: 'roam_delete_block',
        description: 'Delete a block',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Block UID' }
          },
          required: ['uid']
        }
      },
      {
        name: 'roam_get_block_tree',
        description: 'Get a block with its children',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Block UID' },
            depth: { type: 'number', description: 'Tree depth to fetch' }
          },
          required: ['uid']
        }
      },
      {
        name: 'roam_move_block',
        description: 'Move a block to a new parent',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Block UID' },
            newParentUid: { type: 'string', description: 'New parent UID' },
            order: { type: ['number', 'string'], description: 'Position' }
          },
          required: ['uid', 'newParentUid']
        }
      },
      {
        name: 'roam_search',
        description: 'Search for text in the graph',
        inputSchema: {
          type: 'object',
          properties: {
            searchText: { type: 'string', description: 'Text to search for' },
            caseSensitive: { type: 'boolean', description: 'Case sensitive search' },
            limit: { type: 'number', description: 'Maximum results' }
          },
          required: ['searchText']
        }
      },
      {
        name: 'roam_search_by_tag',
        description: 'Find blocks with a specific tag',
        inputSchema: {
          type: 'object',
          properties: {
            tag: { type: 'string', description: 'Tag name (with or without #)' },
            includeChildren: { type: 'boolean', description: 'Include child blocks' },
            limit: { type: 'number', description: 'Maximum results' }
          },
          required: ['tag']
        }
      },
      {
        name: 'roam_search_references',
        description: 'Find references to a page or block',
        inputSchema: {
          type: 'object',
          properties: {
            pageTitle: { type: 'string', description: 'Page title' },
            blockUid: { type: 'string', description: 'Block UID' },
            includeUnlinked: { type: 'boolean', description: 'Include unlinked references' }
          }
        }
      },
      {
        name: 'roam_find_orphan_pages',
        description: 'Find pages with no references',
        inputSchema: {
          type: 'object',
          properties: {
            excludeDaily: { type: 'boolean', description: 'Exclude daily notes' }
          }
        }
      },
      {
        name: 'roam_search_by_date',
        description: 'Search blocks by creation/modification date',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Specific date (YYYY-MM-DD)' },
            startDate: { type: 'string', description: 'Start date for range' },
            endDate: { type: 'string', description: 'End date for range' },
            modifiedOnly: { type: 'boolean', description: 'Search by modification date' }
          }
        }
      },
      {
        name: 'roam_query',
        description: 'Execute a custom Datalog query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Datalog query' },
            pullSpec: { type: 'string', description: 'Optional pull specification' }
          },
          required: ['query']
        }
      },
      {
        name: 'roam_get_common_queries',
        description: 'Get a list of common useful queries',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'roam_analyze_tags',
        description: 'Analyze tag usage in the graph',
        inputSchema: {
          type: 'object',
          properties: {
            minUsage: { type: 'number', description: 'Minimum usage count' },
            sortBy: { type: 'string', enum: ['usage', 'alphabetical'] }
          }
        }
      },
      {
        name: 'roam_get_graph_stats',
        description: 'Get statistics about the graph',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'roam_get_daily_note',
        description: 'Get or create a daily note',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
            createIfMissing: { type: 'boolean', description: 'Create if not exists' }
          }
        }
      },
      {
        name: 'roam_add_to_daily',
        description: 'Add content to a daily note',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: ['string', 'array'], description: 'Content to add' },
            date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
            position: { type: 'string', enum: ['top', 'bottom'] }
          },
          required: ['content']
        }
      },
      {
        name: 'roam_create_todo',
        description: 'Create a TODO item in daily notes',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task description' },
            date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['task']
        }
      },
      {
        name: 'roam_list_todos',
        description: 'List TODO items',
        inputSchema: {
          type: 'object',
          properties: {
            includeCompleted: { type: 'boolean', description: 'Include completed TODOs' },
            daysBack: { type: 'number', description: 'Days to look back' },
            tag: { type: 'string', description: 'Filter by tag' }
          }
        }
      },
      {
        name: 'roam_complete_todo',
        description: 'Mark a TODO as complete',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'TODO block UID' }
          },
          required: ['uid']
        }
      },
      {
        name: 'roam_get_recent_daily_notes',
        description: 'Get recent daily notes',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days' }
          }
        }
      },
      {
        name: 'roam_import_markdown',
        description: 'Import markdown content as a new page',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Page title' },
            markdown: { type: 'string', description: 'Markdown content' }
          },
          required: ['title', 'markdown']
        }
      }
    ];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Roam MCP server running on stdio');
  }
}

const server = new RoamMCPServer();
server.run().catch(console.error);
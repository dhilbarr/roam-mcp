import { RoamClient } from '../roam-client';

export class QueryTools {
  constructor(private client: RoamClient) {}

  async executeQuery(args: {
    query: string;
    pullSpec?: string;
  }): Promise<any[]> {
    if (!args.query.trim().startsWith('[')) {
      throw new Error('Query must be a valid Datalog query starting with [');
    }

    try {
      const results = await this.client.query(args.query);
      
      if (args.pullSpec && results.length > 0) {
        const pulledResults = [];
        for (const result of results) {
          if (result[0] && typeof result[0] === 'string') {
            const pulled = await this.client.pull(args.pullSpec, result[0]);
            pulledResults.push(pulled);
          } else {
            pulledResults.push(result);
          }
        }
        return pulledResults;
      }
      
      return results;
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCommonQueries(): Promise<Array<{ name: string; description: string; query: string }>> {
    return [
      {
        name: 'All Pages',
        description: 'Get all pages in the graph',
        query: '[:find ?title ?uid :where [?page :node/title ?title] [?page :block/uid ?uid]]'
      },
      {
        name: 'Recent Pages',
        description: 'Get pages created in the last 7 days',
        query: `[:find ?title ?time :where [?page :node/title ?title] [?page :create/time ?time] [(> ?time ${Date.now() - 7 * 24 * 60 * 60 * 1000})]]`
      },
      {
        name: 'Pages with TODOs',
        description: 'Find all pages containing TODO items',
        query: '[:find ?title :where [?page :node/title ?title] [?block :block/parents ?page] [?block :block/string ?s] [(clojure.string/includes? ?s "{{[[TODO]]}}")]]'
      },
      {
        name: 'Blocks by User',
        description: 'Find blocks created by a specific user (replace email)',
        query: '[:find ?uid ?string :where [?b :create/email "user@example.com"] [?b :block/uid ?uid] [?b :block/string ?string]]'
      },
      {
        name: 'Tag Relationships',
        description: 'Find all tags and their usage count',
        query: '[:find ?tag (count ?b) :where [?t :node/title ?tag] [?b :block/refs ?t]]'
      },
      {
        name: 'Orphan Blocks',
        description: 'Find blocks without parents',
        query: '[:find ?uid ?string :where [?b :block/uid ?uid] [?b :block/string ?string] (not [?b :block/parents])]'
      }
    ];
  }

  async analyzeTags(args: {
    minUsage?: number;
    sortBy?: 'usage' | 'alphabetical';
  }): Promise<Array<{ tag: string; count: number }>> {
    const query = '[:find ?tag (count ?b) :where [?t :node/title ?tag] [?b :block/refs ?t]]';
    const results = await this.client.query(query);
    
    let tags = results.map(r => ({
      tag: r[0] as string,
      count: r[1] as number
    }));

    if (args.minUsage !== undefined) {
      const minUsage = args.minUsage;
      tags = tags.filter(t => t.count >= minUsage);
    }

    if (args.sortBy === 'alphabetical') {
      tags.sort((a, b) => a.tag.localeCompare(b.tag));
    } else {
      tags.sort((a, b) => b.count - a.count);
    }

    return tags;
  }

  async getGraphStats(): Promise<{
    totalPages: number;
    totalBlocks: number;
    totalTags: number;
    recentActivity: {
      last24h: number;
      last7d: number;
      last30d: number;
    };
  }> {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const queries = await Promise.all([
      this.client.query('[:find (count ?page) :where [?page :node/title]]'),
      this.client.query('[:find (count ?block) :where [?block :block/string]]'),
      this.client.query('[:find (count-distinct ?tag) :where [?b :block/refs ?tag]]'),
      this.client.query(`[:find (count ?b) :where [?b :edit/time ?t] [(> ?t ${now - day})]]`),
      this.client.query(`[:find (count ?b) :where [?b :edit/time ?t] [(> ?t ${now - 7 * day})]]`),
      this.client.query(`[:find (count ?b) :where [?b :edit/time ?t] [(> ?t ${now - 30 * day})]]`)
    ]);

    return {
      totalPages: queries[0][0]?.[0] || 0,
      totalBlocks: queries[1][0]?.[0] || 0,
      totalTags: queries[2][0]?.[0] || 0,
      recentActivity: {
        last24h: queries[3][0]?.[0] || 0,
        last7d: queries[4][0]?.[0] || 0,
        last30d: queries[5][0]?.[0] || 0
      }
    };
  }
}
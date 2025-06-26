import { RoamClient } from '../roam-client';
import { RoamPage } from '../types';
import { roamToMarkdown } from '../utils/markdown';

export class PageTools {
  constructor(private client: RoamClient) {}

  async getPage(args: { title?: string; uid?: string }): Promise<RoamPage | null> {
    if (!args.title && !args.uid) {
      throw new Error('Either title or uid must be provided');
    }

    if (args.title) {
      return await this.client.getPageByTitle(args.title);
    }

    if (args.uid) {
      const result = await this.client.pull(
        '[:block/uid :node/title :block/children :create/time :edit/time :edit/email]',
        args.uid
      );
      return result as RoamPage;
    }

    return null;
  }

  async createPage(args: { title: string; content?: string[] }): Promise<{ uid: string; title: string }> {
    const uid = await this.client.createPage(args.title);

    if (args.content && args.content.length > 0) {
      for (let i = 0; i < args.content.length; i++) {
        await this.client.createBlock(uid, args.content[i], i);
      }
    }

    return { uid, title: args.title };
  }

  async updatePage(args: { 
    title: string; 
    newTitle?: string; 
    content?: string[];
    append?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const page = await this.client.getPageByTitle(args.title);
    
    if (!page) {
      throw new Error(`Page "${args.title}" not found`);
    }

    if (args.newTitle && args.newTitle !== args.title) {
      await this.client.updateBlock(page.uid, args.newTitle);
    }

    if (args.content) {
      if (args.append) {
        const existingCount = page.children?.length || 0;
        for (let i = 0; i < args.content.length; i++) {
          await this.client.createBlock(page.uid, args.content[i], existingCount + i);
        }
      } else {
        if (page.children) {
          for (const child of page.children) {
            await this.client.deleteBlock(child.uid);
          }
        }
        
        for (let i = 0; i < args.content.length; i++) {
          await this.client.createBlock(page.uid, args.content[i], i);
        }
      }
    }

    return { 
      success: true, 
      message: `Page updated successfully${args.newTitle ? ' with new title' : ''}`
    };
  }

  async listPages(args: { 
    limit?: number; 
    includeDaily?: boolean;
    searchTerm?: string;
  }): Promise<Array<{ uid: string; title: string; time?: number }>> {
    let query = '[:find (pull ?page [:block/uid :node/title :create/time]) :where [?page :node/title ?title]';
    
    if (!args.includeDaily) {
      query += ' [(not (re-matches #"^[A-Za-z]+ \\d{1,2}(st|nd|rd|th), \\d{4}$" ?title))]';
    }
    
    if (args.searchTerm) {
      query += ` [(clojure.string/includes? ?title "${args.searchTerm}")]`;
    }
    
    query += ']';
    
    const results = await this.client.query(query);
    const pages = results.map(r => r[0]).filter(p => p.title);
    
    pages.sort((a, b) => (b.time || 0) - (a.time || 0));
    
    if (args.limit) {
      return pages.slice(0, args.limit);
    }
    
    return pages;
  }

  async exportPageAsMarkdown(args: { title: string }): Promise<string> {
    const page = await this.getPage({ title: args.title });
    
    if (!page) {
      throw new Error(`Page "${args.title}" not found`);
    }

    let markdown = `# ${page.title}\n\n`;
    
    if (page.children) {
      for (const child of page.children) {
        markdown += roamToMarkdown(child) + '\n\n';
      }
    }
    
    return markdown.trim();
  }
}
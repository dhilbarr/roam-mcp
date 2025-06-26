const RoamPrivateApi = require('@roam-research/roam-api-sdk');
import { RoamConfig, RoamBlock, RoamPage } from './types';

export class RoamClient {
  private api: any;
  private config: RoamConfig;

  constructor(config: RoamConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize the graph connection
      this.api = await RoamPrivateApi.initializeGraph({
        graph: this.config.graphName,
        token: this.config.apiToken,
        url: 'https://api.roamresearch.com'
      });

      // Test the connection with a simple query
      await this.query('[:find ?e :where [?e :db/id] :limit 1]');
    } catch (error) {
      throw new Error(`Failed to initialize Roam API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async query(query: string, limit?: number): Promise<any[]> {
    try {
      return await RoamPrivateApi.q(this.api, query, limit);
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pull(selector: string, uid: string): Promise<any> {
    try {
      return await RoamPrivateApi.pull(this.api, selector, uid);
    } catch (error) {
      throw new Error(`Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBlock(parentUid: string, content: string, order?: number | 'last'): Promise<string> {
    try {
      const block = {
        action: 'create-block',
        location: { 'parent-uid': parentUid, order: order || 'last' },
        block: { string: content }
      };
      
      const result = await RoamPrivateApi.createBlock(this.api, block);
      return result[':block/uid'];
    } catch (error) {
      throw new Error(`Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBlock(uid: string, content: string): Promise<void> {
    try {
      await RoamPrivateApi.updateBlock(this.api, {
        uid,
        string: content
      });
    } catch (error) {
      throw new Error(`Failed to update block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteBlock(uid: string): Promise<void> {
    try {
      await RoamPrivateApi.deleteBlock(this.api, { uid });
    } catch (error) {
      throw new Error(`Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPage(title: string): Promise<string> {
    try {
      const result = await RoamPrivateApi.createPage(this.api, { title });
      return result[':block/uid'];
    } catch (error) {
      throw new Error(`Failed to create page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPageByTitle(title: string): Promise<RoamPage | null> {
    try {
      const query = `[:find (pull ?page [:block/uid :node/title :block/children :create/time :edit/time :edit/email]) 
                      :where [?page :node/title "${title}"]]`;
      const results = await this.query(query);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0][0] as RoamPage;
    } catch (error) {
      throw new Error(`Failed to get page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchByText(searchText: string): Promise<any[]> {
    try {
      const query = `[:find (pull ?b [:block/uid :block/string :node/title :create/time :edit/time])
                      :where [?b :block/string ?s]
                             [(clojure.string/includes? ?s "${searchText}")]]`;
      return await this.query(query);
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatDateForRoam(date: Date = new Date()): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const suffix = this.getDaySuffix(day);
    
    return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
  }

  private getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}
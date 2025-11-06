const RoamPrivateApi = require('@roam-research/roam-api-sdk');
import { RoamConfig, RoamBlock, RoamPage } from './types';
import { escapeForDatalog, validateUid } from './utils/roam-format';

export class RoamClient {
  private api: any;
  private config: RoamConfig;
  private initialized: boolean = false;
  private lastRequestTime: number = 0;
  private requestQueue: Promise<any> = Promise.resolve();
  private readonly MIN_REQUEST_INTERVAL = 100; // ms between requests for rate limiting

  constructor(config: RoamConfig) {
    this.config = config;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async rateLimit<T>(operation: () => Promise<T>): Promise<T> {
    // Queue operations to avoid overwhelming the API
    this.requestQueue = this.requestQueue.then(async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      this.lastRequestTime = Date.now();
      return operation();
    });

    return this.requestQueue;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize the graph connection with timeout
      const timeout = this.config.defaultTimeout || 30000;
      const initPromise = RoamPrivateApi.initializeGraph({
        graph: this.config.graphName,
        token: this.config.apiToken,
        url: 'https://api.roamresearch.com'
      });

      this.api = await this.withTimeout(initPromise, timeout, 'Graph initialization');

      // Test the connection with a simple query
      await this.query('[:find ?e :where [?e :db/id] :limit 1]');

      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      throw new Error(`Failed to initialize Roam API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  async query(query: string, limit?: number): Promise<any[]> {
    return this.rateLimit(async () => {
      try {
        const timeout = this.config.defaultTimeout || 30000;
        return await this.withTimeout(
          RoamPrivateApi.q(this.api, query, limit),
          timeout,
          'Query execution'
        );
      } catch (error) {
        throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async pull(selector: string, uid: string): Promise<any> {
    if (!validateUid(uid)) {
      throw new Error(`Invalid UID format: ${uid}. UIDs must be exactly 9 alphanumeric characters, underscores, or hyphens.`);
    }

    return this.rateLimit(async () => {
      try {
        const timeout = this.config.defaultTimeout || 30000;
        return await this.withTimeout(
          RoamPrivateApi.pull(this.api, selector, uid),
          timeout,
          'Pull operation'
        );
      } catch (error) {
        throw new Error(`Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async createBlock(
    parentUid: string,
    content: string | { string: string; heading?: number; 'view-type'?: string; 'text-align'?: string },
    order?: number | 'last'
  ): Promise<string> {
    if (!validateUid(parentUid)) {
      throw new Error(`Invalid parent UID format: ${parentUid}`);
    }

    return this.rateLimit(async () => {
      try {
        const blockData = typeof content === 'string' ? { string: content } : content;

        const block = {
          action: 'create-block',
          location: { 'parent-uid': parentUid, order: order || 'last' },
          block: blockData
        };

        const result = await RoamPrivateApi.createBlock(this.api, block);
        return result[':block/uid'];
      } catch (error) {
        throw new Error(`Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async updateBlock(uid: string, content: string): Promise<void> {
    if (!validateUid(uid)) {
      throw new Error(`Invalid UID format: ${uid}`);
    }

    return this.rateLimit(async () => {
      try {
        await RoamPrivateApi.updateBlock(this.api, {
          uid,
          string: content
        });
      } catch (error) {
        throw new Error(`Failed to update block: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async deleteBlock(uid: string): Promise<void> {
    if (!validateUid(uid)) {
      throw new Error(`Invalid UID format: ${uid}`);
    }

    return this.rateLimit(async () => {
      try {
        await RoamPrivateApi.deleteBlock(this.api, { uid });
      } catch (error) {
        throw new Error(`Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async createPage(title: string): Promise<string> {
    if (!title || title.trim() === '') {
      throw new Error('Page title cannot be empty');
    }

    return this.rateLimit(async () => {
      try {
        const result = await RoamPrivateApi.createPage(this.api, { title });
        return result[':block/uid'];
      } catch (error) {
        throw new Error(`Failed to create page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async updatePage(uid: string, title: string): Promise<void> {
    if (!validateUid(uid)) {
      throw new Error(`Invalid UID format: ${uid}`);
    }
    if (!title || title.trim() === '') {
      throw new Error('Page title cannot be empty');
    }

    return this.rateLimit(async () => {
      try {
        await RoamPrivateApi.updatePage(this.api, {
          page: { uid },
          title
        });
      } catch (error) {
        throw new Error(`Failed to update page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async getPageByTitle(title: string): Promise<RoamPage | null> {
    try {
      const escapedTitle = escapeForDatalog(title);
      const query = `[:find (pull ?page [:block/uid :node/title :block/children :create/time :edit/time :edit/email])
                      :where [?page :node/title "${escapedTitle}"]]`;
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
      const escapedText = escapeForDatalog(searchText);
      const query = `[:find (pull ?b [:block/uid :block/string :node/title :create/time :edit/time])
                      :where [?b :block/string ?s]
                             [(clojure.string/includes? ?s "${escapedText}")]]`;
      return await this.query(query);
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async moveBlock(uid: string, newParentUid: string, order?: number | 'last'): Promise<void> {
    if (!validateUid(uid)) {
      throw new Error(`Invalid UID format: ${uid}`);
    }
    if (!validateUid(newParentUid)) {
      throw new Error(`Invalid parent UID format: ${newParentUid}`);
    }

    return this.rateLimit(async () => {
      try {
        await RoamPrivateApi.moveBlock(this.api, {
          block: { uid },
          location: { 'parent-uid': newParentUid, order: order || 'last' }
        });
      } catch (error) {
        throw new Error(`Failed to move block: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
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
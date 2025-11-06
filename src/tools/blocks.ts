import { RoamClient } from '../roam-client';
import { RoamBlock } from '../types';

export class BlockTools {
  constructor(private client: RoamClient) {}

  async createBlock(args: {
    parentUid: string;
    content: string;
    order?: number | 'first' | 'last';
    heading?: number;
    viewType?: 'bullet' | 'numbered' | 'document';
  }): Promise<{ uid: string; message: string }> {
    const block: any = { string: args.content };

    if (args.heading) {
      block.heading = args.heading;
    }

    if (args.viewType) {
      block['view-type'] = args.viewType;
    }

    let order: number | 'last' = 'last';
    if (typeof args.order === 'number') {
      order = args.order;
    } else if (args.order === 'first') {
      order = 0;
    }

    // Pass the full block object with all properties
    const uid = await this.client.createBlock(
      args.parentUid,
      block,
      typeof order === 'number' ? order : undefined
    );

    return {
      uid,
      message: `Block created successfully under parent ${args.parentUid}`
    };
  }

  async updateBlock(args: {
    uid: string;
    content: string;
  }): Promise<{ success: boolean; message: string }> {
    await this.client.updateBlock(args.uid, args.content);
    
    return { 
      success: true, 
      message: `Block ${args.uid} updated successfully` 
    };
  }

  async deleteBlock(args: {
    uid: string;
  }): Promise<{ success: boolean; message: string }> {
    await this.client.deleteBlock(args.uid);
    
    return { 
      success: true, 
      message: `Block ${args.uid} deleted successfully` 
    };
  }

  async getBlockTree(args: {
    uid: string;
    depth?: number;
  }): Promise<RoamBlock> {
    const selector = this.buildPullSelector(args.depth || 10);
    const result = await this.client.pull(selector, args.uid);
    
    return result as RoamBlock;
  }

  async moveBlock(args: {
    uid: string;
    newParentUid: string;
    order?: number | 'first' | 'last';
  }): Promise<{ success: boolean; message: string }> {
    // Verify block exists before attempting to move
    const block = await this.getBlockTree({ uid: args.uid, depth: 0 });

    if (!block) {
      throw new Error(`Block ${args.uid} not found`);
    }

    let order: number | 'last' = 'last';
    if (typeof args.order === 'number') {
      order = args.order;
    } else if (args.order === 'first') {
      order = 0;
    }

    // Use the native moveBlock API which preserves UIDs, references, and metadata
    await this.client.moveBlock(
      args.uid,
      args.newParentUid,
      typeof order === 'number' ? order : undefined
    );

    return {
      success: true,
      message: `Block moved successfully to new parent ${args.newParentUid}`
    };
  }

  private buildPullSelector(depth: number): string {
    let selector = '[:block/uid :block/string :block/order :block/heading :view-type :text-align';
    
    if (depth > 0) {
      selector += ' {:block/children ...}';
    }
    
    selector += ']';
    
    if (depth > 1) {
      for (let i = 1; i < depth; i++) {
        selector = selector.replace('...', '[:block/uid :block/string :block/order :block/heading :view-type {:block/children ...}]');
      }
      selector = selector.replace('...', '[:block/uid :block/string :block/order :block/heading :view-type]');
    }
    
    return selector;
  }
}
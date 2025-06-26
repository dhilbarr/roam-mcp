import { RoamClient } from '../roam-client';
import { TodoItem } from '../types';
import { createTodoBlock } from '../utils/roam-format';

export class DailyTools {
  constructor(private client: RoamClient) {}

  async getDailyNote(args: {
    date?: string;
    createIfMissing?: boolean;
  }): Promise<{ uid: string; title: string; exists: boolean }> {
    const dateObj = args.date ? new Date(args.date) : new Date();
    const dailyTitle = this.client.formatDateForRoam(dateObj);
    
    const existingPage = await this.client.getPageByTitle(dailyTitle);
    
    if (existingPage) {
      return {
        uid: existingPage.uid,
        title: dailyTitle,
        exists: true
      };
    }

    if (args.createIfMissing !== false) {
      const uid = await this.client.createPage(dailyTitle);
      return {
        uid,
        title: dailyTitle,
        exists: false
      };
    }

    throw new Error(`Daily note for ${dailyTitle} does not exist`);
  }

  async addToDaily(args: {
    content: string | string[];
    date?: string;
    position?: 'top' | 'bottom';
  }): Promise<{ success: boolean; message: string }> {
    const daily = await this.getDailyNote({ 
      date: args.date, 
      createIfMissing: true 
    });

    const contents = Array.isArray(args.content) ? args.content : [args.content];
    
    if (args.position === 'top') {
      for (let i = contents.length - 1; i >= 0; i--) {
        await this.client.createBlock(daily.uid, contents[i], 0);
      }
    } else {
      for (const content of contents) {
        await this.client.createBlock(daily.uid, content);
      }
    }

    return {
      success: true,
      message: `Added ${contents.length} block(s) to ${daily.title}`
    };
  }

  async createTodo(args: {
    task: string;
    date?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<{ uid: string; message: string }> {
    const daily = await this.getDailyNote({ 
      date: args.date, 
      createIfMissing: true 
    });

    let todoText = args.task;
    if (args.priority) {
      todoText = `#priority/${args.priority} ${todoText}`;
    }

    const todoBlock = createTodoBlock(todoText, false);
    const uid = await this.client.createBlock(daily.uid, todoBlock.string);

    return {
      uid,
      message: `TODO created in ${daily.title}`
    };
  }

  async listTodos(args: {
    includeCompleted?: boolean;
    daysBack?: number;
    tag?: string;
  }): Promise<TodoItem[]> {
    const daysBack = args.daysBack || 30;
    const startTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    
    let query = `[:find (pull ?b [:block/uid :block/string]) (pull ?page [:node/title])
                  :where [?b :block/string ?s]`;
    
    if (args.includeCompleted) {
      query += ' [(or (clojure.string/includes? ?s "{{[[TODO]]}}") (clojure.string/includes? ?s "{{[[DONE]]}}"))]';
    } else {
      query += ' [(clojure.string/includes? ?s "{{[[TODO]]}}"))]';
    }
    
    if (args.tag) {
      const tagName = args.tag.startsWith('#') ? args.tag.substring(1) : args.tag;
      query += ` [?tag :node/title "${tagName}"] [?b :block/refs ?tag]`;
    }
    
    query += ` [?b :create/time ?time] [(> ?time ${startTime})]`;
    query += ' [?b :block/parents ?page] [?page :node/title]]';
    
    const results = await this.client.query(query);
    
    return results.map(r => {
      const block = r[0];
      const page = r[1];
      const isDone = block.string.includes('{{[[DONE]]}}');
      
      return {
        uid: block.uid,
        string: block.string,
        todo: true,
        done: isDone,
        page: page.title
      };
    });
  }

  async completeTodo(args: {
    uid: string;
  }): Promise<{ success: boolean; message: string }> {
    const block = await this.client.pull('[:block/string]', args.uid);
    
    if (!block || !block.string) {
      throw new Error(`Block ${args.uid} not found`);
    }

    if (!block.string.includes('{{[[TODO]]}}')) {
      throw new Error('Block is not a TODO item');
    }

    const updatedString = block.string.replace('{{[[TODO]]}}', '{{[[DONE]]}}');
    await this.client.updateBlock(args.uid, updatedString);

    return {
      success: true,
      message: 'TODO marked as complete'
    };
  }

  async getRecentDailyNotes(args: {
    days?: number;
  }): Promise<Array<{ uid: string; title: string; blockCount: number }>> {
    const days = args.days || 7;
    const dailyNotes = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const title = this.client.formatDateForRoam(date);
      
      const page = await this.client.getPageByTitle(title);
      if (page) {
        const blockCount = page.children?.length || 0;
        dailyNotes.push({
          uid: page.uid,
          title,
          blockCount
        });
      }
    }
    
    return dailyNotes;
  }
}
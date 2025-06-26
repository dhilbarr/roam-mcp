import { RoamClient } from '../roam-client';
import { SearchResult } from '../types';
import { escapeForDatalog } from '../utils/roam-format';

export class SearchTools {
  constructor(private client: RoamClient) {}

  async searchByText(args: {
    searchText: string;
    caseSensitive?: boolean;
    limit?: number;
  }): Promise<SearchResult[]> {
    const escapedText = escapeForDatalog(args.searchText);
    const searchFunc = args.caseSensitive ? 'clojure.string/includes?' : 
      '(fn [s t] (clojure.string/includes? (clojure.string/lower-case s) (clojure.string/lower-case t)))';
    
    const query = `[:find (pull ?b [:block/uid :block/string :node/title :create/time :edit/time])
                    :where [?b :block/string ?s]
                           [${searchFunc} ?s "${escapedText}"]]`;
    
    const results = await this.client.query(query);
    const searchResults = results.map(r => r[0] as SearchResult);
    
    searchResults.sort((a, b) => (b['edit-time'] || 0) - (a['edit-time'] || 0));
    
    if (args.limit) {
      return searchResults.slice(0, args.limit);
    }
    
    return searchResults;
  }

  async searchByTag(args: {
    tag: string;
    includeChildren?: boolean;
    limit?: number;
  }): Promise<SearchResult[]> {
    const tagName = args.tag.startsWith('#') ? args.tag.substring(1) : args.tag;
    
    let query = `[:find (pull ?b [:block/uid :block/string :create/time :edit/time])
                  :where [?tag :node/title "${tagName}"]
                         [?b :block/refs ?tag]`;
    
    if (args.includeChildren) {
      query += ' [?b :block/parents ?parent]';
    }
    
    query += ']';
    
    const results = await this.client.query(query);
    const searchResults = results.map(r => r[0] as SearchResult);
    
    searchResults.sort((a, b) => (b['edit-time'] || 0) - (a['edit-time'] || 0));
    
    if (args.limit) {
      return searchResults.slice(0, args.limit);
    }
    
    return searchResults;
  }

  async searchReferences(args: {
    pageTitle?: string;
    blockUid?: string;
    includeLinked?: boolean;
    includeUnlinked?: boolean;
  }): Promise<{
    linked: SearchResult[];
    unlinked?: SearchResult[];
  }> {
    if (!args.pageTitle && !args.blockUid) {
      throw new Error('Either pageTitle or blockUid must be provided');
    }

    const linked: SearchResult[] = [];
    const unlinked: SearchResult[] = [];

    if (args.pageTitle) {
      const linkedQuery = `[:find (pull ?b [:block/uid :block/string :create/time :edit/time])
                           :where [?page :node/title "${args.pageTitle}"]
                                  [?b :block/refs ?page]]`;
      
      const linkedResults = await this.client.query(linkedQuery);
      linked.push(...linkedResults.map(r => r[0] as SearchResult));

      if (args.includeUnlinked !== false) {
        const unlinkedQuery = `[:find (pull ?b [:block/uid :block/string :create/time :edit/time])
                               :where [?b :block/string ?s]
                                      [(clojure.string/includes? ?s "${args.pageTitle}")]
                                      (not [?page :node/title "${args.pageTitle}"]
                                           [?b :block/refs ?page])]`;
        
        const unlinkedResults = await this.client.query(unlinkedQuery);
        unlinked.push(...unlinkedResults.map(r => r[0] as SearchResult));
      }
    } else if (args.blockUid) {
      const linkedQuery = `[:find (pull ?b [:block/uid :block/string :create/time :edit/time])
                           :where [?ref :block/uid "${args.blockUid}"]
                                  [?b :block/refs ?ref]]`;
      
      const linkedResults = await this.client.query(linkedQuery);
      linked.push(...linkedResults.map(r => r[0] as SearchResult));
    }

    const result: any = { linked };
    if (args.includeUnlinked !== false && unlinked.length > 0) {
      result.unlinked = unlinked;
    }

    return result;
  }

  async findOrphanPages(args: {
    excludeDaily?: boolean;
  }): Promise<Array<{ uid: string; title: string; time?: number }>> {
    let query = `[:find (pull ?page [:block/uid :node/title :create/time])
                  :where [?page :node/title ?title]
                         (not [?other :block/refs ?page])`;
    
    if (args.excludeDaily !== false) {
      query += ' [(not (re-matches #"^[A-Za-z]+ \\d{1,2}(st|nd|rd|th), \\d{4}$" ?title))]';
    }
    
    query += ']';
    
    const results = await this.client.query(query);
    return results.map(r => r[0]).filter(p => p.title);
  }

  async searchByDate(args: {
    date?: string;
    startDate?: string;
    endDate?: string;
    modifiedOnly?: boolean;
  }): Promise<SearchResult[]> {
    if (!args.date && (!args.startDate || !args.endDate)) {
      throw new Error('Either date or both startDate and endDate must be provided');
    }

    let query: string;
    
    if (args.date) {
      query = `[:find (pull ?b [:block/uid :block/string :node/title :create/time :edit/time])
               :where [?b ${args.modifiedOnly ? ':edit/time' : ':create/time'} ?time]
                      [(= (quot ?time 86400000) (quot ${new Date(args.date).getTime()} 86400000))]]`;
    } else {
      const startTime = new Date(args.startDate!).getTime();
      const endTime = new Date(args.endDate!).getTime();
      
      query = `[:find (pull ?b [:block/uid :block/string :node/title :create/time :edit/time])
               :where [?b ${args.modifiedOnly ? ':edit/time' : ':create/time'} ?time]
                      [(>= ?time ${startTime})]
                      [(<= ?time ${endTime})]]`;
    }
    
    const results = await this.client.query(query);
    return results.map(r => r[0] as SearchResult);
  }
}
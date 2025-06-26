declare module '@roam-research/roam-api-sdk' {
  export default class RoamPrivateApi {
    constructor(graphName: string, apiToken: string, apiUrl?: string);
    graph: {
      q: (query: string, limit?: number) => Promise<any[]>;
      pull: (selector: string, uid: string) => Promise<any>;
      createBlock: (block: any) => Promise<any>;
      updateBlock: (block: any) => Promise<void>;
      deleteBlock: (block: any) => Promise<void>;
      createPage: (page: any) => Promise<any>;
    };
  }
}
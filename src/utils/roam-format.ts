export function parseRoamRefs(text: string): string[] {
  const pageRefRegex = /\[\[([^\]]+)\]\]/g;
  const blockRefRegex = /\(\(([a-zA-Z0-9_-]{9})\)\)/g;
  const tagRegex = /#[\w-]+/g;
  
  const refs: string[] = [];
  
  let match;
  while ((match = pageRefRegex.exec(text)) !== null) {
    refs.push(match[1]);
  }
  
  while ((match = blockRefRegex.exec(text)) !== null) {
    refs.push(match[1]);
  }
  
  while ((match = tagRegex.exec(text)) !== null) {
    refs.push(match[0]);
  }
  
  return [...new Set(refs)];
}

export function formatAsRoamBlock(text: string, options?: {
  heading?: number;
  viewType?: 'bullet' | 'numbered' | 'document';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}): any {
  const block: any = { string: text };
  
  if (options?.heading) {
    block.heading = options.heading;
  }
  
  if (options?.viewType) {
    block['view-type'] = options.viewType;
  }
  
  if (options?.textAlign) {
    block['text-align'] = options.textAlign;
  }
  
  return block;
}

export function createTodoBlock(text: string, done: boolean = false): any {
  const todoPrefix = done ? '{{[[DONE]]}}' : '{{[[TODO]]}}';
  return {
    string: `${todoPrefix} ${text}`
  };
}

export function parseRoamDate(dateString: string): Date | null {
  const roamDateRegex = /^([A-Za-z]+)\s+(\d{1,2})(st|nd|rd|th),\s+(\d{4})$/;
  const match = dateString.match(roamDateRegex);
  
  if (!match) {
    return null;
  }
  
  const [_, month, day, _suffix, year] = match;
  const monthIndex = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].indexOf(month);
  
  if (monthIndex === -1) {
    return null;
  }
  
  return new Date(parseInt(year), monthIndex, parseInt(day));
}

export function escapeForDatalog(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
}
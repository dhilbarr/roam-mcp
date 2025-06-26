import { RoamBlock } from '../types';

export function roamToMarkdown(block: RoamBlock, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = '';
  
  if (block.heading) {
    result += '#'.repeat(block.heading) + ' ';
  } else if (indent > 0) {
    result += indentStr + '- ';
  }
  
  let text = block.string || '';
  
  text = text.replace(/\{\{[[TODO]]\}\}/g, '- [ ]');
  text = text.replace(/\{\{[[DONE]]\}\}/g, '- [x]');
  
  text = text.replace(/\[\[([^\]]+)\]\]/g, '[$1]($1)');
  
  text = text.replace(/\(\(([a-zA-Z0-9_-]{9})\)\)/g, '(($1))');
  
  result += text;
  
  if (block.children && block.children.length > 0) {
    result += '\n';
    for (const child of block.children) {
      result += roamToMarkdown(child, indent + 1) + '\n';
    }
  }
  
  return result.trimEnd();
}

export function markdownToRoam(markdown: string): RoamBlock[] {
  const lines = markdown.split('\n');
  const blocks: RoamBlock[] = [];
  const stack: { block: RoamBlock; level: number }[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const [_, hashes, content] = headingMatch;
      const block: RoamBlock = {
        uid: generateUid(),
        string: convertMarkdownToRoam(content),
        heading: hashes.length as any
      };
      blocks.push(block);
      stack.length = 0;
      continue;
    }
    
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (bulletMatch) {
      const [_, spaces, content] = bulletMatch;
      const level = Math.floor(spaces.length / 2);
      const block: RoamBlock = {
        uid: generateUid(),
        string: convertMarkdownToRoam(content)
      };
      
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length > 0) {
        const parent = stack[stack.length - 1].block;
        if (!parent.children) parent.children = [];
        parent.children.push(block);
      } else {
        blocks.push(block);
      }
      
      stack.push({ block, level });
      continue;
    }
    
    const block: RoamBlock = {
      uid: generateUid(),
      string: convertMarkdownToRoam(trimmed)
    };
    blocks.push(block);
    stack.length = 0;
  }
  
  return blocks;
}

function convertMarkdownToRoam(text: string): string {
  text = text.replace(/- \[ \]/g, '{{[[TODO]]}}');
  text = text.replace(/- \[x\]/g, '{{[[DONE]]}}');
  
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '[[$1]]');
  
  text = text.replace(/#(\w+)/g, '#$1');
  
  return text;
}

function generateUid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let uid = '';
  for (let i = 0; i < 9; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uid;
}
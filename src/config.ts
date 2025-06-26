import * as dotenv from 'dotenv';
import { RoamConfig } from './types';

dotenv.config();

export function loadConfig(): RoamConfig {
  const apiToken = process.env.ROAM_API_TOKEN;
  const graphName = process.env.ROAM_GRAPH_NAME;

  if (!apiToken) {
    throw new Error('ROAM_API_TOKEN environment variable is required');
  }

  if (!graphName) {
    throw new Error('ROAM_GRAPH_NAME environment variable is required');
  }

  return {
    apiToken,
    graphName,
    dailyNoteFormat: process.env.DAILY_NOTE_FORMAT || 'MMMM Do, YYYY',
    defaultTimeout: process.env.DEFAULT_TIMEOUT ? parseInt(process.env.DEFAULT_TIMEOUT) : 30000
  };
}

export function validateConfig(config: RoamConfig): void {
  if (!config.apiToken || config.apiToken.trim() === '') {
    throw new Error('API token cannot be empty');
  }

  if (!config.graphName || config.graphName.trim() === '') {
    throw new Error('Graph name cannot be empty');
  }

  if (config.defaultTimeout && config.defaultTimeout < 1000) {
    throw new Error('Default timeout must be at least 1000ms');
  }
}
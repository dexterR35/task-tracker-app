// Centralized task-related select options shared by TaskForm and inline table editing.
// Modify here to propagate changes across the app.

export const marketOptions = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia Pacific' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'global', label: 'Global' },
  { value: 'australia', label: 'Australia' },
  { value: 'canada', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' }
];

export const productOptions = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'mobile-app', label: 'Mobile Application' },
  { value: 'desktop-app', label: 'Desktop Application' },
  { value: 'api', label: 'API/Backend' },
  { value: 'database', label: 'Database' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'analytics', label: 'Analytics Platform' },
  { value: 'ecommerce', label: 'E-commerce Platform' },
  { value: 'cms', label: 'Content Management System' },
  { value: 'crm', label: 'Customer Relationship Management' }
];

export const taskNameOptions = [
  { value: 'video', label: 'Video Production' },
  { value: 'design', label: 'Design' },
  { value: 'dev', label: 'Development' }
];

export const aiModelOptions = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5', label: 'GPT-3.5' },
  { value: 'claude-3', label: 'Claude 3' },
  { value: 'claude-2', label: 'Claude 2' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'llama-2', label: 'Llama 2' },
  { value: 'codex', label: 'Codex' },
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'stable-diffusion', label: 'Stable Diffusion' }
];

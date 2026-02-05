const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error || 'Unknown API error');
  }
  
  return json.data;
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error || 'Unknown API error');
  }
  
  return json.data;
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error || 'Unknown API error');
  }
  
  return json.data;
}

// Helper to build query strings
export function buildQuery(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  
  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
}

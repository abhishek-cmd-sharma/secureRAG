const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('securerag_jwt_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('securerag_jwt_token', token);
    } else {
      localStorage.removeItem('securerag_jwt_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    // If body is NOT FormData, set application/json
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include' // Sends HttpOnly cookie if supported
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle CSV export blob
      if (response.headers.get('content-type')?.includes('text/csv')) {
        return response.blob();
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Health check endpoint
  async getHealth() {
    return this.request('/health');
  }

  // Auth endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(name, email, password, organizationSlug) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password, organizationSlug }
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Dashboard endpoints
  async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  async getDashboardActivity() {
    return this.request('/dashboard/activity');
  }

  // Documents endpoints
  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/documents${query ? `?${query}` : ''}`);
  }

  async getDocumentById(id) {
    return this.request(`/documents/${id}`);
  }

  async uploadDocument(formData) {
    return this.request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  }

  async reindexDocument(id) {
    return this.request(`/documents/${id}/reindex`, {
      method: 'POST'
    });
  }

  async getDocumentStatus(id) {
    return this.request(`/documents/${id}/status`);
  }

  // RAG Chat & Document Intelligence endpoints
  async askQuestion(question, documentScope = 'all', conversationId = null) {
    const payload = { question, conversationId };
    if (Array.isArray(documentScope)) {
      payload.documentIds = documentScope;
    } else {
      payload.documentId = documentScope;
    }
    return this.request('/chat/ask', {
      method: 'POST',
      body: payload
    });
  }

  async summarizeDocument(documentId, summaryType = 'detailed') {
    return this.request('/chat/summarize', {
      method: 'POST',
      body: { documentId, summaryType }
    });
  }

  async compareDocuments(documentIds, comparisonFields = []) {
    return this.request('/chat/compare', {
      method: 'POST',
      body: { documentIds, comparisonFields }
    });
  }

  async extractDocumentInfo(documentId, extractionType = 'technologies', customSchema = null) {
    return this.request('/chat/extract', {
      method: 'POST',
      body: { documentId, extractionType, customSchema }
    });
  }

  async getConversations() {
    return this.request('/chat/conversations');
  }

  async getConversationById(id) {
    return this.request(`/chat/conversations/${id}`);
  }

  async deleteConversation(id) {
    return this.request(`/chat/conversations/${id}`, {
      method: 'DELETE'
    });
  }

  async createDocument(data) {
    return this.request('/documents', {
      method: 'POST',
      body: data
    });
  }

  async updateDocument(id, data) {
    return this.request(`/documents/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  // Users endpoints
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: data
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Organizations endpoints
  async getOrganizations() {
    return this.request('/organizations');
  }

  async getOrganizationById(id) {
    return this.request(`/organizations/${id}`);
  }

  async createOrganization(data) {
    return this.request('/organizations', {
      method: 'POST',
      body: data
    });
  }

  async updateOrganization(id, data) {
    return this.request(`/organizations/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  // Audit Logs endpoints
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  async exportAuditCsv() {
    return this.request('/audit-logs/export/csv');
  }
}

export const api = new ApiClient();

import { api } from './api';
import { 
  ProcessTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateFilter 
} from '../types/template.types';

class TemplateService {
  
  async getTemplates(filters: TemplateFilter = {}, page = 1, pageSize = 10) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
    if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await api.get(`/templates?${params.toString()}`);
    return response.data;
  }

  async getTemplateById(id: number) {
    const response = await api.get(`/templates/${id}`);
    return response.data.data;
  }

  async createTemplate(template: CreateTemplateRequest): Promise<ProcessTemplate> {
    const response = await api.post('/templates', template);
    return response.data.data;
  }

  async updateTemplate(id: number, template: UpdateTemplateRequest): Promise<ProcessTemplate> {
    const response = await api.put(`/templates/${id}`, template);
    return response.data.data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`/templates/${id}`);
  }

  async cloneTemplate(id: number): Promise<ProcessTemplate> {
    const response = await api.post(`/templates/${id}/clone`);
    return response.data.data;
  }

  async applyTemplate(id: number, processName?: string, customData?: any): Promise<any> {
    const response = await api.post(`/templates/${id}/apply`, {
      processName,
      customData
    });
    return response.data.data;
  }

  async getTemplateStatistics() {
    const response = await api.get('/templates/statistics');
    return response.data.data;
  }

  // Template marketplace methods
  async searchPublicTemplates(query: string, filters: TemplateFilter = {}) {
    return this.getTemplates({
      ...filters,
      search: query,
      isPublic: true
    });
  }

  async getFeaturedTemplates() {
    return this.getTemplates({
      isPublic: true,
      isVerified: true,
      minRating: 4.0
    }, 1, 6);
  }

  async getPopularTemplates() {
    const response = await api.get('/templates/statistics');
    return response.data.data.mostDownloaded;
  }

  async getRecentTemplates() {
    const response = await api.get('/templates/statistics');
    return response.data.data.recentlyCreated;
  }

  // Template validation
  async validateTemplate(template: CreateTemplateRequest | UpdateTemplateRequest): Promise<any> {
    // Client-side validation
    const errors: any = {};

    if (!template.name || template.name.trim().length < 3) {
      errors.name = 'Template name must be at least 3 characters long';
    }

    if (!template.description || template.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    if (!template.category) {
      errors.category = 'Category is required';
    }

    if (!template.industry) {
      errors.industry = 'Industry is required';
    }

    if (!template.processSteps || template.processSteps.length === 0) {
      errors.processSteps = 'At least one process step is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Template export/import
  async exportTemplate(id: number, format: 'json' | 'yaml' | 'xml' = 'json') {
    const template = await this.getTemplateById(id);
    
    switch (format) {
      case 'json':
        return JSON.stringify(template, null, 2);
      case 'yaml':
        // Would need YAML library
        return JSON.stringify(template, null, 2);
      case 'xml':
        // Would need XML conversion
        return JSON.stringify(template, null, 2);
      default:
        return JSON.stringify(template, null, 2);
    }
  }

  async importTemplate(templateData: string, format: 'json' | 'yaml' | 'xml' = 'json'): Promise<CreateTemplateRequest> {
    let parsedTemplate;
    
    try {
      switch (format) {
        case 'json':
          parsedTemplate = JSON.parse(templateData);
          break;
        case 'yaml':
          // Would need YAML parser
          parsedTemplate = JSON.parse(templateData);
          break;
        case 'xml':
          // Would need XML parser
          parsedTemplate = JSON.parse(templateData);
          break;
        default:
          parsedTemplate = JSON.parse(templateData);
      }
    } catch (error) {
      throw new Error(`Invalid ${format} format`);
    }

    // Clean up template data for import
    const {
      id,
      organizationId,
      createdBy,
      createdAt,
      updatedAt,
      downloadCount,
      rating,
      reviews,
      ...cleanTemplate
    } = parsedTemplate;

    return cleanTemplate;
  }
}

export const templateService = new TemplateService();
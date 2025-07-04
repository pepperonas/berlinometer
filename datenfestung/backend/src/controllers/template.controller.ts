import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

// Mock data for templates - in real app this would use a database
let templates: any[] = [
  {
    id: 1,
    organizationId: 1,
    name: 'DSGVO Kundendatenverarbeitung',
    description: 'Vollständige Vorlage für die Verarbeitung von Kundendaten nach DSGVO',
    category: 'data_processing',
    industry: 'ecommerce',
    version: '1.0.0',
    isPublic: true,
    isVerified: true,
    createdBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    processSteps: [
      {
        id: 'step1',
        name: 'Datenerfassung',
        description: 'Erfassung von Kundenstammdaten',
        order: 1,
        isRequired: true,
        dataInputs: [],
        dataOutputs: [],
        processingPurpose: 'Kundenregistrierung',
        legalBasis: 'contract',
        securityLevel: 'medium',
        accessControls: [],
        fieldTemplates: []
      }
    ],
    
    dataMapping: {
      dataCategories: [],
      dataFlow: [],
      retentionRules: [],
      thirdPartySharing: []
    },
    
    securityControls: [
      {
        id: 'ctrl1',
        type: 'access_control',
        name: 'Benutzerauthentifizierung',
        description: 'Mehrstufige Authentifizierung für alle Benutzer',
        framework: 'iso27001',
        controlId: 'A.9.2.1',
        implementationLevel: 'defined',
        isRequired: true,
        automatedCheck: false,
        mitigatedThreats: ['Unauthorized Access'],
        riskReduction: 80,
        implementationGuidance: 'Implementierung von Multi-Faktor-Authentifizierung'
      }
    ],
    
    complianceRequirements: [
      {
        id: 'req1',
        framework: 'DSGVO',
        requirement: 'Rechtmäßigkeit der Verarbeitung',
        description: 'Verarbeitung ist nur rechtmäßig, wenn mindestens eine der Bedingungen des Artikels 6 erfüllt ist',
        article: 'Art. 6 DSGVO',
        isRequired: true,
        implementationNotes: 'Rechtsgrundlage klar definieren und dokumentieren'
      }
    ],
    
    riskAssessment: {
      id: 'risk1',
      methodology: 'standard',
      aiEnabled: true,
      confidenceScore: 85,
      dataTypes: [],
      processingActivities: [],
      technicalMeasures: [],
      organizationalMeasures: [],
      overallRisk: 'medium',
      riskScore: 45,
      aiRecommendations: [],
      requiredMeasures: []
    },
    
    tags: ['DSGVO', 'Kundendaten', 'E-Commerce'],
    downloadCount: 142,
    rating: 4.5,
    reviews: [],
    dependencies: [],
    parentTemplateId: null
  },
  
  {
    id: 2,
    organizationId: 1,
    name: 'ISO 27001 Risk Assessment',
    description: 'Standardvorlage für Risikoanalyse nach ISO 27001',
    category: 'security_assessment',
    industry: 'technology',
    version: '2.1.0',
    isPublic: true,
    isVerified: true,
    createdBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    processSteps: [
      {
        id: 'step1',
        name: 'Asset Identification',
        description: 'Identifikation und Klassifizierung von IT-Assets',
        order: 1,
        isRequired: true,
        dataInputs: [],
        dataOutputs: [],
        processingPurpose: 'Risikomanagement',
        legalBasis: 'legitimate_interests',
        securityLevel: 'high',
        accessControls: [],
        fieldTemplates: []
      }
    ],
    
    dataMapping: {
      dataCategories: [],
      dataFlow: [],
      retentionRules: [],
      thirdPartySharing: []
    },
    
    securityControls: [
      {
        id: 'ctrl1',
        type: 'monitoring',
        name: 'Security Monitoring',
        description: 'Kontinuierliche Überwachung der Sicherheitslage',
        framework: 'iso27001',
        controlId: 'A.12.6.1',
        implementationLevel: 'managed',
        isRequired: true,
        automatedCheck: true,
        mitigatedThreats: ['Advanced Persistent Threats'],
        riskReduction: 70,
        implementationGuidance: 'SIEM-System implementieren'
      }
    ],
    
    complianceRequirements: [],
    riskAssessment: {
      id: 'risk2',
      methodology: 'iso27005',
      aiEnabled: true,
      confidenceScore: 92,
      dataTypes: [],
      processingActivities: [],
      technicalMeasures: [],
      organizationalMeasures: [],
      overallRisk: 'high',
      riskScore: 72,
      aiRecommendations: [],
      requiredMeasures: []
    },
    
    tags: ['ISO 27001', 'Risikoanalyse', 'IT-Sicherheit'],
    downloadCount: 89,
    rating: 4.8,
    reviews: [],
    dependencies: [],
    parentTemplateId: null
  }
];

export class TemplateController {
  
  // @desc    Get all templates
  // @route   GET /api/templates
  // @access  Private
  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        industry,
        isPublic,
        isVerified,
        tags,
        minRating,
        page = 1,
        pageSize = 10
      } = req.query;

      let filteredTemplates = [...templates];

      // Apply filters
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredTemplates = filteredTemplates.filter(
          template => 
            template.name.toLowerCase().includes(searchTerm) ||
            template.description.toLowerCase().includes(searchTerm) ||
            template.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (category) {
        filteredTemplates = filteredTemplates.filter(
          template => template.category === category
        );
      }

      if (industry) {
        filteredTemplates = filteredTemplates.filter(
          template => template.industry === industry
        );
      }

      if (isPublic !== undefined) {
        filteredTemplates = filteredTemplates.filter(
          template => template.isPublic === (isPublic === 'true')
        );
      }

      if (isVerified !== undefined) {
        filteredTemplates = filteredTemplates.filter(
          template => template.isVerified === (isVerified === 'true')
        );
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        filteredTemplates = filteredTemplates.filter(
          template => tagArray.some(tag => template.tags.includes(tag))
        );
      }

      if (minRating) {
        const minRatingNum = parseFloat(minRating as string);
        filteredTemplates = filteredTemplates.filter(
          template => template.rating >= minRatingNum
        );
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const startIndex = (pageNum - 1) * pageSizeNum;
      const endIndex = startIndex + pageSizeNum;
      
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          templates: paginatedTemplates,
          totalCount: filteredTemplates.length,
          currentPage: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(filteredTemplates.length / pageSizeNum)
        }
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching templates'
        }
      });
    }
  }

  // @desc    Get template by ID
  // @route   GET /api/templates/:id
  // @access  Private
  async getTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Get template by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching template'
        }
      });
    }
  }

  // @desc    Create new template
  // @route   POST /api/templates
  // @access  Private
  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId || 1;

      const newTemplate = {
        id: templates.length + 1,
        organizationId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        rating: 0,
        reviews: [],
        dependencies: [],
        parentTemplateId: null,
        ...req.body
      };

      templates.push(newTemplate);

      res.status(201).json({
        success: true,
        data: newTemplate
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error creating template'
        }
      });
    }
  }

  // @desc    Update template
  // @route   PUT /api/templates/:id
  // @access  Private
  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const templateIndex = templates.findIndex(t => t.id === templateId);

      if (templateIndex === -1) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      const existingTemplate = templates[templateIndex];

      // Check permissions - only creator or admin can update
      if (existingTemplate.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to update this template'
          }
        });
        return;
      }

      // Update template
      const updatedTemplate = {
        ...existingTemplate,
        ...req.body,
        id: templateId,
        updatedAt: new Date().toISOString()
      };

      templates[templateIndex] = updatedTemplate;

      res.json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error updating template'
        }
      });
    }
  }

  // @desc    Delete template
  // @route   DELETE /api/templates/:id
  // @access  Private
  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const templateIndex = templates.findIndex(t => t.id === templateId);

      if (templateIndex === -1) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      const existingTemplate = templates[templateIndex];

      // Check permissions - only creator or admin can delete
      if (existingTemplate.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to delete this template'
          }
        });
        return;
      }

      // Remove template
      templates.splice(templateIndex, 1);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error deleting template'
        }
      });
    }
  }

  // @desc    Clone template
  // @route   POST /api/templates/:id/clone
  // @access  Private
  async cloneTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const sourceTemplate = templates.find(t => t.id === templateId);

      if (!sourceTemplate) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      const userId = req.user!.id;
      const organizationId = req.user!.organizationId || 1;

      const clonedTemplate = {
        ...sourceTemplate,
        id: templates.length + 1,
        organizationId,
        name: `${sourceTemplate.name} (Copy)`,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloadCount: 0,
        rating: 0,
        reviews: [],
        parentTemplateId: sourceTemplate.id,
        isPublic: false, // Cloned templates are private by default
        isVerified: false
      };

      templates.push(clonedTemplate);

      res.status(201).json({
        success: true,
        data: clonedTemplate
      });
    } catch (error) {
      console.error('Clone template error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error cloning template'
        }
      });
    }
  }

  // @desc    Apply template to create process
  // @route   POST /api/templates/:id/apply
  // @access  Private
  async applyTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      const { processName, customData } = req.body;

      // Create new process based on template
      const newProcess = {
        id: Math.floor(Math.random() * 1000) + 100,
        organizationId: req.user!.organizationId || 1,
        name: processName || `Process from ${template.name}`,
        templateId: template.id,
        templateVersion: template.version,
        
        // Copy template structure
        processSteps: template.processSteps.map((step: any) => ({
          ...step,
          id: `${step.id}_${Date.now()}` // Generate unique IDs
        })),
        
        dataMapping: { ...template.dataMapping },
        securityControls: template.securityControls.map((control: any) => ({
          ...control,
          id: `${control.id}_${Date.now()}`
        })),
        
        complianceRequirements: template.complianceRequirements,
        riskAssessment: {
          ...template.riskAssessment,
          id: `risk_${Date.now()}`
        },
        
        // Process-specific data
        status: 'draft',
        createdBy: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Apply custom data if provided
        ...customData
      };

      // Increment download count
      const templateIndex = templates.findIndex(t => t.id === templateId);
      if (templateIndex !== -1) {
        templates[templateIndex].downloadCount += 1;
      }

      res.status(201).json({
        success: true,
        data: newProcess,
        message: 'Template applied successfully'
      });
    } catch (error) {
      console.error('Apply template error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error applying template'
        }
      });
    }
  }

  // @desc    Get template statistics
  // @route   GET /api/templates/statistics
  // @access  Private
  async getTemplateStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = {
        totalTemplates: templates.length,
        publicTemplates: templates.filter(t => t.isPublic).length,
        verifiedTemplates: templates.filter(t => t.isVerified).length,
        
        categories: templates.reduce((acc: any, template) => {
          acc[template.category] = (acc[template.category] || 0) + 1;
          return acc;
        }, {}),
        
        industries: templates.reduce((acc: any, template) => {
          acc[template.industry] = (acc[template.industry] || 0) + 1;
          return acc;
        }, {}),
        
        topRated: templates
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map(t => ({ id: t.id, name: t.name, rating: t.rating })),
        
        mostDownloaded: templates
          .sort((a, b) => b.downloadCount - a.downloadCount)
          .slice(0, 5)
          .map(t => ({ id: t.id, name: t.name, downloadCount: t.downloadCount })),
        
        recentlyCreated: templates
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(t => ({ id: t.id, name: t.name, createdAt: t.createdAt }))
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get template statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching template statistics'
        }
      });
    }
  }
}
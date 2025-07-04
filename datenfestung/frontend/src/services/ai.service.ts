import { api } from './api';
import { 
  AIRiskAnalysisRequest, 
  AIRiskAnalysisResponse,
  AIChatMessage,
  AIChatSession
} from '../types/ai.types';

class AIService {
  
  async analyzeRisk(request: AIRiskAnalysisRequest): Promise<AIRiskAnalysisResponse> {
    const response = await api.post('/ai/analyze-risk', request);
    return response.data.data;
  }

  async getRecommendations(riskFactors: any, industry: string, organizationSize: string, existingControls?: string[]) {
    const response = await api.post('/ai/recommendations', {
      riskFactors,
      industry,
      organizationSize,
      existingControls
    });
    return response.data.data;
  }

  async chatWithAI(message: string, sessionId?: string, context?: any): Promise<{ response: AIChatMessage; sessionId: string }> {
    const response = await api.post('/ai/chat', {
      message,
      sessionId,
      context
    });
    return response.data.data;
  }

  async analyzeComplianceGaps(frameworks: string[], currentImplementation: any, organizationProfile: any) {
    const response = await api.post('/ai/compliance-gaps', {
      frameworks,
      currentImplementation,
      organizationProfile
    });
    return response.data.data;
  }

  async generateDocumentation(documentType: string, processData: any, template?: string) {
    const response = await api.post('/ai/generate-documentation', {
      documentType,
      processData,
      template
    });
    return response.data.data;
  }

  // Risk scoring utilities
  calculateOverallRiskScore(riskFactors: {
    dataPrivacyRisk: number;
    securityRisk: number;
    complianceRisk: number;
    operationalRisk: number;
    reputationalRisk: number;
  }): number {
    const weights = {
      dataPrivacyRisk: 0.25,
      securityRisk: 0.25,
      complianceRisk: 0.25,
      operationalRisk: 0.15,
      reputationalRisk: 0.10
    };

    return Object.entries(riskFactors).reduce((total, [factor, score]) => {
      const weight = weights[factor as keyof typeof weights] || 0;
      return total + (score * weight);
    }, 0);
  }

  getRiskLevelFromScore(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (score < 20) return 'very_low';
    if (score < 40) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'very_high';
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'very_low': return '#4caf50';
      case 'low': return '#8bc34a';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'very_high': return '#d32f2f';
      default: return '#757575';
    }
  }

  // AI prompt templates
  getPromptTemplates() {
    return [
      {
        id: 'risk_analysis',
        name: 'Risk Analysis',
        category: 'risk_analysis',
        prompt: 'Analyze the privacy and security risks for the following process: {processDescription}. Consider data types: {dataTypes}, data subjects: {dataSubjects}, and industry: {industry}.',
        variables: ['processDescription', 'dataTypes', 'dataSubjects', 'industry'],
        description: 'Comprehensive risk analysis for data processing activities'
      },
      {
        id: 'compliance_check',
        name: 'Compliance Check',
        category: 'compliance_check',
        prompt: 'Evaluate compliance with {framework} for the following scenario: {scenario}. Focus on requirements: {requirements}.',
        variables: ['framework', 'scenario', 'requirements'],
        description: 'Check compliance against specific frameworks'
      },
      {
        id: 'security_assessment',
        name: 'Security Assessment',
        category: 'security_assessment',
        prompt: 'Assess the security posture for: {systemDescription}. Current controls: {existingControls}. Identify gaps and recommendations.',
        variables: ['systemDescription', 'existingControls'],
        description: 'Security control assessment and gap analysis'
      }
    ];
  }

  // Validation helpers
  validateRiskAnalysisRequest(request: Partial<AIRiskAnalysisRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.processDescription || request.processDescription.trim().length < 20) {
      errors.push('Process description must be at least 20 characters long');
    }

    if (!request.dataTypes || request.dataTypes.length === 0) {
      errors.push('At least one data type must be specified');
    }

    if (!request.dataSubjects || request.dataSubjects.length === 0) {
      errors.push('At least one data subject category must be specified');
    }

    if (request.thirdPartySharing === undefined) {
      errors.push('Third party sharing must be specified');
    }

    if (!request.industry) {
      errors.push('Industry must be specified');
    }

    if (!request.organizationSize) {
      errors.push('Organization size must be specified');
    }

    if (!request.geographicScope) {
      errors.push('Geographic scope must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Chat session management
  private chatSessions: Map<string, AIChatSession> = new Map();

  createChatSession(title: string = 'New Chat'): AIChatSession {
    const session: AIChatSession = {
      id: `session_${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 1, // Would come from auth context
      userId: 1 // Would come from auth context
    };

    this.chatSessions.set(session.id, session);
    return session;
  }

  getChatSession(sessionId: string): AIChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  addMessageToSession(sessionId: string, message: AIChatMessage): void {
    const session = this.chatSessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      session.updatedAt = new Date().toISOString();
    }
  }

  getAllChatSessions(): AIChatSession[] {
    return Array.from(this.chatSessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  deleteChatSession(sessionId: string): boolean {
    return this.chatSessions.delete(sessionId);
  }

  // Utility methods for AI responses
  extractKeyInsights(analysisResponse: AIRiskAnalysisResponse): string[] {
    const insights: string[] = [];

    // Extract from recommendations
    analysisResponse.riskAssessment.recommendations.forEach(rec => {
      if (rec.priority === 'high' || rec.priority === 'critical') {
        insights.push(rec.recommendation);
      }
    });

    // Extract from compliance gaps
    analysisResponse.riskAssessment.complianceMapping.forEach(mapping => {
      mapping.requirements.forEach(req => {
        if (req.priority === 'high' || req.priority === 'critical') {
          insights.push(`${mapping.framework}: ${req.title}`);
        }
      });
    });

    return insights.slice(0, 5); // Return top 5 insights
  }

  formatRiskScore(score: number): string {
    return `${Math.round(score)}/100`;
  }

  formatConfidenceScore(score: number): string {
    if (score >= 90) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
  }

  // Export analysis results
  exportAnalysisResults(analysis: AIRiskAnalysisResponse, format: 'json' | 'csv' | 'pdf' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'csv':
        // Simple CSV export of key metrics
        const headers = 'Metric,Value\n';
        const rows = [
          `Overall Risk Score,${analysis.riskAssessment.riskScore}`,
          `Confidence Score,${analysis.riskAssessment.confidenceScore}`,
          `Risk Level,${analysis.riskAssessment.overallRisk}`,
          `Data Privacy Risk,${analysis.riskAssessment.riskFactors.dataPrivacyRisk}`,
          `Security Risk,${analysis.riskAssessment.riskFactors.securityRisk}`,
          `Compliance Risk,${analysis.riskAssessment.riskFactors.complianceRisk}`,
          `Operational Risk,${analysis.riskAssessment.riskFactors.operationalRisk}`,
          `Reputational Risk,${analysis.riskAssessment.riskFactors.reputationalRisk}`
        ].join('\n');
        return headers + rows;
      case 'pdf':
        // Would need PDF generation library
        return JSON.stringify(analysis, null, 2);
      default:
        return JSON.stringify(analysis, null, 2);
    }
  }
}

export const aiService = new AIService();
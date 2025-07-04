import { api } from './api';
import { 
  ProcessWorkflow,
  CreateProcessWorkflowRequest,
  UpdateProcessWorkflowRequest,
  ProcessWorkflowFilter,
  ProcessExecutionRequest,
  ProcessExecutionResponse,
  ProcessNode,
  ProcessConnection,
  WorkflowAnalytics
} from '../types/process-intelligence.types';

class ProcessIntelligenceService {
  
  // Workflow CRUD operations
  async getWorkflows(filters?: ProcessWorkflowFilter, page = 1, pageSize = 10) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await api.get(`/process-intelligence/workflows?${params}`);
    return response.data;
  }

  async getWorkflowById(id: string): Promise<ProcessWorkflow> {
    const response = await api.get(`/process-intelligence/workflows/${id}`);
    return response.data.data;
  }

  async createWorkflow(workflow: CreateProcessWorkflowRequest): Promise<ProcessWorkflow> {
    const response = await api.post('/process-intelligence/workflows', workflow);
    return response.data.data;
  }

  async updateWorkflow(id: string, workflow: UpdateProcessWorkflowRequest): Promise<ProcessWorkflow> {
    const response = await api.put(`/process-intelligence/workflows/${id}`, workflow);
    return response.data.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/process-intelligence/workflows/${id}`);
  }

  async cloneWorkflow(id: string, name?: string): Promise<ProcessWorkflow> {
    const response = await api.post(`/process-intelligence/workflows/${id}/clone`, { name });
    return response.data.data;
  }

  // Node operations
  async addNode(workflowId: string, node: Omit<ProcessNode, 'id'>): Promise<ProcessNode> {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/nodes`, node);
    return response.data.data;
  }

  async updateNode(workflowId: string, nodeId: string, node: Partial<ProcessNode>): Promise<ProcessNode> {
    const response = await api.put(`/process-intelligence/workflows/${workflowId}/nodes/${nodeId}`, node);
    return response.data.data;
  }

  async deleteNode(workflowId: string, nodeId: string): Promise<void> {
    await api.delete(`/process-intelligence/workflows/${workflowId}/nodes/${nodeId}`);
  }

  async moveNode(workflowId: string, nodeId: string, position: { x: number; y: number }): Promise<ProcessNode> {
    const response = await api.patch(`/process-intelligence/workflows/${workflowId}/nodes/${nodeId}/position`, position);
    return response.data.data;
  }

  // Connection operations
  async addConnection(workflowId: string, connection: Omit<ProcessConnection, 'id'>): Promise<ProcessConnection> {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/connections`, connection);
    return response.data.data;
  }

  async updateConnection(workflowId: string, connectionId: string, connection: Partial<ProcessConnection>): Promise<ProcessConnection> {
    const response = await api.put(`/process-intelligence/workflows/${workflowId}/connections/${connectionId}`, connection);
    return response.data.data;
  }

  async deleteConnection(workflowId: string, connectionId: string): Promise<void> {
    await api.delete(`/process-intelligence/workflows/${workflowId}/connections/${connectionId}`);
  }

  // Workflow execution
  async executeWorkflow(request: ProcessExecutionRequest): Promise<ProcessExecutionResponse> {
    const response = await api.post('/process-intelligence/execute', request);
    return response.data.data;
  }

  async getExecutionStatus(executionId: string): Promise<ProcessExecutionResponse> {
    const response = await api.get(`/process-intelligence/executions/${executionId}`);
    return response.data.data;
  }

  async cancelExecution(executionId: string): Promise<void> {
    await api.post(`/process-intelligence/executions/${executionId}/cancel`);
  }

  async pauseExecution(executionId: string): Promise<void> {
    await api.post(`/process-intelligence/executions/${executionId}/pause`);
  }

  async resumeExecution(executionId: string): Promise<void> {
    await api.post(`/process-intelligence/executions/${executionId}/resume`);
  }

  // Analytics and monitoring
  async getWorkflowAnalytics(workflowId: string, dateRange?: { start: string; end: string }): Promise<WorkflowAnalytics> {
    const params = dateRange ? new URLSearchParams(dateRange) : '';
    const response = await api.get(`/process-intelligence/workflows/${workflowId}/analytics?${params}`);
    return response.data.data;
  }

  async getExecutionHistory(workflowId: string, page = 1, pageSize = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    
    const response = await api.get(`/process-intelligence/workflows/${workflowId}/executions?${params}`);
    return response.data;
  }

  async getSystemMetrics() {
    const response = await api.get('/process-intelligence/metrics');
    return response.data.data;
  }

  // Validation and testing
  async validateWorkflow(workflowId: string) {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/validate`);
    return response.data.data;
  }

  async testWorkflow(workflowId: string, testData: Record<string, any>) {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/test`, { testData });
    return response.data.data;
  }

  // Import/Export
  async exportWorkflow(workflowId: string, format: 'json' | 'bpmn' | 'yaml' = 'json') {
    const response = await api.get(`/process-intelligence/workflows/${workflowId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importWorkflow(file: File, format: 'json' | 'bpmn' | 'yaml' = 'json'): Promise<ProcessWorkflow> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await api.post('/process-intelligence/workflows/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }

  // Templates and patterns
  async getWorkflowTemplates() {
    const response = await api.get('/process-intelligence/templates');
    return response.data.data;
  }

  async createFromTemplate(templateId: string, name: string, customization?: Record<string, any>): Promise<ProcessWorkflow> {
    const response = await api.post('/process-intelligence/templates/create', {
      templateId,
      name,
      customization
    });
    return response.data.data;
  }

  // Collaboration features
  async shareWorkflow(workflowId: string, userIds: number[], permissions: string[] = ['read']) {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/share`, {
      userIds,
      permissions
    });
    return response.data.data;
  }

  async getWorkflowComments(workflowId: string) {
    const response = await api.get(`/process-intelligence/workflows/${workflowId}/comments`);
    return response.data.data;
  }

  async addWorkflowComment(workflowId: string, comment: string, nodeId?: string) {
    const response = await api.post(`/process-intelligence/workflows/${workflowId}/comments`, {
      comment,
      nodeId
    });
    return response.data.data;
  }

  // Utility methods
  generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateConnectionId(): string {
    return `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateNodePosition(position: { x: number; y: number }): boolean {
    return position.x >= 0 && position.y >= 0 && 
           position.x <= 10000 && position.y <= 10000;
  }

  calculateWorkflowComplexity(workflow: ProcessWorkflow): number {
    const nodeComplexity = workflow.nodes.length;
    const connectionComplexity = workflow.connections.length * 0.5;
    const decisionComplexity = workflow.nodes.filter(n => n.type === 'decision').length * 2;
    const integrationComplexity = workflow.nodes.filter(n => n.type === 'integration').length * 1.5;
    
    return nodeComplexity + connectionComplexity + decisionComplexity + integrationComplexity;
  }

  findOptimizationOpportunities(workflow: ProcessWorkflow): string[] {
    const opportunities: string[] = [];
    
    // Check for unnecessary complexity
    if (workflow.nodes.length > 50) {
      opportunities.push('Consider breaking down into sub-workflows');
    }
    
    // Check for parallel opportunities
    const sequentialTasks = workflow.connections.filter(c => c.type === 'sequence').length;
    if (sequentialTasks > 10) {
      opportunities.push('Look for parallel execution opportunities');
    }
    
    // Check for bottlenecks
    const approvalNodes = workflow.nodes.filter(n => n.type === 'approval').length;
    if (approvalNodes > 5) {
      opportunities.push('Consider consolidating approval steps');
    }
    
    return opportunities;
  }

  // Workflow pattern detection
  detectPatterns(workflow: ProcessWorkflow): string[] {
    const patterns: string[] = [];
    
    // Approval pattern
    if (workflow.nodes.some(n => n.type === 'approval')) {
      patterns.push('approval_workflow');
    }
    
    // Loop pattern
    if (workflow.nodes.some(n => n.type === 'loop')) {
      patterns.push('iterative_process');
    }
    
    // Parallel pattern
    if (workflow.nodes.some(n => n.type === 'parallel')) {
      patterns.push('parallel_execution');
    }
    
    // Integration pattern
    if (workflow.nodes.some(n => n.type === 'integration')) {
      patterns.push('system_integration');
    }
    
    // Data processing pattern
    if (workflow.nodes.some(n => n.type === 'data')) {
      patterns.push('data_processing');
    }
    
    return patterns;
  }

  // Risk analysis
  analyzeWorkflowRisks(workflow: ProcessWorkflow): { risk: string; severity: string; mitigation: string }[] {
    const risks: { risk: string; severity: string; mitigation: string }[] = [];
    
    // Single point of failure
    const criticalNodes = workflow.nodes.filter(n => 
      workflow.connections.filter(c => c.sourceId === n.id).length > 3
    );
    
    if (criticalNodes.length > 0) {
      risks.push({
        risk: 'Single point of failure detected',
        severity: 'high',
        mitigation: 'Add redundancy or error handling'
      });
    }
    
    // Manual bottlenecks
    const manualTasks = workflow.nodes.filter(n => 
      n.type === 'task' && n.data.taskConfig?.automationLevel === 'manual'
    );
    
    if (manualTasks.length > workflow.nodes.length * 0.5) {
      risks.push({
        risk: 'High manual intervention required',
        severity: 'medium',
        mitigation: 'Consider automation opportunities'
      });
    }
    
    // Compliance risks
    const hasComplianceNodes = workflow.nodes.some(n => n.type === 'compliance_check');
    const hasDataProcessing = workflow.nodes.some(n => n.type === 'data');
    
    if (hasDataProcessing && !hasComplianceNodes) {
      risks.push({
        risk: 'Data processing without compliance checks',
        severity: 'high',
        mitigation: 'Add compliance validation steps'
      });
    }
    
    return risks;
  }
}

export const processIntelligenceService = new ProcessIntelligenceService();
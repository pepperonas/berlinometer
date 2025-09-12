import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'

interface AnalyticsQuery {
  tenantId: string
  dateRange?: {
    from: Date
    to: Date
  }
  customers?: string[]
  statuses?: string[]
  includeDetails?: boolean
}

interface EInvoiceMetrics {
  overview: {
    totalInvoices: number
    totalValue: number
    averageValue: number
    eInvoiceCount: number
    eInvoicePercentage: number
    complianceRate: number
  }
  formats: {
    xrechnung: {
      count: number
      percentage: number
      value: number
    }
    zugferd: {
      count: number
      percentage: number
      value: number
    }
    traditional: {
      count: number
      percentage: number
      value: number
    }
  }
  timeline: Array<{
    date: string
    totalInvoices: number
    eInvoices: number
    value: number
    complianceScore: number
  }>
  compliance: {
    averageScore: number
    distribution: {
      excellent: number // 95-100%
      good: number      // 80-94%
      fair: number      // 60-79%
      poor: number      // <60%
    }
    topIssues: Array<{
      issue: string
      count: number
      severity: 'error' | 'warning'
    }>
  }
  customers: Array<{
    id: string
    name: string
    invoiceCount: number
    eInvoiceCount: number
    totalValue: number
    complianceRate: number
    preferredFormat?: 'xrechnung' | 'zugferd'
  }>
  performance: {
    averageGenerationTime: number
    successRate: number
    errorRate: number
    mostCommonErrors: string[]
  }
  trends: {
    monthlyGrowth: number
    adoptionRate: number
    complianceImprovement: number
    valueGrowth: number
  }
}

interface ComplianceAnalytics {
  overallScore: number
  trends: Array<{
    date: string
    score: number
    issueCount: number
  }>
  categoryBreakdown: {
    structure: { score: number; issues: number }
    content: { score: number; issues: number }
    tax: { score: number; issues: number }
    format: { score: number; issues: number }
    business: { score: number; issues: number }
  }
  topIssues: Array<{
    ruleId: string
    ruleName: string
    frequency: number
    impact: 'high' | 'medium' | 'low'
    category: string
  }>
  recommendations: Array<{
    type: 'training' | 'process' | 'technical' | 'policy'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    expectedImpact: string
    effort: 'low' | 'medium' | 'high'
  }>
}

interface ExportAnalytics {
  totalExports: number
  successRate: number
  formats: {
    xrechnung: number
    zugferd: number
  }
  averageSize: number
  totalSize: number
  dailyVolume: Array<{
    date: string
    exports: number
    size: number
  }>
  popularExportOptions: Array<{
    option: string
    usage: number
    percentage: number
  }>
  errors: Array<{
    type: string
    count: number
    lastOccurred: Date
    resolution?: string
  }>
}

export class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async getEInvoiceMetrics(query: AnalyticsQuery): Promise<EInvoiceMetrics> {
    const cacheKey = `metrics:${JSON.stringify(query)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    // This would normally query the database
    // For demonstration, we'll return mock data with realistic structure
    
    const metrics: EInvoiceMetrics = {
      overview: {
        totalInvoices: 1250,
        totalValue: 485750.50,
        averageValue: 388.60,
        eInvoiceCount: 892,
        eInvoicePercentage: 71.4,
        complianceRate: 94.2,
      },
      formats: {
        xrechnung: {
          count: 534,
          percentage: 59.9,
          value: 205420.30,
        },
        zugferd: {
          count: 358,
          percentage: 40.1,
          value: 165890.80,
        },
        traditional: {
          count: 358,
          percentage: 28.6,
          value: 114439.40,
        },
      },
      timeline: this.generateTimelineData(query.dateRange),
      compliance: {
        averageScore: 94.2,
        distribution: {
          excellent: 742, // 95-100%
          good: 156,      // 80-94%
          fair: 78,       // 60-79%
          poor: 24,       // <60%
        },
        topIssues: [
          { issue: 'Missing customer VAT ID', count: 89, severity: 'warning' },
          { issue: 'Incomplete address information', count: 67, severity: 'warning' },
          { issue: 'Invalid tax rate', count: 23, severity: 'error' },
          { issue: 'Missing payment terms', count: 45, severity: 'warning' },
          { issue: 'Calculation errors', count: 12, severity: 'error' },
        ],
      },
      customers: await this.getCustomerAnalytics(query),
      performance: {
        averageGenerationTime: 2.3, // seconds
        successRate: 97.8,
        errorRate: 2.2,
        mostCommonErrors: [
          'XML validation failed',
          'PDF generation timeout',
          'Template rendering error',
          'Network connection error',
        ],
      },
      trends: {
        monthlyGrowth: 12.5, // percentage
        adoptionRate: 8.3,   // new e-invoices per month
        complianceImprovement: 3.2,
        valueGrowth: 15.8,
      },
    }

    this.setCache(cacheKey, metrics, this.CACHE_TTL)
    return metrics
  }

  async getComplianceAnalytics(query: AnalyticsQuery): Promise<ComplianceAnalytics> {
    const cacheKey = `compliance:${JSON.stringify(query)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const analytics: ComplianceAnalytics = {
      overallScore: 94.2,
      trends: this.generateComplianceTrends(query.dateRange),
      categoryBreakdown: {
        structure: { score: 98.5, issues: 12 },
        content: { score: 92.1, issues: 78 },
        tax: { score: 89.7, issues: 102 },
        format: { score: 96.8, issues: 32 },
        business: { score: 91.4, issues: 86 },
      },
      topIssues: [
        {
          ruleId: 'XR-21',
          ruleName: 'Supplier Tax ID Required',
          frequency: 89,
          impact: 'high',
          category: 'tax',
        },
        {
          ruleId: 'XR-30',
          ruleName: 'Customer Name Required',
          frequency: 67,
          impact: 'high',
          category: 'content',
        },
        {
          ruleId: 'XR-50',
          ruleName: 'Valid Tax Rates',
          frequency: 56,
          impact: 'medium',
          category: 'tax',
        },
        {
          ruleId: 'BR-01',
          ruleName: 'Due Date After Invoice Date',
          frequency: 45,
          impact: 'low',
          category: 'business',
        },
      ],
      recommendations: [
        {
          type: 'training',
          priority: 'high',
          title: 'Tax Information Training',
          description: 'Provide training on proper VAT ID and tax number requirements for E-Rechnung compliance',
          expectedImpact: 'Reduce tax-related compliance issues by 60%',
          effort: 'low',
        },
        {
          type: 'process',
          priority: 'high',
          title: 'Customer Data Validation',
          description: 'Implement mandatory customer information validation before invoice creation',
          expectedImpact: 'Eliminate customer information compliance issues',
          effort: 'medium',
        },
        {
          type: 'technical',
          priority: 'medium',
          title: 'Automated Compliance Checking',
          description: 'Add real-time compliance validation during invoice creation',
          expectedImpact: 'Increase compliance score to 98%+',
          effort: 'high',
        },
        {
          type: 'policy',
          priority: 'medium',
          title: 'Standardize Payment Terms',
          description: 'Establish company-wide standard payment terms and due date policies',
          expectedImpact: 'Improve business rule compliance by 40%',
          effort: 'low',
        },
      ],
    }

    this.setCache(cacheKey, analytics, this.CACHE_TTL)
    return analytics
  }

  async getExportAnalytics(query: AnalyticsQuery): Promise<ExportAnalytics> {
    const cacheKey = `exports:${JSON.stringify(query)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const analytics: ExportAnalytics = {
      totalExports: 1847,
      successRate: 97.8,
      formats: {
        xrechnung: 1124,
        zugferd: 723,
      },
      averageSize: 156.7, // KB
      totalSize: 289.4,   // MB
      dailyVolume: this.generateDailyVolumeData(query.dateRange),
      popularExportOptions: [
        { option: 'XRechnung XML', usage: 1124, percentage: 60.9 },
        { option: 'ZUGFeRD COMFORT', usage: 521, percentage: 28.2 },
        { option: 'ZUGFeRD BASIC', usage: 147, percentage: 8.0 },
        { option: 'ZUGFeRD EXTENDED', usage: 55, percentage: 2.9 },
      ],
      errors: [
        {
          type: 'Template rendering failed',
          count: 23,
          lastOccurred: new Date('2024-01-15T10:30:00Z'),
          resolution: 'Update template syntax',
        },
        {
          type: 'XML validation error',
          count: 18,
          lastOccurred: new Date('2024-01-14T15:45:00Z'),
          resolution: 'Fix data validation',
        },
        {
          type: 'PDF generation timeout',
          count: 12,
          lastOccurred: new Date('2024-01-13T09:20:00Z'),
          resolution: 'Increase timeout limit',
        },
      ],
    }

    this.setCache(cacheKey, analytics, this.CACHE_TTL)
    return analytics
  }

  async generateCustomReport(
    reportType: 'compliance' | 'performance' | 'adoption' | 'financial',
    query: AnalyticsQuery,
    options: {
      format: 'json' | 'csv' | 'pdf'
      includeCharts?: boolean
      customFields?: string[]
    }
  ): Promise<{
    reportId: string
    data: any
    generatedAt: Date
    format: string
    downloadUrl?: string
  }> {
    const reportId = `report_${reportType}_${Date.now()}`
    
    let data: any
    
    switch (reportType) {
      case 'compliance':
        data = await this.generateComplianceReport(query)
        break
      case 'performance':
        data = await this.generatePerformanceReport(query)
        break
      case 'adoption':
        data = await this.generateAdoptionReport(query)
        break
      case 'financial':
        data = await this.generateFinancialReport(query)
        break
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }

    // Format data according to requested format
    if (options.format === 'csv') {
      data = this.convertToCSV(data)
    } else if (options.format === 'pdf') {
      data = await this.generatePDFReport(data, reportType, options)
    }

    return {
      reportId,
      data,
      generatedAt: new Date(),
      format: options.format,
      downloadUrl: options.format !== 'json' ? `/api/v1/e-rechnung/reports/${reportId}/download` : undefined,
    }
  }

  private async generateComplianceReport(query: AnalyticsQuery): Promise<any> {
    return {
      title: 'E-Rechnung Compliance Report',
      period: query.dateRange,
      summary: {
        totalInvoices: 1250,
        compliantInvoices: 1178,
        complianceRate: 94.2,
        criticalIssues: 35,
        warnings: 156,
      },
      details: {
        ruleBreakdown: [
          { rule: 'XR-01: CustomizationID Required', violations: 0, severity: 'error' },
          { rule: 'XR-21: Supplier Tax ID Required', violations: 89, severity: 'error' },
          { rule: 'XR-30: Customer Name Required', violations: 67, severity: 'error' },
          // ... more rules
        ],
        recommendations: [
          'Implement automated tax ID validation',
          'Add customer information completeness checks',
          'Provide staff training on E-Rechnung requirements',
        ],
      },
    }
  }

  private async generatePerformanceReport(query: AnalyticsQuery): Promise<any> {
    return {
      title: 'E-Rechnung Performance Report',
      period: query.dateRange,
      summary: {
        totalExports: 1847,
        successRate: 97.8,
        averageTime: 2.3,
        errorRate: 2.2,
      },
      performance: {
        throughput: '15.2 invoices/minute',
        peakLoad: '45 concurrent exports',
        systemUptime: '99.8%',
      },
      issues: [
        'Template rendering failures: 23 occurrences',
        'PDF generation timeouts: 12 occurrences',
        'Network connectivity issues: 8 occurrences',
      ],
    }
  }

  private async generateAdoptionReport(query: AnalyticsQuery): Promise<any> {
    return {
      title: 'E-Rechnung Adoption Report',
      period: query.dateRange,
      adoption: {
        currentRate: 71.4,
        monthlyGrowth: 12.5,
        newUsers: 23,
        activeUsers: 156,
      },
      trends: {
        xrechnungGrowth: 15.2,
        zugferdGrowth: 8.7,
        traditionalDecline: -23.8,
      },
    }
  }

  private async generateFinancialReport(query: AnalyticsQuery): Promise<any> {
    return {
      title: 'E-Rechnung Financial Impact Report',
      period: query.dateRange,
      financial: {
        totalValue: 485750.50,
        eInvoiceValue: 371311.10,
        averageInvoiceValue: 388.60,
        processingCostSaved: 12450.00,
      },
      roi: {
        implementationCost: 25000.00,
        monthlySavings: 4150.00,
        paybackPeriod: '6.0 months',
        annualSavings: 49800.00,
      },
    }
  }

  private generateTimelineData(dateRange?: { from: Date; to: Date }): Array<{
    date: string
    totalInvoices: number
    eInvoices: number
    value: number
    complianceScore: number
  }> {
    const data = []
    const days = 30 // Last 30 days
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalInvoices: Math.floor(Math.random() * 50) + 20,
        eInvoices: Math.floor(Math.random() * 35) + 15,
        value: Math.floor(Math.random() * 20000) + 5000,
        complianceScore: Math.floor(Math.random() * 10) + 90,
      })
    }
    
    return data
  }

  private generateComplianceTrends(dateRange?: { from: Date; to: Date }): Array<{
    date: string
    score: number
    issueCount: number
  }> {
    const data = []
    const days = 30
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.floor(Math.random() * 15) + 85,
        issueCount: Math.floor(Math.random() * 20) + 5,
      })
    }
    
    return data
  }

  private generateDailyVolumeData(dateRange?: { from: Date; to: Date }): Array<{
    date: string
    exports: number
    size: number
  }> {
    const data = []
    const days = 30
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        exports: Math.floor(Math.random() * 80) + 20,
        size: Math.floor(Math.random() * 50) + 10, // MB
      })
    }
    
    return data
  }

  private async getCustomerAnalytics(query: AnalyticsQuery): Promise<Array<{
    id: string
    name: string
    invoiceCount: number
    eInvoiceCount: number
    totalValue: number
    complianceRate: number
    preferredFormat?: 'xrechnung' | 'zugferd'
  }>> {
    // Mock customer analytics data
    return [
      {
        id: '1',
        name: 'Stadt München',
        invoiceCount: 45,
        eInvoiceCount: 45,
        totalValue: 125000.00,
        complianceRate: 100.0,
        preferredFormat: 'xrechnung',
      },
      {
        id: '2',
        name: 'Siemens AG',
        invoiceCount: 32,
        eInvoiceCount: 28,
        totalValue: 89500.00,
        complianceRate: 87.5,
        preferredFormat: 'zugferd',
      },
      {
        id: '3',
        name: 'BMW Group',
        invoiceCount: 28,
        eInvoiceCount: 25,
        totalValue: 67800.00,
        complianceRate: 89.3,
        preferredFormat: 'zugferd',
      },
    ]
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be more sophisticated in production
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {})
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
      ]
      return csvRows.join('\n')
    }
    
    return JSON.stringify(data, null, 2)
  }

  private async generatePDFReport(data: any, reportType: string, options: any): Promise<Buffer> {
    // This would generate a PDF using a library like puppeteer or pdf-lib
    // For now, return a placeholder
    return Buffer.from(`PDF Report: ${reportType}\n${JSON.stringify(data, null, 2)}`)
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
  }
}
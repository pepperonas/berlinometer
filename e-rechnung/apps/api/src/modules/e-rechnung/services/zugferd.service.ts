import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { XRechnungService } from './xrechnung.service'

interface ZugferdData {
  invoice: Invoice & {
    customer: Customer
    items: InvoiceItem[]
    tenant: Tenant
  }
  profile?: 'BASIC' | 'COMFORT' | 'EXTENDED'
}

export class ZugferdService {
  private xrechnungService: XRechnungService

  constructor() {
    this.xrechnungService = new XRechnungService()
  }

  async generateZugferdPDF(data: ZugferdData): Promise<Buffer> {
    const { invoice } = data
    const pdfDoc = await PDFDocument.create()
    
    // Set document metadata
    pdfDoc.setTitle(`Rechnung ${invoice.invoiceNumber}`)
    pdfDoc.setAuthor(invoice.tenant.name)
    pdfDoc.setSubject(`Rechnung an ${invoice.customer.name}`)
    pdfDoc.setCreator('HandwerkOS E-Rechnung System')
    pdfDoc.setProducer('HandwerkOS')
    pdfDoc.setCreationDate(new Date())
    pdfDoc.setModificationDate(new Date())
    
    // Add invoice page
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // Load fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    let yPosition = height - 50
    
    // Header - Company Logo/Name
    page.drawText(invoice.tenant.name, {
      x: 50,
      y: yPosition,
      size: 20,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    yPosition -= 30
    
    // Sender address
    page.drawText(`${invoice.tenant.street}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
    yPosition -= 15
    
    page.drawText(`${invoice.tenant.postalCode} ${invoice.tenant.city}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
    yPosition -= 15
    
    if (invoice.tenant.phone) {
      page.drawText(`Tel: ${invoice.tenant.phone}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 15
    }
    
    page.drawText(`E-Mail: ${invoice.tenant.email}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    })
    yPosition -= 40
    
    // Customer address block
    page.drawText('An:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    yPosition -= 15
    
    page.drawText(invoice.customer.name, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    yPosition -= 18
    
    if (invoice.customer.street) {
      page.drawText(invoice.customer.street, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      yPosition -= 15
    }
    
    if (invoice.customer.postalCode && invoice.customer.city) {
      page.drawText(`${invoice.customer.postalCode} ${invoice.customer.city}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      yPosition -= 15
    }
    
    // Invoice details on the right
    const rightX = width - 200
    let rightY = height - 150
    
    page.drawText('RECHNUNG', {
      x: rightX,
      y: rightY,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    rightY -= 25
    
    page.drawText(`Rechnungsnummer:`, {
      x: rightX,
      y: rightY,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(invoice.invoiceNumber, {
      x: rightX + 90,
      y: rightY,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    rightY -= 15
    
    page.drawText(`Rechnungsdatum:`, {
      x: rightX,
      y: rightY,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(format(invoice.date, 'dd.MM.yyyy', { locale: de }), {
      x: rightX + 90,
      y: rightY,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    rightY -= 15
    
    page.drawText(`Fällig am:`, {
      x: rightX,
      y: rightY,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(format(invoice.dueDate, 'dd.MM.yyyy', { locale: de }), {
      x: rightX + 90,
      y: rightY,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    
    // Move to items section
    yPosition -= 40
    
    // Items header
    const tableY = yPosition
    page.drawLine({
      start: { x: 50, y: tableY },
      end: { x: width - 50, y: tableY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    yPosition -= 20
    
    page.drawText('Pos.', {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    page.drawText('Beschreibung', {
      x: 90,
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    page.drawText('Menge', {
      x: 340,
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    page.drawText('Einzelpreis', {
      x: 400,
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    page.drawText('Gesamt', {
      x: 480,
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })
    yPosition -= 15
    
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
    yPosition -= 20
    
    // Invoice items
    invoice.items.forEach((item, index) => {
      page.drawText(`${index + 1}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      
      // Handle long descriptions
      const maxDescWidth = 240
      const descLines = this.wrapText(item.description, helvetica, 10, maxDescWidth)
      descLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: 90,
          y: yPosition - (lineIndex * 12),
          size: 10,
          font: helvetica,
          color: rgb(0, 0, 0),
        })
      })
      
      page.drawText(`${item.quantity} ${item.unit || 'Stk'}`, {
        x: 340,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      
      page.drawText(`${item.price.toFixed(2)} €`, {
        x: 400,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      
      page.drawText(`${item.total.toFixed(2)} €`, {
        x: 480,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      
      yPosition -= (descLines.length * 12) + 10
    })
    
    // Summary section
    yPosition -= 20
    page.drawLine({
      start: { x: 350, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
    yPosition -= 20
    
    // Subtotal
    page.drawText('Zwischensumme:', {
      x: 350,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    page.drawText(`${invoice.subtotal.toFixed(2)} €`, {
      x: 480,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    yPosition -= 15
    
    // Tax
    const taxAmount = invoice.total - invoice.subtotal
    const taxRate = invoice.items[0]?.taxRate || 19 // Get tax rate from first item
    page.drawText(`MwSt. ${taxRate}%:`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    page.drawText(`${taxAmount.toFixed(2)} €`, {
      x: 480,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20
    
    page.drawLine({
      start: { x: 350, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20
    
    // Total
    page.drawText('Gesamtbetrag:', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    page.drawText(`${invoice.total.toFixed(2)} €`, {
      x: 480,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })
    
    // Payment information
    yPosition -= 50
    if (invoice.paymentTerms) {
      page.drawText('Zahlungsbedingungen:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
      yPosition -= 15
      page.drawText(invoice.paymentTerms, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      yPosition -= 25
    }
    
    // Bank details
    if (invoice.tenant.iban) {
      page.drawText('Bankverbindung:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
      yPosition -= 15
      
      page.drawText(`IBAN: ${invoice.tenant.iban}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      })
      yPosition -= 15
      
      if (invoice.tenant.bic) {
        page.drawText(`BIC: ${invoice.tenant.bic}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: rgb(0, 0, 0),
        })
        yPosition -= 15
      }
      
      if (invoice.tenant.bankName) {
        page.drawText(`Bank: ${invoice.tenant.bankName}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: rgb(0, 0, 0),
        })
      }
    }
    
    // Footer
    const footerY = 50
    page.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: width - 50, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
    
    // Tax information
    if (invoice.tenant.vatId) {
      page.drawText(`USt-IdNr.: ${invoice.tenant.vatId}`, {
        x: 50,
        y: footerY,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    if (invoice.tenant.taxNumber) {
      page.drawText(`Steuernummer: ${invoice.tenant.taxNumber}`, {
        x: 200,
        y: footerY,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    if (invoice.tenant.commercialRegister) {
      page.drawText(`HRB: ${invoice.tenant.commercialRegister}`, {
        x: 350,
        y: footerY,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    // Embed ZUGFeRD XML
    const xmlContent = this.xrechnungService.generateXRechnung({
      invoice: data.invoice,
      leitwegId: undefined,
      buyerReference: invoice.customer.customerNumber,
    })
    
    await this.embedZugferdXML(pdfDoc, xmlContent, data.profile || 'COMFORT')
    
    // Save and return PDF
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
  
  private async embedZugferdXML(
    pdfDoc: PDFDocument,
    xmlContent: string,
    profile: 'BASIC' | 'COMFORT' | 'EXTENDED'
  ): Promise<void> {
    // Create the XML attachment
    const xmlBytes = new TextEncoder().encode(xmlContent)
    
    // Embed the XML file as an attachment
    await pdfDoc.attach(xmlBytes, 'zugferd-invoice.xml', {
      mimeType: 'application/xml',
      description: `ZUGFeRD ${profile} invoice data`,
      creationDate: new Date(),
      modificationDate: new Date(),
    })
    
    // Add ZUGFeRD metadata to the PDF
    const zugferdMetadata = `
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description rdf:about="" xmlns:zf="urn:zugferd:pdfa:CrossIndustryDocument:invoice:2p0#">
          <zf:DocumentType>INVOICE</zf:DocumentType>
          <zf:DocumentFileName>zugferd-invoice.xml</zf:DocumentFileName>
          <zf:Version>2.3</zf:Version>
          <zf:ConformanceLevel>${profile}</zf:ConformanceLevel>
        </rdf:Description>
      </rdf:RDF>
    `
    
    // Note: Full XMP metadata embedding would require additional libraries
    // This is a simplified version for demonstration
    pdfDoc.setKeywords(['ZUGFeRD', 'E-Rechnung', profile, 'Invoice'])
  }
  
  private wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }
  
  validateZugferdPDF(pdfBuffer: Buffer): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation - check if it's a valid PDF
    const pdfHeader = pdfBuffer.slice(0, 5).toString()
    if (!pdfHeader.startsWith('%PDF-')) {
      errors.push('Invalid PDF format')
    }
    
    // Check for ZUGFeRD markers
    const pdfContent = pdfBuffer.toString('utf-8', 0, Math.min(pdfBuffer.length, 10000))
    if (!pdfContent.includes('zugferd') && !pdfContent.includes('ZUGFeRD')) {
      errors.push('Missing ZUGFeRD markers in PDF')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
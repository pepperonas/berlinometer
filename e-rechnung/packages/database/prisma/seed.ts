import { PrismaClient } from '../src/generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Handwerk GmbH',
      email: 'info@demo-handwerk.de',
      phone: '+49 89 12345678',
      street: 'Musterstraße 123',
      city: 'München',
      postalCode: '80331',
      country: 'DE',
      vatId: 'DE123456789',
      taxNumber: '123/456/78901',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
      bankAccountHolder: 'Demo Handwerk GmbH',
      contactPerson: 'Max Mustermann',
      website: 'https://demo-handwerk.de',
      plan: 'PROFESSIONAL',
      isActive: true,
    },
  })

  console.log('✅ Created demo tenant:', tenant.name)

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@demo-handwerk.de',
      password: hashedPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'ADMIN',
      isActive: true,
      tenantId: tenant.id,
      emailVerifiedAt: new Date(),
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        customerNumber: 'K0001',
        name: 'Stadt München',
        email: 'eingangsrechnungen@muenchen.de',
        phone: '+49 89 233-0',
        street: 'Marienplatz 8',
        city: 'München',
        postalCode: '80331',
        country: 'DE',
        leitwegId: '991-12345-67',
        contactPerson: 'Frau Schmidt',
        notes: 'Öffentlicher Auftraggeber - XRechnung erforderlich',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: 'K0002',
        name: 'Siemens AG',
        email: 'rechnungen@siemens.com',
        phone: '+49 89 636-0',
        street: 'Werner-von-Siemens-Str. 1',
        city: 'München',
        postalCode: '80333',
        country: 'DE',
        vatId: 'DE999999999',
        contactPerson: 'Herr Müller',
        notes: 'Großkunde - ZUGFeRD bevorzugt',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: 'K0003',
        name: 'BMW Group',
        email: 'lieferanten@bmw.de',
        phone: '+49 89 382-0',
        street: 'Petuelring 130',
        city: 'München',
        postalCode: '80788',
        country: 'DE',
        vatId: 'DE888888888',
        contactPerson: 'Frau Weber',
        notes: 'Premium Kunde',
        tenantId: tenant.id,
      },
    }),
  ])

  console.log('✅ Created demo customers:', customers.map(c => c.name).join(', '))

  // Create demo products/services
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Elektroinstallation Stundensatz',
        description: 'Fachkraft Elektroinstallation pro Stunde',
        price: 85.0,
        unit: 'Std',
        taxRate: 19.0,
        stock: null,
        isActive: true,
        tenantId: tenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Material: Kabel NYM-J 3x1,5',
        description: 'Installationskabel NYM-J 3x1,5mm² pro Meter',
        price: 2.50,
        unit: 'm',
        taxRate: 19.0,
        stock: 500.0,
        minStock: 50.0,
        isActive: true,
        tenantId: tenant.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sicherungskasten Installation',
        description: 'Installation und Verdrahtung Unterverteilung',
        price: 450.0,
        unit: 'Stk',
        taxRate: 19.0,
        stock: null,
        isActive: true,
        tenantId: tenant.id,
      },
    }),
  ])

  console.log('✅ Created demo products:', products.map(p => p.name).join(', '))

  // Create demo invoices
  const invoices = []

  // Invoice 1 - Stadt München (XRechnung)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'RE-2024-001',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-14'),
      subtotal: 2125.0,
      total: 2528.75,
      paymentMethod: 'bank_transfer',
      paymentTerms: 'Zahlbar innerhalb 30 Tagen ohne Abzug.',
      status: 'SENT',
      sentAt: new Date('2024-01-15T10:30:00Z'),
      customerId: customers[0].id, // Stadt München
      tenantId: tenant.id,
      metadata: JSON.stringify({
        exports: {
          xrechnung: {
            exportedAt: '2024-01-15T10:35:00Z',
            leitwegId: '991-12345-67',
          },
        },
        deliveryAttempts: [
          {
            channel: 'government_api',
            status: 'success',
            timestamp: '2024-01-15T10:40:00Z',
          },
        ],
      }),
    },
  })

  // Add invoice items for invoice 1
  await Promise.all([
    prisma.invoiceItem.create({
      data: {
        description: 'Elektroinstallation Bürogebäude - Fachkraftstunden',
        quantity: 20.0,
        price: 85.0,
        total: 1700.0,
        taxRate: 19.0,
        unit: 'Std',
        invoiceId: invoice1.id,
      },
    }),
    prisma.invoiceItem.create({
      data: {
        description: 'Material: Kabel NYM-J 3x1,5mm²',
        quantity: 170.0,
        price: 2.50,
        total: 425.0,
        taxRate: 19.0,
        unit: 'm',
        invoiceId: invoice1.id,
      },
    }),
  ])

  invoices.push(invoice1)

  // Invoice 2 - Siemens AG (ZUGFeRD)
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'RE-2024-002',
      date: new Date('2024-01-20'),
      dueDate: new Date('2024-02-19'),
      subtotal: 3175.0,
      total: 3778.25,
      paymentMethod: 'sepa',
      paymentTerms: 'Zahlbar innerhalb 30 Tagen ohne Abzug.',
      status: 'SENT',
      sentAt: new Date('2024-01-20T14:15:00Z'),
      customerId: customers[1].id, // Siemens AG
      tenantId: tenant.id,
      metadata: JSON.stringify({
        exports: {
          zugferd: {
            exportedAt: '2024-01-20T14:20:00Z',
            profile: 'COMFORT',
          },
        },
        deliveryAttempts: [
          {
            channel: 'email',
            status: 'success',
            timestamp: '2024-01-20T14:25:00Z',
            recipient: 'rechnungen@siemens.com',
          },
        ],
      }),
    },
  })

  // Add invoice items for invoice 2
  await Promise.all([
    prisma.invoiceItem.create({
      data: {
        description: 'Elektroinstallation Produktionshalle - Fachkraftstunden',
        quantity: 32.0,
        price: 85.0,
        total: 2720.0,
        taxRate: 19.0,
        unit: 'Std',
        invoiceId: invoice2.id,
      },
    }),
    prisma.invoiceItem.create({
      data: {
        description: 'Sicherungskasten Installation',
        quantity: 1.0,
        price: 450.0,
        total: 450.0,
        taxRate: 19.0,
        unit: 'Stk',
        invoiceId: invoice2.id,
      },
    }),
    prisma.invoiceItem.create({
      data: {
        description: 'Anfahrtskosten',
        quantity: 1.0,
        price: 5.0,
        total: 5.0,
        taxRate: 19.0,
        unit: 'Psch',
        invoiceId: invoice2.id,
      },
    }),
  ])

  invoices.push(invoice2)

  // Invoice 3 - BMW Group (PAID)
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'RE-2024-003',
      date: new Date('2024-01-25'),
      dueDate: new Date('2024-02-24'),
      subtotal: 1020.0,
      total: 1213.80,
      paymentMethod: 'bank_transfer',
      paymentTerms: 'Zahlbar innerhalb 30 Tagen ohne Abzug.',
      status: 'PAID',
      sentAt: new Date('2024-01-25T09:00:00Z'),
      paidAt: new Date('2024-02-10T12:30:00Z'),
      customerId: customers[2].id, // BMW Group
      tenantId: tenant.id,
      metadata: JSON.stringify({
        exports: {
          zugferd: {
            exportedAt: '2024-01-25T09:05:00Z',
            profile: 'COMFORT',
          },
        },
        deliveryAttempts: [
          {
            channel: 'email',
            status: 'success',
            timestamp: '2024-01-25T09:10:00Z',
            recipient: 'lieferanten@bmw.de',
          },
        ],
        payment: {
          receivedAt: '2024-02-10T12:30:00Z',
          amount: 1213.80,
          reference: 'RE-2024-003',
        },
      }),
    },
  })

  // Add invoice items for invoice 3
  await Promise.all([
    prisma.invoiceItem.create({
      data: {
        description: 'Wartung Elektroanlage - Fachkraftstunden',
        quantity: 12.0,
        price: 85.0,
        total: 1020.0,
        taxRate: 19.0,
        unit: 'Std',
        invoiceId: invoice3.id,
      },
    }),
  ])

  invoices.push(invoice3)

  console.log('✅ Created demo invoices:', invoices.map(i => i.invoiceNumber).join(', '))

  // Create a demo project
  const project = await prisma.project.create({
    data: {
      name: 'Neubau Bürogebäude Siemens Campus',
      description: 'Komplette Elektroinstallation für neues Bürogebäude',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      budget: 250000.0,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created demo project:', project.name)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📊 Demo Data Summary:')
  console.log(`   • Tenant: ${tenant.name}`)
  console.log(`   • User: ${user.email} (Password: demo123)`)
  console.log(`   • Customers: ${customers.length}`)
  console.log(`   • Products: ${products.length}`)
  console.log(`   • Invoices: ${invoices.length}`)
  console.log(`   • Projects: 1`)
  console.log('\n🚀 Start the API server with: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
-- Initialize HandwerkOS Database
-- This script creates the initial database structure

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create indexes for text search
-- These will be created after the Prisma migration

-- Create a function for generating invoice numbers
CREATE OR REPLACE FUNCTION generate_document_number(
  tenant_id UUID,
  doc_type TEXT,
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  min_digits INTEGER DEFAULT 5
) RETURNS TEXT AS $$
DECLARE
  current_num INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get and increment the current number for this tenant and document type
  UPDATE "NumberRange" 
  SET "currentNumber" = "currentNumber" + 1
  WHERE "tenantId" = tenant_id AND "type" = doc_type::enum_NumberRangeType
  RETURNING "currentNumber" INTO current_num;
  
  -- If no number range exists, create one
  IF current_num IS NULL THEN
    INSERT INTO "NumberRange" ("id", "tenantId", "type", "prefix", "currentNumber", "suffix", "minDigits")
    VALUES (uuid_generate_v4(), tenant_id, doc_type::enum_NumberRangeType, prefix, 1, suffix, min_digits);
    current_num := 1;
  END IF;
  
  -- Format the number with leading zeros
  formatted_number := prefix || LPAD(current_num::TEXT, min_digits, '0') || suffix;
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create a function for calculating invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_id UUID) 
RETURNS VOID AS $$
DECLARE
  subtotal_amount DECIMAL(10,2) := 0;
  tax_amount DECIMAL(10,2) := 0;
  total_amount DECIMAL(10,2) := 0;
BEGIN
  -- Calculate totals from invoice items
  SELECT 
    COALESCE(SUM("netAmount"), 0),
    COALESCE(SUM("taxAmount"), 0),
    COALESCE(SUM("totalAmount"), 0)
  INTO subtotal_amount, tax_amount, total_amount
  FROM "InvoiceItem" 
  WHERE "invoiceId" = invoice_id;
  
  -- Update the invoice with calculated totals
  UPDATE "Invoice"
  SET 
    "subtotal" = subtotal_amount,
    "taxAmount" = tax_amount,
    "totalAmount" = total_amount,
    "updatedAt" = NOW()
  WHERE "id" = invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate invoice item totals
CREATE OR REPLACE FUNCTION calculate_invoice_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate net amount (quantity * unit price - discount)
  NEW."netAmount" := NEW."quantity" * NEW."unitPrice" * (1 - NEW."discount" / 100);
  
  -- Calculate tax amount
  NEW."taxAmount" := NEW."netAmount" * (NEW."taxRate" / 100);
  
  -- Calculate total amount
  NEW."totalAmount" := NEW."netAmount" + NEW."taxAmount";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote item totals (same logic)
CREATE OR REPLACE FUNCTION calculate_quote_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW."netAmount" := NEW."quantity" * NEW."unitPrice" * (1 - NEW."discount" / 100);
  NEW."taxAmount" := NEW."netAmount" * (NEW."taxRate" / 100);
  NEW."totalAmount" := NEW."netAmount" + NEW."taxAmount";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a view for invoice statistics
CREATE OR REPLACE VIEW invoice_stats AS
SELECT 
  i."tenantId",
  COUNT(*) as total_invoices,
  COUNT(*) FILTER (WHERE i."status" = 'DRAFT') as draft_count,
  COUNT(*) FILTER (WHERE i."status" = 'SENT') as sent_count,
  COUNT(*) FILTER (WHERE i."status" = 'PAID') as paid_count,
  COUNT(*) FILTER (WHERE i."status" = 'OVERDUE') as overdue_count,
  SUM(i."totalAmount") as total_revenue,
  SUM(CASE WHEN i."paymentStatus" = 'PAID' THEN i."totalAmount" ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN i."paymentStatus" = 'UNPAID' THEN i."totalAmount" ELSE 0 END) as outstanding_revenue
FROM "Invoice" i
GROUP BY i."tenantId";

-- Create indexes for better performance (will be applied after migration)
-- These are suggestions for post-migration index creation
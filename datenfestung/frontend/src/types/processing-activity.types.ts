export interface ProcessingActivity {
  id: number;
  organizationId: number;
  name: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfers: boolean;
  thirdCountryDetails?: string;
  retentionPeriod: string;
  retentionCriteria?: string;
  isJointProcessing: boolean;
  jointControllers?: string;
  tomIds: number[];
  status: ProcessingActivityStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export type LegalBasis = 
  | 'consent' // Einwilligung
  | 'contract' // Vertragserfüllung
  | 'legal_obligation' // Rechtliche Verpflichtung
  | 'vital_interests' // Lebensinteressen
  | 'public_task' // Öffentliche Aufgabe
  | 'legitimate_interests'; // Berechtigte Interessen

export type ProcessingActivityStatus = 'active' | 'inactive' | 'draft';

export interface CreateProcessingActivityRequest {
  name: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfers: boolean;
  thirdCountryDetails?: string;
  retentionPeriod: string;
  retentionCriteria?: string;
  isJointProcessing: boolean;
  jointControllers?: string;
  tomIds: number[];
}

export interface UpdateProcessingActivityRequest extends Partial<CreateProcessingActivityRequest> {
  status?: ProcessingActivityStatus;
}

export interface ProcessingActivityFilter {
  search?: string;
  status?: ProcessingActivityStatus;
  legalBasis?: LegalBasis;
  thirdCountryTransfers?: boolean;
}

export interface ProcessingActivityState {
  activities: ProcessingActivity[];
  currentActivity: ProcessingActivity | null;
  isLoading: boolean;
  error: string | null;
  filters: ProcessingActivityFilter;
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

export const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  consent: 'Einwilligung (Art. 6 Abs. 1 lit. a)',
  contract: 'Vertragserfüllung (Art. 6 Abs. 1 lit. b)',
  legal_obligation: 'Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c)',
  vital_interests: 'Lebensinteressen (Art. 6 Abs. 1 lit. d)',
  public_task: 'Öffentliche Aufgabe (Art. 6 Abs. 1 lit. e)',
  legitimate_interests: 'Berechtigte Interessen (Art. 6 Abs. 1 lit. f)'
};

export const DATA_CATEGORIES = [
  'Stammdaten',
  'Kontaktdaten',
  'Vertragsdaten',
  'Zahlungsdaten',
  'Nutzungsdaten',
  'Inhaltsdaten',
  'Metadaten',
  'Standortdaten',
  'Gesundheitsdaten',
  'Biometrische Daten',
  'Genetische Daten',
  'Strafrechtliche Daten'
];

export const DATA_SUBJECTS = [
  'Kunden',
  'Interessenten',
  'Lieferanten',
  'Geschäftspartner',
  'Mitarbeiter',
  'Bewerber',
  'Webseitenbesucher',
  'Newsletter-Abonnenten',
  'Patienten',
  'Schüler/Studenten'
];

export const RECIPIENTS = [
  'Interne Mitarbeiter',
  'IT-Dienstleister',
  'Steuerberater',
  'Rechtsanwälte',
  'Behörde',
  'Versicherung',
  'Bank',
  'Marketing-Dienstleister',
  'Cloud-Anbieter',
  'Hosting-Provider'
];
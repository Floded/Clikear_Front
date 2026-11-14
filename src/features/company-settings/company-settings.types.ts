export interface CompanySettings {
  id: number;
  commercialName: string | null;
  legalName: string | null;
  logoUrl: string | null;
  logoPath: string | null;

  responsibleName: string | null;
  responsiblePosition: string | null;

  address: string | null;
  locality: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;

  taxId: string | null;
  grossIncomeNumber: string | null;
  rupeNumber: string | null;

  createdAt: string;
  updatedAt: string;
  updatedBy: number | null;
}

export interface UpdateCompanySettingsInput {
  commercialName?: string | null;
  legalName?: string | null;
  responsibleName?: string | null;
  responsiblePosition?: string | null;
  address?: string | null;
  locality?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  grossIncomeNumber?: string | null;
  rupeNumber?: string | null;
}

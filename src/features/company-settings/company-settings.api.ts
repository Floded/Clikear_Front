import { api } from "@/lib/api";

import type { CompanySettings, UpdateCompanySettingsInput } from "./company-settings.types";

export async function getCompanySettings(): Promise<CompanySettings> {
  const { data } = await api.get<CompanySettings>("/company-settings");
  return data;
}

export async function updateCompanySettings(
  input: UpdateCompanySettingsInput,
): Promise<CompanySettings> {
  const { data } = await api.put<CompanySettings>("/company-settings", input);
  return data;
}

export async function uploadCompanyLogo(file: File): Promise<CompanySettings> {
  const formData = new FormData();
  formData.append("logo", file);
  const { data } = await api.post<CompanySettings>("/company-settings/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteCompanyLogo(): Promise<CompanySettings> {
  const { data } = await api.delete<CompanySettings>("/company-settings/logo");
  return data;
}

export async function uploadCompanySignature(file: File): Promise<CompanySettings> {
  const formData = new FormData();
  formData.append("signature", file);
  const { data } = await api.post<CompanySettings>("/company-settings/signature", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteCompanySignature(): Promise<CompanySettings> {
  const { data } = await api.delete<CompanySettings>("/company-settings/signature");
  return data;
}

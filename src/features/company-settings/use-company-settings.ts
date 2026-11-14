import { useQuery } from "@tanstack/react-query";

import { getCompanySettings } from "./company-settings.api";

export const companySettingsQueryKey = ["company-settings"] as const;

export function useCompanySettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companySettingsQueryKey,
    queryFn: getCompanySettings,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

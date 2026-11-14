import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/use-session";
import {
  deleteCompanyLogo,
  deleteCompanySignature,
  updateCompanySettings,
  uploadCompanyLogo,
  uploadCompanySignature,
} from "@/features/company-settings/company-settings.api";
import type { CompanySettings, UpdateCompanySettingsInput } from "@/features/company-settings/company-settings.types";
import { companySettingsQueryKey, useCompanySettings } from "@/features/company-settings/use-company-settings";

type FormState = {
  commercialName: string;
  legalName: string;
  responsibleName: string;
  responsiblePosition: string;
  address: string;
  locality: string;
  province: string;
  country: string;
  postalCode: string;
  email: string;
  phone: string;
  taxId: string;
  grossIncomeNumber: string;
  rupeNumber: string;
};

const emptyForm: FormState = {
  commercialName: "",
  legalName: "",
  responsibleName: "",
  responsiblePosition: "",
  address: "",
  locality: "",
  province: "",
  country: "",
  postalCode: "",
  email: "",
  phone: "",
  taxId: "",
  grossIncomeNumber: "",
  rupeNumber: "",
};

function toFormState(settings: CompanySettings): FormState {
  return {
    commercialName: settings.commercialName ?? "",
    legalName: settings.legalName ?? "",
    responsibleName: settings.responsibleName ?? "",
    responsiblePosition: settings.responsiblePosition ?? "",
    address: settings.address ?? "",
    locality: settings.locality ?? "",
    province: settings.province ?? "",
    country: settings.country ?? "",
    postalCode: settings.postalCode ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    taxId: settings.taxId ?? "",
    grossIncomeNumber: settings.grossIncomeNumber ?? "",
    rupeNumber: settings.rupeNumber ?? "",
  };
}

function toPayload(form: FormState): UpdateCompanySettingsInput {
  const normalize = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };
  return {
    commercialName: normalize(form.commercialName),
    legalName: normalize(form.legalName),
    responsibleName: normalize(form.responsibleName),
    responsiblePosition: normalize(form.responsiblePosition),
    address: normalize(form.address),
    locality: normalize(form.locality),
    province: normalize(form.province),
    country: normalize(form.country),
    postalCode: normalize(form.postalCode),
    email: normalize(form.email),
    phone: normalize(form.phone),
    taxId: normalize(form.taxId),
    grossIncomeNumber: normalize(form.grossIncomeNumber),
    rupeNumber: normalize(form.rupeNumber),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function CompanySettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const settingsQuery = useCompanySettings({ enabled: session?.role === "ADMIN" });
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<File | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(toFormState(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateCompanySettingsInput) => updateCompanySettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(companySettingsQueryKey, data);
      toast.success("Configuración de empresa guardada");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo guardar la configuración"));
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(file),
    onSuccess: (data) => {
      queryClient.setQueryData(companySettingsQueryKey, data);
      setSelectedLogo(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      toast.success("Logotipo actualizado");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo subir el logotipo"));
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: deleteCompanyLogo,
    onSuccess: (data) => {
      queryClient.setQueryData(companySettingsQueryKey, data);
      setSelectedLogo(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      toast.success("Logotipo eliminado");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar el logotipo"));
    },
  });

  const uploadSignatureMutation = useMutation({
    mutationFn: (file: File) => uploadCompanySignature(file),
    onSuccess: (data) => {
      queryClient.setQueryData(companySettingsQueryKey, data);
      setSelectedSignature(null);
      if (signatureInputRef.current) signatureInputRef.current.value = "";
      toast.success("Firma actualizada");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo subir la firma"));
    },
  });

  const deleteSignatureMutation = useMutation({
    mutationFn: deleteCompanySignature,
    onSuccess: (data) => {
      queryClient.setQueryData(companySettingsQueryKey, data);
      setSelectedSignature(null);
      if (signatureInputRef.current) signatureInputRef.current.value = "";
      toast.success("Firma eliminada");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar la firma"));
    },
  });

  const isBusy =
    saveMutation.isPending ||
    uploadLogoMutation.isPending ||
    deleteLogoMutation.isPending ||
    uploadSignatureMutation.isPending ||
    deleteSignatureMutation.isPending;

  const hasChanges = useMemo(() => {
    if (!settingsQuery.data) return false;
    const current = toFormState(settingsQuery.data);
    return (Object.keys(current) as Array<keyof FormState>).some(
      (key) => current[key] !== form[key],
    );
  }, [form, settingsQuery.data]);

  if (session && session.role !== "ADMIN") {
    return <Navigate to="/tickets" replace />;
  }

  const updateField = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(toPayload(form));
  };

  const handleUploadLogo = () => {
    if (!selectedLogo) {
      toast.error("Seleccioná un archivo de logotipo");
      return;
    }
    uploadLogoMutation.mutate(selectedLogo);
  };

  const handleDeleteLogo = () => {
    if (!window.confirm("¿Eliminar el logotipo actual? Esta acción no se puede deshacer.")) return;
    deleteLogoMutation.mutate();
  };

  const handleUploadSignature = () => {
    if (!selectedSignature) {
      toast.error("Seleccioná un archivo de firma");
      return;
    }
    uploadSignatureMutation.mutate(selectedSignature);
  };

  const handleDeleteSignature = () => {
    if (!window.confirm("¿Eliminar la firma actual? Esta acción no se puede deshacer.")) return;
    deleteSignatureMutation.mutate();
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Configuración de empresa"
        description="Datos comerciales, fiscales y de identidad corporativa utilizados en documentos."
      />

      {settingsQuery.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {settingsQuery.isError && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            No se pudo cargar la configuración de empresa. {getErrorMessage(settingsQuery.error, "")}
          </CardContent>
        </Card>
      )}

      {settingsQuery.data && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">A. Identidad empresarial</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                id="commercialName"
                label="Nombre comercial"
                value={form.commercialName}
                onChange={updateField("commercialName")}
                placeholder="Pendiente de completar"
              />
              <Field
                id="legalName"
                label="Razón social"
                value={form.legalName}
                onChange={updateField("legalName")}
                placeholder="Pendiente de completar"
              />
              <div className="space-y-3 md:col-span-2">
                <Label>Logotipo</Label>
                <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                    {settingsQuery.data.logoUrl ? (
                      <img
                        src={settingsQuery.data.logoUrl}
                        alt="Logotipo de la empresa"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-muted-foreground">
                        Sin logotipo
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="logo">Cargar o reemplazar logotipo</Label>
                      <Input
                        id="logo"
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        disabled={isBusy}
                        onChange={(e) => setSelectedLogo(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formatos: PNG, JPG, JPEG o SVG. Tamaño máximo: 2 MB. Se publica en Supabase Storage.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedLogo || isBusy}
                        onClick={handleUploadLogo}
                      >
                        {uploadLogoMutation.isPending ? "Subiendo…" : "Subir logotipo"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!settingsQuery.data.logoUrl || isBusy}
                        onClick={handleDeleteLogo}
                      >
                        {deleteLogoMutation.isPending ? "Eliminando…" : "Eliminar logotipo"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">B. Responsable</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                id="responsibleName"
                label="Nombre completo"
                value={form.responsibleName}
                onChange={updateField("responsibleName")}
              />
              <Field
                id="responsiblePosition"
                label="Cargo"
                value={form.responsiblePosition}
                onChange={updateField("responsiblePosition")}
              />
              <div className="space-y-3 md:col-span-2">
                <Label>Firma (imagen)</Label>
                <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-56 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                    {settingsQuery.data.signatureUrl ? (
                      <img
                        src={settingsQuery.data.signatureUrl}
                        alt="Firma de la empresa"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-muted-foreground">
                        Sin firma
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signature">Cargar o reemplazar firma</Label>
                      <Input
                        id="signature"
                        ref={signatureInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        disabled={isBusy}
                        onChange={(e) => setSelectedSignature(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formatos: PNG, JPG, JPEG o SVG. Tamaño máximo: 2 MB. Se mostrará en el presupuesto al imprimir o guardar como PDF.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedSignature || isBusy}
                        onClick={handleUploadSignature}
                      >
                        {uploadSignatureMutation.isPending ? "Subiendo…" : "Subir firma"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!settingsQuery.data.signatureUrl || isBusy}
                        onClick={handleDeleteSignature}
                      >
                        {deleteSignatureMutation.isPending ? "Eliminando…" : "Eliminar firma"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">C. Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  id="address"
                  label="Dirección"
                  value={form.address}
                  onChange={updateField("address")}
                />
              </div>
              <Field id="locality" label="Localidad" value={form.locality} onChange={updateField("locality")} />
              <Field id="province" label="Provincia" value={form.province} onChange={updateField("province")} />
              <Field id="country" label="País" value={form.country} onChange={updateField("country")} />
              <Field
                id="postalCode"
                label="Código postal"
                value={form.postalCode}
                onChange={updateField("postalCode")}
              />
              <Field
                id="email"
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={updateField("email")}
              />
              <Field id="phone" label="Teléfono" value={form.phone} onChange={updateField("phone")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">D. Datos fiscales y comerciales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field id="taxId" label="CUIT" value={form.taxId} onChange={updateField("taxId")} placeholder="20-00000000-0" />
              <Field
                id="grossIncomeNumber"
                label="Ingresos Brutos"
                value={form.grossIncomeNumber}
                onChange={updateField("grossIncomeNumber")}
              />
              <Field id="rupeNumber" label="RUPE" value={form.rupeNumber} onChange={updateField("rupeNumber")} />
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!settingsQuery.data || isBusy || !hasChanges}
              onClick={() => setForm(toFormState(settingsQuery.data))}
            >
              Descartar cambios
            </Button>
            <Button type="submit" disabled={isBusy || !hasChanges}>
              {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

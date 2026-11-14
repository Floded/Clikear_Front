import type { ReactNode } from "react";

import type { Budget } from "./budget.types";
import type { CompanySettings } from "@/features/company-settings/company-settings.types";
import { BudgetStatusBadge } from "./budget-status-badge";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatMoney(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

function formatIssuePlace(settings: CompanySettings | null | undefined): string | null {
  if (!settings) return null;
  const parts = [settings.locality, settings.province, settings.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="budget-info-row">
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

function CompanyBlock({ settings }: { settings: CompanySettings | null | undefined }) {
  const commercialName = settings?.commercialName?.trim() || "Clickear";
  const legalName = settings?.legalName?.trim();
  const contactParts = [settings?.address, settings?.locality, settings?.province, settings?.country]
    .filter((part): part is string => Boolean(part && part.trim()));
  const fiscalParts = [
    settings?.taxId ? `CUIT: ${settings.taxId}` : null,
    settings?.grossIncomeNumber ? `Ing. Brutos: ${settings.grossIncomeNumber}` : null,
    settings?.rupeNumber ? `RUPE: ${settings.rupeNumber}` : null,
  ].filter((part): part is string => Boolean(part));
  const responsibleParts = [
    settings?.responsibleName?.trim() || null,
    settings?.responsiblePosition?.trim() || null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="budget-company-block">
      <div className="budget-company-brand">
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt={`Logotipo de ${commercialName}`} className="budget-company-logo" />
        ) : (
          <div className="budget-company-logo-placeholder" aria-hidden="true">
            {commercialName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="budget-company-name">{commercialName}</p>
          {legalName && <p className="budget-company-legal">{legalName}</p>}
          {responsibleParts.length > 0 && (
            <p className="budget-company-meta">{responsibleParts.join(" · ")}</p>
          )}
        </div>
      </div>
      <div className="budget-company-details">
        {contactParts.length > 0 && <p>{contactParts.join(" · ")}</p>}
        {(settings?.email || settings?.phone) && (
          <p>{[settings.email, settings.phone].filter(Boolean).join(" · ")}</p>
        )}
        {fiscalParts.length > 0 && <p>{fiscalParts.join(" · ")}</p>}
      </div>
    </div>
  );
}

export function BudgetDocument({
  budget,
  companySettings,
}: {
  budget: Budget;
  companySettings?: CompanySettings | null;
}) {
  const issuePlace = formatIssuePlace(companySettings);
  const signatureName = companySettings?.responsibleName?.trim() || null;
  const signaturePosition = companySettings?.responsiblePosition?.trim() || null;
  const hasSignature = Boolean(companySettings?.signatureUrl);

  return (
    <article className="budget-document" aria-label={`Presupuesto ${budget.code}`}>
      <header className="budget-header">
        <div className="budget-header-accent" aria-hidden="true" />
        <div className="budget-header-content">
          <CompanyBlock settings={companySettings} />
          <div className="budget-header-meta">
            <p className="budget-document-kicker">Presupuesto comercial</p>
            <h1 className="budget-document-title">{budget.code}</h1>
            <dl className="budget-header-meta-list">
              <InfoRow label="Fecha de emisión" value={formatDate(budget.issueDate)} />
              <InfoRow label="Válido hasta" value={formatDate(budget.validUntil)} />
              {issuePlace && <InfoRow label="Localidad de emisión" value={issuePlace} />}
              <InfoRow label="Estado" value={<BudgetStatusBadge status={budget.status} />} />
            </dl>
          </div>
        </div>
      </header>

      <section className="budget-section budget-parties" aria-label="Información del presupuesto">
        <div className="budget-card">
          <h2>Cliente</h2>
          <dl>
            <InfoRow label="Nombre / Razón social" value={budget.customerName || "—"} />
            <InfoRow label="Establecimiento (CUE)" value={budget.establishmentCue || "—"} />
          </dl>
        </div>
        <div className="budget-card">
          <h2>Datos del presupuesto</h2>
          <dl>
            <InfoRow label="Número" value={budget.code} />
            <InfoRow label="Fecha de emisión" value={formatDate(budget.issueDate)} />
            <InfoRow label="Fecha de vencimiento" value={formatDate(budget.validUntil)} />
          </dl>
        </div>
      </section>

      <section className="budget-section" aria-label="Materiales y servicios">
        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead>
              <tr>
                <th scope="col" className="col-concept">Concepto</th>
                <th scope="col" className="col-qty">Cantidad</th>
                <th scope="col" className="col-unit">Precio unitario</th>
                <th scope="col" className="col-subtotal">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {budget.lines.map((line, index) => (
                <tr key={line.id ?? `${line.description}-${index}`}>
                  <td className="col-concept">{line.description || "—"}</td>
                  <td className="col-qty">{line.quantity}</td>
                  <td className="col-unit">{formatMoney(line.unitPrice)}</td>
                  <td className="col-subtotal">{formatMoney(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="budget-section budget-bottom" aria-label="Totales y observaciones">
        <div className="budget-notes">
          <h2>Notas</h2>
          <p>{budget.notes?.trim() ? budget.notes : "—"}</p>
        </div>
        <div className="budget-totals" aria-label="Totales">
          <div className="budget-total-row budget-total-final">
            <span>Total</span>
            <strong>{formatMoney(budget.total)}</strong>
          </div>
          <p className="budget-total-note">Importes expresados en moneda local (ARS).</p>
        </div>
      </section>

      {hasSignature && (
        <section className="budget-section budget-signature-section" aria-label="Firma">
          <div className="budget-signature">
            <img
              src={companySettings!.signatureUrl!}
              alt="Firma autorizada"
              className="budget-signature-image"
            />
            <div className="budget-signature-line" />
            {signatureName && <p className="budget-signature-name">{signatureName}</p>}
            {signaturePosition && <p className="budget-signature-position">{signaturePosition}</p>}
          </div>
        </section>
      )}

      <footer className="budget-footer">
        <div className="budget-footer-contact">
          {[companySettings?.commercialName?.trim() || "Clickear", companySettings?.email, companySettings?.phone]
            .filter((part): part is string => Boolean(part && part.trim()))
            .join(" · ")}
        </div>
        <div className="budget-footer-page" aria-hidden="true" />
      </footer>
    </article>
  );
}

export { formatMoney, formatDate };

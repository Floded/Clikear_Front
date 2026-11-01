import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import type { Technician } from "@/features/tickets/tickets.types";
import { TICKET_STATUSES } from "@/features/tickets/tickets.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface TicketFiltersState {
  status: string;
  technicianId: string;
  establishment: string;
  employeeId: string;
  search: string;
}

interface EmployeeOption {
  id: number;
  fullName: string;
}

interface TicketFiltersProps {
  value: TicketFiltersState;
  onChange: (next: TicketFiltersState) => void;
  technicians: Technician[];
  employees: EmployeeOption[];
}

export function TicketFilters({ value, onChange, technicians, employees }: TicketFiltersProps) {
  const [search, setSearch] = useState(value.search);
  const debouncedSearch = useDebouncedValue(search, 350);

  // Sincroniza el debounce hacia el estado compartido
  useEffect(() => {
    if (debouncedSearch !== value.search) {
      onChange({ ...value, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-1.5">
        <Label htmlFor="search">Buscar título</Label>
        <Input
          id="search"
          placeholder="Título del ticket…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>CUE del establecimiento</Label>
        <Input
          placeholder="CUE…"
          value={value.establishment}
          onChange={(e) => onChange({ ...value, establishment: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Select
          value={value.status || "ALL"}
          onValueChange={(v) =>
            onChange({ ...value, status: v === "ALL" ? "" : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Técnico</Label>
        <Select
          value={value.technicianId || "ALL"}
          onValueChange={(v) =>
            onChange({ ...value, technicianId: v === "ALL" ? "" : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Empleado asignado</Label>
        <Select
          value={value.employeeId || "ALL"}
          onValueChange={(v) =>
            onChange({ ...value, employeeId: v === "ALL" ? "" : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="none">Sin asignar</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

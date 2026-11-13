import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createUser, updateUser } from "./users.api";
import type { AppUser } from "./users.types";

const ROLE_OPTIONS = [
  { value: "GESTOR", label: "Gestor" },
  { value: "ADMIN", label: "Administrador" },
  { value: "REVISADOR", label: "Revisador" },
];

interface FormValues {
  username: string;
  name: string;
  password: string;
  role: string;
}

const EMPTY_FORM: FormValues = { username: "", name: "", password: "", role: "GESTOR" };

// Misma política que el backend (user.dto.ts) para dar feedback antes de enviar
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El usuario debe tener al menos 3 caracteres")
  .max(50, "El usuario no puede superar 50 caracteres")
  .regex(
    /^[a-z0-9._-]+$/,
    "Solo admite letras, números, punto, guion y guion bajo (sin espacios)",
  );

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(200, "La contraseña es muy larga")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");

function firstZodMessage(schema: z.ZodType, value: string): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AppUser | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = user != null;

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormValues>>({});

  useEffect(() => {
    if (!open) return;
    setFormValues(
      user
        ? { username: user.username, name: user.name, password: "", role: user.role }
        : EMPTY_FORM,
    );
    setErrors({});
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateUser(user.id, {
            username: values.username,
            name: values.name,
            // Solo se envía la contraseña si se quiere cambiar
            ...(values.password && { password: values.password }),
            role: values.role,
          })
        : createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
      onOpenChange(false);
    },
    onError: (err) => {
      const { error, details } = (err as { response?: { data?: { error?: string; details?: { message: string }[] } } })
        ?.response?.data ?? {};
      const detail = details?.map((d) => d.message).join(" · ");
      toast.error(detail ?? error ?? "Error guardando usuario");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, name, password } = formValues;

    // Validación en vivo con los mismos criterios del backend
    const nextErrors: Partial<FormValues> = {
      username: firstZodMessage(usernameSchema, username) ?? undefined,
      name: name.trim().length < 2 ? "El nombre es obligatorio" : undefined,
      password: password ? firstZodMessage(passwordSchema, password) ?? undefined : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.name || nextErrors.password) {
      return;
    }

    mutation.mutate({
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password,
      role: formValues.role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-username">Usuario</Label>
            <Input
              id="user-username"
              value={formValues.username}
              onChange={(e) => setFormValues((v) => ({ ...v, username: e.target.value }))}
              placeholder="nombre.usuario"
              autoComplete="off"
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input
              id="user-name"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Nombre y apellido"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Rol</Label>
            <Select
              value={formValues.role}
              onValueChange={(role) => setFormValues((v) => ({ ...v, role }))}
            >
              <SelectTrigger id="user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={formValues.password}
              onChange={(e) => setFormValues((v) => ({ ...v, password: e.target.value }))}
              placeholder={isEdit ? "Dejar vacío para no cambiar" : "••••••••"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password}</p>
            ) : (
              !isEdit && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
                </p>
              )
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) return;
    setFormValues(
      user
        ? { username: user.username, name: user.name, password: "", role: user.role }
        : EMPTY_FORM,
    );
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
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error guardando usuario";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, name, password, role } = formValues;
    if (username.trim().length < 3 || name.trim().length < 2) {
      toast.error("Usuario (mínimo 3) y nombre son obligatorios");
      return;
    }
    if (!isEdit && password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    mutation.mutate({
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password,
      role,
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input
              id="user-name"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Nombre y apellido"
            />
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
            />
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

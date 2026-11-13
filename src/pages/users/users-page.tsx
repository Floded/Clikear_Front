import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/features/auth/use-session";

import { deleteUser, fetchUsers } from "@/features/users/users.api";
import type { AppUser } from "@/features/users/users.types";
import { UserFormDialog } from "@/features/users/user-form-dialog";

const ROLE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ADMIN: { label: "Administrador", variant: "default" },
  GESTOR: { label: "Gestor", variant: "secondary" },
  REVISADOR: { label: "Revisador", variant: "outline" },
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", "list"],
    queryFn: fetchUsers,
    // Solo ADMIN puede listar usuarios; evita la llamada para otros roles
    enabled: session?.role === "ADMIN",
  });

  const deleteMutation = useMutation({
    mutationFn: (user: AppUser) => deleteUser(user.id),
    onSuccess: (_data, user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Usuario ${user.username} eliminado`);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo eliminar el usuario";
      toast.error(message);
    },
  });

  // El backend ya rechaza con 403, pero evitamos renderizar la gestión sin permiso
  if (session && session.role !== "ADMIN") {
    return <Navigate to="/tickets" replace />;
  }

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Usuarios"
          description="Accesos al panel: usuarios y roles de Clickear."
        />
        <Button onClick={openCreate}>Nuevo usuario</Button>
      </div>

      {usersQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {usersQuery.isError && (
        <Card>
          <CardContent className="text-sm text-destructive">
            No se pudieron cargar los usuarios.
          </CardContent>
        </Card>
      )}

      {!usersQuery.isPending && (usersQuery.data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No hay usuarios cargados.
          </CardContent>
        </Card>
      )}

      {(usersQuery.data?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data!.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{user.username}</td>
                  <td className="px-4 py-2 text-xs">{user.name}</td>
                  <td className="px-4 py-2">
                    <Badge variant={ROLE_BADGES[user.role]?.variant ?? "outline"}>
                      {ROLE_BADGES[user.role]?.label ?? user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          deleteMutation.isPending && deleteMutation.variables?.id === user.id
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Eliminar el usuario ${user.username}? Esta acción no se puede deshacer.`,
                            )
                          ) {
                            deleteMutation.mutate(user);
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
      />
    </section>
  );
}

import { getDesktopInfo } from "@/lib/desktop";

const STORAGE_KEY = "clickear.lastSync";

export function getLastSync(): string {
  return localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString();
}

export function setLastSync(value: string) {
  localStorage.setItem(STORAGE_KEY, value);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  error?: string;
}

export async function runSync(): Promise<SyncResult> {
  const info = await getDesktopInfo();
  if (!info || info.mode !== "online") {
    return { pushed: 0, pulled: 0, error: "Modo offline" };
  }

  const localBase = info.backendUrl?.replace(/\/$/, "");
  const remoteBase = info.remoteUrl?.replace(/\/$/, "");
  if (!localBase || !remoteBase) {
    return { pushed: 0, pulled: 0, error: "URLs no disponibles" };
  }

  let pushed = 0;
  try {
    const pendingRes = await fetch(`${localBase}/api/sync/pending`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const pending = (await pendingRes.json()) as {
      rows?: Array<{ id: number; entity: string; entityId: string; operation: string; payload: unknown; updatedAt: string }>;
    };
    const rows = pending.rows ?? [];

    if (rows.length > 0) {
      const changes = rows.map((r) => ({
        entity: r.entity,
        id: r.entityId,
        updatedAt: r.updatedAt,
        data: r.payload,
        operation: r.operation,
      }));
      await fetch(`${remoteBase}/api/sync/push`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });
      await fetch(`${localBase}/api/sync/ack`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: rows.map((r) => r.id) }),
      });
      pushed = rows.length;
    }

    const since = getLastSync();
    const pullRes = await fetch(`${remoteBase}/api/sync/pull?since=${encodeURIComponent(since)}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const pulled = (await pullRes.json()) as { data?: Record<string, unknown[]> };
    const remoteChanges: Array<{ entity: string; id?: unknown; updatedAt: string; data: unknown; operation: string }> = [];
    for (const [entity, rows] of Object.entries(pulled.data ?? {})) {
      for (const row of (rows as any[])) {
        remoteChanges.push({
          entity,
          id: (row as any).cue ?? (row as any).ticketId ?? (row as any).id,
          updatedAt: (row as any).updatedAt,
          data: row,
          operation: "update",
        });
      }
    }
    if (remoteChanges.length > 0) {
      await fetch(`${localBase}/api/sync/push`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: remoteChanges }),
      });
    }
    setLastSync(new Date().toISOString());

    return { pushed, pulled: remoteChanges.length };
  } catch (err) {
    return { pushed, pulled: 0, error: err instanceof Error ? err.message : "Error de sync" };
  }
}

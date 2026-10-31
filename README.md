# Frontend: Sistema de Gestión de Tickets, Stock e Integración ARCA

Este documento contiene la arquitectura de interfaz de usuario, diseño de pantallas, componentes y la lista de tareas específicas para la implementación del Frontend (el checklist operativo por etapas vive en `lista-de-tareas.md`).

---

## 1. Stack Tecnológico Frontend

> Implementado con la **Etapa 1**. Se eligió **Vite + React** en lugar de Next.js: la app es un panel interno que consume una API REST (sin SSR ni SEO), así que el App Router de Next.js agrega complejidad innecesaria.

* **Framework:** React 19 + TypeScript (Vite 8).
* **Estilos:** Tailwind CSS v4 + Shadcn UI (preset `nova`).
* **Gestión de Estado & Fetching:** TanStack Query (React Query) + Axios.
* **Navegación:** React Router 7 (BrowserRouter).
* **Iconos:** Lucide React.
* **Formularios:** React Hook Form + Zod (validación de esquemas de datos).
* **Toasts:** Sonner.

---

## 2. Mapa de Pantallas y Componentes Clave


### 1. Panel de Tickets / Hojas de Ruta (`/tickets`)
* **Barra de Filtros y Búsqueda:** Filtro por estado (Iniciada, Terminada, Abierto), búsqueda por CUE de escuela o número de ticket.
* **Listado de Hojas de Ruta / Despacho:** Tarjetas contenedoras por Orden de Despacho (`CC0271`) agrupadas por Establecimiento (Ej: Escuelas).
* **Tabla de Tickets por Escuela:** Listado claro indicando Número de Ticket, Título, Estado y Fecha de Apertura.
* **Modal / Drawer de Detalle del Ticket:** 
  * Abre al hacer clic en un ticket.
  * Muestra toda la información: CUE, Nombre de la escuela, Dirección, Distancia en KM, Teléfono del establecimiento, Técnicos asignados y GLPI asociado.

### 2. Panel de Control de Inventario y Custodia (`/inventory`)
* **Tablas Conmutables (Tabs):**
  * **Pestaña 1: Stock en Depósito (`/inventory/stock`):** Muestra el listado de ítems, cantidad disponible y proveedor asignado.
  * **Pestaña 2: Custodia por Empleado (`/inventory/assignments`):** Muestra qué herramientas/materiales tiene asignado cada empleado, la cantidad y la **fecha obligatoria de entrega**.
* **Modal de Registro / Asignación de Material:** 
  * Formulario para seleccionar ítem, empleado, cantidad a entregar y selector de fecha (`delivery_date`).

### 3. Módulo de Facturación ARCA (`/invoices`)
* **Listado de Facturas / Comprobantes:** Visualización del estado del trámite en ARCA (`PENDING`, `APPROVED`, `REJECTED`).
* **Botón de Acción "Generar Factura":** Dispara la orden a la cola de emisión del backend y muestra estado en tiempo real.

## 3. Prompt para Agente de Código (OpenCode - Frontend)

> "Actúa como un Desarrollador Frontend Senior UI/UX experto en React, Tailwind CSS y TypeScript. Utiliza las especificaciones de este README para construir la interfaz del sistema. Prioriza una experiencia fluida con modales para los detalles de los tickets, tablas interactivas para el control de inventario con asignación a empleados y componentes con estados de carga bien estructurados."

---

## 4. Estado de Implementación

> Se actualiza al cierre de cada etapa.

| Etapa | Alcance | Estado |
|---|---|---|
| 1 | Setup del proyecto + layout base | ✅ **Completada** |
| 2 | Módulo de Tickets & Detalle | ✅ **Completada** |
| 3 | Módulo de Inventario & Asignación | ⬜ Pendiente |
| 4 | Módulo ARCA & Polish final | ⬜ Opcional |

### Etapa 1 ✅ — Setup & Layout Base

- Vite 8 + React 19 + TS 7 (strict), Tailwind v4, Shadcn `nova`, TanStack Query, React Router 7, axios, RHF + Zod, Sonner, lucide-react.
- Alias `@/` configurado (TS 7 ya no soporta `baseUrl`; solo `paths`) y `strict` activado (el scaffold no lo traía).
- Layout responsivo con `Sidebar` de navegación (Tickets / Inventario / Facturación).
- Indicador de **health del backend** en el footer del sidebar (`GET /api/health`, auto-refresh cada 30s).
- Cliente API en `src/lib/api.ts` con `baseURL` configurable vía `VITE_API_URL` (`.env` / `.env.example`).
- Rutas: `/` → redirect `/tickets`; páginas placeholder de cada módulo con su estado de etapa.

### Etapa 2 ✅ — Módulo de Tickets & Detalle

- Componentes reutilizables: `TicketStatusBadge`, `TicketFilters` (búsqueda con debounce + CUE + estado + técnico), `TicketDetailDialog`.
- Listado agrupado por establecimiento (CUE) con tabla de tickets (número, título, estado, apertura) y paginación.
- Modal de detalle extendido: CUE, nombre, departamento, localidad, dirección, teléfono, distancia en km, director/a, GLPI, fecha de apertura.
- Orden de despacho asociada con código, fecha, estado y técnicos asignados (chips).
- Facturas asociadas (voucher, monto, estado, CAE).
- Cambio de estado desde el modal (`PATCH /api/tickets/:id/status`) con mutación + toast y refresco del listado.
- Filtros conectados a `GET /api/tickets` (status, establishment, technicianId, search, paginación).
- Detalle desde `GET /api/tickets/:id` (incluye establishment → dispatchOrder → technicians + invoices).
- `useDebouncedValue` compartido en `src/hooks/`.

## 5. Quickstart

```bash
npm install
cp .env.example .env   # apunta al backend (default http://localhost:3000/api)
npm run dev            # http://localhost:5173
```

Requiere el backend corriendo en `:3000` (repo `Backend/`). Si no está levantado, el indicador del sidebar se muestra en rojo.

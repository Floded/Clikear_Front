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
* **Barra de Filtros y Búsqueda:** Filtro por estado (Abierto, En progreso, Terminado, Reabierto), búsqueda por establecimiento/CUE o ticket, técnico y empleado asignado.
* **Listado agrupado por establecimiento:** Tarjetas/tablas por establecimiento (CUE) con número de ticket, título, estado, asignado y fecha de apertura.
* **Modal de detalle del ticket:**
  * Abre al hacer clic en un ticket.
  * Muestra información del ticket y establecimiento (CUE, nombre, departamento, localidad, dirección, teléfono, distancia, director/a, GLPI, apertura), orden de despacho/técnicos, asignaciones, facturas asociadas.
  * **Imágenes de cierre:** miniaturas en el detalle; al abrirse se visualizan en un **modal proporcionado a la pantalla** (no pantalla completa), con navegación entre imágenes, contador, descarga y cierre (botón/Escape).
  * **Permisos de edición (feature `tickets`):** los usuarios sin permiso de edición ven el detalle en solo lectura y no visualizan acciones de modificación (nuevo ticket, cambiar estado, finalizar ticket, asignar/liberar).

### 2. Panel de Control de Inventario y Custodia (`/inventory`)
* **Tablas Conmutables (Tabs):**
  * **Pestaña 1: Stock en Depósito (`/inventory/stock`):** Muestra el listado de ítems, cantidad disponible y proveedor asignado. Al posarse sobre el proveedor se abre una **hover card** con teléfono, email y página web del proveedor.
  * **Pestaña 2: Custodia por Empleado (`/inventory/assignments`):** Muestra qué herramientas/materiales tiene asignado cada empleado, la cantidad y la **fecha obligatoria de entrega**.
* **Modal de Registro / Asignación de Material:** 
  * Formulario para seleccionar ítem, empleado, cantidad a entregar y selector de fecha (`delivery_date`).
* **Botón "Proveedores"** → navega al módulo de proveedores.

### 2b. Proveedores (`/inventory/suppliers`)
* **Listado paginado** con búsqueda por nombre o email: teléfono, email, página web (links `tel:`, `mailto:` y web en pestaña nueva) y cantidad de ítems asociados.
* **Botón "Nuevo proveedor"**: formulario con nombre obligatorio y datos de contacto opcionales (validación de email y URL).
* Link "Volver al inventario".

### 3. Módulo de Facturación ARCA (`/invoices`)
* **Listado de Facturas / Comprobantes:** Visualización del estado del trámite en ARCA (`PENDING`, `APPROVED`, `REJECTED`).
* **Botón de Acción "Generar Factura":** Dispara la orden a la cola de emisión del backend y muestra estado en tiempo real.

### 4. Usuarios y permisos (`/usuarios`, solo ADMIN)
* **Gestión de usuarios:** alta, edición y baja de usuarios (username, nombre, rol y contraseña opcional en edición).
* **Permisos por funcionalidad:** asignación de acceso `Sin acceso` / `Ver` / `Ver y editar` para `tickets`, `organization`, `inventory`, `budgets` e `invoices` (el rol `ADMIN` tiene acceso total implícito).
* **Acciones masivas en el formulario:** botones **"Todo en lectura"** y **"Todo en edición"** para asignar rápidamente permisos a todas las funcionalidades.
* **Comportamiento en UI:** las rutas y opciones se filtran según permisos; cuando un usuario tiene solo lectura en una funcionalidad, no se muestran los controles de modificación correspondientes (p. ej. en tickets: creación, cambio/finalización de estado y asignación).

## 3. Prompt para Agente de Código (OpenCode - Frontend)

> "Actúa como un Desarrollador Frontend Senior UI/UX experto en React, Tailwind CSS y TypeScript. Utiliza las especificaciones de este README para construir la interfaz del sistema. Prioriza una experiencia fluida con modales para los detalles de los tickets, tablas interactivas para el control de inventario con asignación a empleados y componentes con estados de carga bien estructurados."

---

## 4. Estado de Implementación

> Se actualiza al cierre de cada etapa.

| Etapa | Alcance | Estado |
|---|---|---|
| 1 | Setup del proyecto + layout base | ✅ **Completada** |
| 2 | Módulo de Tickets & Detalle | ✅ **Completada** |
| 3 | Módulo de Inventario & Asignación | ✅ **Completada** |
| 4 | Módulo ARCA & Polish final | ✅ **Completada** |

### Etapa 1 ✅ — Setup & Layout Base

- Vite 8 + React 19 + TS 7 (strict), Tailwind v4, Shadcn `nova`, TanStack Query, React Router 7, axios, RHF + Zod, Sonner, lucide-react.
- Alias `@/` configurado (TS 7 ya no soporta `baseUrl`; solo `paths`) y `strict` activado (el scaffold no lo traía).
- Layout responsivo con `Sidebar` de navegación (Tickets / Inventario / Facturación).
- Indicador de **health del backend** en el footer del sidebar (`GET /api/health`, auto-refresh cada 30s).
- Cliente API en `src/lib/api.ts` con `baseURL` configurable vía `VITE_API_URL` (`.env` / `.env.example`).
- Rutas: `/` → redirect `/tickets`; páginas placeholder de cada módulo con su estado de etapa.

### Etapa 2 ✅ — Módulo de Tickets & Detalle

- Componentes reutilizables: `TicketStatusBadge`, `TicketFilters` (búsqueda con debounce + filtros), `TicketDetailDialog`.
- Listado agrupado por establecimiento (CUE) con tabla de tickets y paginación.
- Modal de detalle extendido: datos del ticket/establecimiento, orden de despacho y técnicos, asignaciones e historial, facturas asociadas.
- **Imágenes de cierre:** miniaturas en el detalle y visor en modal proporcionado a la pantalla (no fullscreen) con navegación, contador y descarga.
- Cambio de estado y finalización de ticket (con evidencia) desde el modal (`PATCH /api/tickets/:id/status`, imágenes de cierre).
- Asignación/liberación de ticket a empleado desde el detalle.
- Controles de modificación ocultos para usuarios con permiso de solo lectura en `tickets` (creación, estado/finalización y asignación).
- Filtros conectados a `GET /api/tickets`; detalle desde `GET /api/tickets/:id`.
- `useDebouncedValue` compartido en `src/hooks/`.

### Etapa 3 ✅ — Módulo de Inventario & Asignación

- Pestaña **Stock en depósito**: tabla de ítems (nombre, descripción, proveedor, disponible, en custodia) con alerta visual de bajo stock (`<= 3`) y sin stock; filtros por búsqueda y disponibilidad; paginación.
- Pestaña **Custodia por empleado**: listado de empleados con estado y unidades activas; modal de custodia con asignaciones activas y devolución total/parcial.
- Modal **Asignar material**: ítem (solo con stock), empleado (solo activos), cantidad, fecha de entrega obligatoria, notas. Manejo del `409` de stock insuficiente con toast.
- Ajuste diferencial de stock (`PATCH /api/inventory-items/:id/stock`) desde la tabla, con validación de entero distinto de cero y error de stock negativo.
- Devoluciones total/parcial (`PUT /api/assignments/:id/return`) con cantidad, fecha y notas; invalida stock, custodia y asignaciones.
- Formularios con React Hook Form + Zod (`zodResolver`).
- Endpoints conectados: `/inventory-items`, `/suppliers`, `/employees`, `/employees/:id/assignments`, `/assignments`.

### Etapa 4 ✅ — Módulo ARCA & Polish final

- Vista de **Facturación** con tabla de comprobantes, badges de estado (`PENDING`/`APPROVED`/`REJECTED`), filtro por estado y modal "Generar factura" (UI lista; emisión real pendiente del backend ARCA).
- Skeleton loaders en listados de tickets, stock, custodia y facturación.
- Toasts (Sonner) para altas/ajustes/devoluciones y errores de API.
- Estados vacíos y manejo de errores inline en cada módulo.
- (Opcional) pendiente: endpoints reales de ARCA en el backend para conectar la vista.

### Extras (post-Etapa 4)

- Botón **"Nuevo ticket"** en `/tickets` con formulario (ticketId BigInt, CUE, título, estado, GLPI, fecha de apertura) → `POST /api/tickets`.
- Botón **"Nuevo ítem"** en `/inventory` con formulario (nombre, descripción, proveedor, cantidad inicial) → `POST /api/inventory-items`.
- **Módulo de Proveedores** (`/inventory/suppliers`): botón "Proveedores" en el header de Inventario, listado con búsqueda/paginación y alta (`POST /api/suppliers`) incluyendo el campo `website`.
- **Hover card de proveedor** en el tab de stock (`supplier-cell.tsx`): al posarse sobre el nombre se consulta `GET /api/suppliers/:id` y se muestra un card flotante (portal + posición calculada, sin modal) con teléfono, email y página web.
- **Usuarios y permisos** (`/usuarios`, solo ADMIN): gestión de usuarios y permisos por funcionalidad (`VIEW`/`EDIT`), con acciones masivas **"Todo en lectura"** / **"Todo en edición"** en el formulario. La UI oculta acciones de modificación para usuarios sin permiso de edición en la funcionalidad correspondiente (aplicado en tickets).

## 5. Testing

> **Regla obligatoria:** después de cada cambio o modificación en el código del Frontend se deben crear o ejecutar los tests correspondientes antes de dar el cambio por terminado. Esto aplica también al agente de código.

- Todo cambio de comportamiento (lógica, componentes, hooks, formularios) debe acompañarse de su test.
- Nunca se da por finalizada una modificación sin correr la suite de tests y que pase en verde.
- Si el cambio rompe un test existente, se actualiza el test solo si el nuevo comportamiento es el esperado.

### Stack y comandos

- **Vitest 5** (entorno `jsdom`) + **Testing Library** (`react`, `jest-dom`, `user-event`).
- Config en `vite.config.ts` (bloque `test`) y setup global en `src/test/setup.ts` (matchers de jest-dom + cleanup automático).
- Los archivos de test van junto al código: `*.test.ts(x)` al lado del archivo que cubren.

```bash
npm test         # corre la suite una vez (CI / después de un cambio)
npm run test:watch  # modo watch (desarrollo)
```

## 6. Pendientes conocidos

- **ARCA / Facturación**: la emisión real de comprobantes sigue pendiente del backend (Fase 5: cola BullMQ + WSAA/WSFE); la vista y el modal "Generar factura" están listos pero no emiten.
- **Empleados**: existe `new-employee-dialog.tsx` sin usar y con errores de TypeScript (`useQuery`/`employeesQuery` sin uso); falta decidir si se conecta el alta de empleados o se elimina.
- **Proveedores**: falta edición y baja de proveedores (el backend ya expone `PATCH`/`DELETE /api/suppliers/:id`; el frontend solo tiene alta y listado).
- **Tickets**: no hay edición de tickets existentes (solo alta y cambio de estado).

## 7. Quickstart

```bash
npm install
cp .env.example .env   # apunta al backend (default http://localhost:3000/api)
npm run dev            # http://localhost:5173
```

Requiere el backend corriendo en `:3000` (repo `Backend/`). Si no está levantado, el indicador del sidebar se muestra en rojo.

### Entornos

| Comando | Archivo que usa Vite | `VITE_API_URL` |
|---|---|---|
| `npm run dev` | `.env` | `http://localhost:3000/api` (backend local) |
| `npm run build` | `.env.production` | `/api` (proxy de Render en `server.mjs`) |

Nunca commitear un `dist/` construido con `.env` de desarrollo: el bundle llevaría `localhost` y rompe el login en producción.

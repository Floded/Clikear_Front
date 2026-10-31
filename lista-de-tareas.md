## Lista de Tareas para el Desarrollo del Frontend

### Fase 1 ✅ Setup del Proyecto & Layout Base
- [x] Inicializar proyecto React/Next.js con Tailwind CSS y TypeScript. → Vite + React 19 + TS 7 (decisión: panel interno sin SSR, no Next).
- [x] Configurar cliente de API (Axios / TanStack Query). → `src/lib/api.ts` con `VITE_API_URL`; indicador de health en el sidebar.
- [x] Implementar `Sidebar` de navegación principal (Tickets, Stock, Facturación, Configuración). → Tickets / Inventario / Facturación; se agrega "Configuración" cuando haga falta.
- [x] Crear el layout responsivo base. → `AppLayout` con `<Outlet/>` + rutas placeholder.

### Fase 2 ✅ Módulo de Tickets & Detalle
- [x] Crear componentes UI reutilizables: `Badge` (estados), `Table`, `Modal`, `InputSearch`. → `TicketStatusBadge`, shadcn `Table`/`Dialog`, `TicketFilters`.
- [x] Implementar la vista del listado de tickets agrupados por escuela / orden de despacho. → agrupado por CUE (establecimiento), tabla por grupo.
- [x] Desarrollar el modal de detalle extendido con la información del PDF (CUE, Dirección, Distancia, Técnicos, GLPI). → incluye además departamento, localidad, teléfono, director/a, orden de despacho y facturas.
- [x] Conectar los endpoints de consulta (`GET /api/tickets`, `GET /api/tickets/:id`). → + `PATCH /api/tickets/:id/status` para cambio de estado.

### Fase 3 ✅ Módulo de Inventario & Asignación
- [x] Implementar vista de tabla de stock en depósito con alerta visual de bajo stock. → badge amber (<=3) y destructive (0).
- [x] Desarrollar la vista de "Materiales en Custodia de Empleados". → tabla de empleados + modal de custodia.
- [x] Construir formulario modal para **Asignar Material a Empleado**: picker de ítem, picker de empleado, cantidad, DatePicker obligatorio para `delivery_date`. → RHF + Zod, solo ítems con stock y empleados activos.
- [x] Conectar endpoints de inventario (`GET /api/inventory`, `POST /api/assignments`). → `/inventory-items`, `/employees`, `/employees/:id/assignments`, `/assignments`, además ajuste de stock y devoluciones.

### Fase 4 ✅ Módulo ARCA & Polish Final (opcional)
- [x] Crear vista de facturación con indicador visual del estado de CAE de ARCA (Badge de pendiente/aprobado). → tabla + `InvoiceStatusBadge` + filtro.
- [x] Agregar estados de carga (`Skeleton Loaders`) en tablas y modales. → tickets, stock, custodia, facturación.
- [x] Manejo visual de errores en peticiones HTTP mediante Notificaciones / Toasts. → Sonner en mutaciones + estados de error inline.

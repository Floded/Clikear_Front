## Lista de Tareas para el Desarrollo del Frontend

### Fase 1: Setup del Proyecto & Layout Base
- [ ] Inicializar proyecto React/Next.js con Tailwind CSS y TypeScript.
- [ ] Configurar cliente de API (Axios / TanStack Query).
- [ ] Implementar `Sidebar` de navegación principal (Tickets, Stock, Facturación, Configuración).
- [ ] Crear el layout responsivo base.

### Fase 2: Módulo de Tickets & Detalle
- [ ] Crear componentes UI reutilizables: `Badge` (estados), `Table`, `Modal`, `InputSearch`.
- [ ] Implementar la vista del listado de tickets agrupados por escuela / orden de despacho.
- [ ] Desarrollar el modal de detalle extendido con la información del PDF (CUE, Dirección, Distancia, Técnicos, GLPI).
- [ ] Conectar los endpoints de consulta (`GET /api/tickets`, `GET /api/tickets/:id`).

### Fase 3: Módulo de Inventario & Asignación
- [ ] Implementar vista de tabla de stock en depósito con alerta visual de bajo stock.
- [ ] Desarrollar la vista de "Materiales en Custodia de Empleados".
- [ ] Construir formulario modal para **Asignar Material a Empleado**:
  - [ ] Picker de Ítem.
  - [ ] Picker de Empleado.
  - [ ] Campo para `quantity_assigned`.
  - [ ] DatePicker obligatorio para `delivery_date`.
- [ ] Conectar endpoints de inventario (`GET /api/inventory`, `POST /api/assignments`).

### Fase 4: Módulo ARCA & Polish Final (opcional)
- [ ] Crear vista de facturación con indicador visual del estado de CAE de ARCA (Badge de pendiente/aprobado).
- [ ] Agregar estados de carga (`Skeleton Loaders`) en tablas y modales.
- [ ] Manejo visual de errores en peticiones HTTP mediante Notificaciones / Toasts.

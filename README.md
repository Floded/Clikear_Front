# Especificación Frontend: Sistema de Gestión de Tickets, Stock e Integración ARCA

Este documento contiene la arquitectura de interfaz de usuario, diseño de pantallas, componentes y la lista de tareas específicas para la implementación del Frontend con React / Next.js y Tailwind CSS.

---

## 1. Stack Tecnológico Frontend

* **Framework:** React 18+ / Next.js (App Router recomendada).
* **Estilos:** Tailwind CSS + Shadcn UI (componentes de UI limpios y accesibles).
* **Gestión de Estado & Fetching:** TanStack Query (React Query) para caché de API y Axios / Fetch nativo.
* **Iconos:** Lucide React.
* **Formularios:** React Hook Form + Zod (validación de esquemas de datos).

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
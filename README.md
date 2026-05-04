# InventarioTI — Sistema de Gestión de Equipos Tecnológicos

Sistema profesional para registrar, rastrear y auditar equipos tecnológicos por **filial** y **sector**. Diseñado para auditorías fiscales y operativas.

## 🚀 Características

- Registro completo de equipos (PC, Notebook, Celular, Impresora, Escáner, Tablet, etc.)
- Gestión de filiales y sectores
- Historial auditado de movimientos (asignaciones, traslados, bajas)
- Mantenimientos preventivos y correctivos con costos
- Sistema de alertas (garantías vencidas, equipos sin asignar, en reparación)
- Reportes profesionales exportables a **PDF**, **Excel** y **CSV**
- Modo auditoría con checklist y verificación por **código QR**
- Sistema de **autenticación con roles y permisos granulares** por módulo

## 📋 Requisitos

- Node.js 18+ o Bun
- Cuenta en Lovable Cloud (Supabase gestionado)

## ⚙️ Instalación

```bash
git clone <repo>
cd asset-atlas-co
bun install      # o: npm install
cp .env.example .env   # completá las variables
bun run dev      # arranca en http://localhost:5173
```

## 🔐 Acceso por defecto

- **Email:** `admin@inventario.com`
- **Contraseña:** `admin123`

> Cambiá la contraseña tras el primer ingreso desde Configuración.

## 🎯 Módulos

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs, gráficos por filial, alertas críticas |
| **Equipos** | CRUD con búsqueda en servidor + paginación |
| **Filiales / Sectores** | Estructura organizativa |
| **Movimientos** | Historial auditable de cambios |
| **Mantenimientos** | Preventivos y correctivos con costos |
| **Auditorías** | Checklist físico + escaneo QR |
| **Alertas** | Garantías vencidas / equipos sin asignar |
| **Reportes** | PDF / Excel / CSV con filtros multi-criterio |
| **Configuración** | Gestión de usuarios, roles y permisos |

## 📊 Para Auditoría

- Historial completo de cada activo
- Códigos QR para verificación física
- Reportes con encabezado, filtros aplicados y firma de coordinador/auditor
- Trazabilidad de movimientos y mantenimientos

## 🛠 Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Lovable Cloud (Supabase) · Recharts · jsPDF · XLSX · html5-qrcode

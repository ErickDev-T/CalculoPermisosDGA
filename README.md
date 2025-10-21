# Cálculo de Permisos DGA

Aplicación full‑stack para calcular vacaciones/licencias y gestionar feriados, integrada con OneDrive Personal (Microsoft Graph) para leer y escribir archivos de Excel y JSON.

- Backend: FastAPI (Python) con O365/Graph para OneDrive
- Frontend: React + Vite

## Requisitos

- Python 3.10+ (recomendado)
- Node.js 18+ (recomendado) y npm
- Una app registrada para OneDrive Personal (Client ID) o uso como Public Client

## Backend (FastAPI)

1) Variables de entorno (.env en `vacaciones-backend/`)

Crear un archivo `.env` en `vacaciones-backend` con:

```
CLIENT_ID=<client-id-de-tu-app>

# Rutas dentro de OneDrive Personal (ejemplos)
EMPLEADOS_PATH=/Documentos/rrhh/empleados.xlsx
VACACIONES_PATH=/Documentos/rrhh/vacaciones.xlsx
LICENCIAS_PATH=/Documentos/rrhh/licencias.xlsx
FERIADOS_PATH=/Documentos/rrhh/feriados.json
```

Notas:
- El primer arranque intenta autenticarse con OneDrive y abrirá el navegador. El token se guarda en `o365_token.txt` en el backend.
- Las rutas deben existir en tu OneDrive (o el código creará/actualizará los archivos al guardar).

2) Instalación y arranque (Windows PowerShell)

```
cd vacaciones-backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Por defecto expone `http://127.0.0.1:8000` con documentación interactiva en `http://127.0.0.1:8000/docs`.

3) Endpoints principales

- GET `/feriados` → Lista de feriados `YYYY-MM-DD` (OneDrive JSON)
- POST `/feriados` → Actualiza feriados. Body: `{ "feriados": ["YYYY-MM-DD", ...] }`
- POST `/calcular-vacaciones` → Calcula fin y reintegro. Body: `{ "fecha_inicio": "YYYY-MM-DD", "dias": 5 }`
- GET `/empleado/{codigo}` → Búsqueda básica por código (desde Excel en OneDrive)
- GET `/empleado-detalle/{codigo}` → Detalle de empleado (campos comunes normalizados)
- POST `/guardar-vacaciones` → Agrega registro en Excel de vacaciones en OneDrive
- POST `/guardar-licencia` → Agrega registro en Excel de licencias en OneDrive
- GET `/test-onedrive` → Verifica conexión a OneDrive/Graph

## Frontend (React + Vite)

1) Instalación y arranque

```
cd vacaciones-frontend
npm install
npm run dev
```

El frontend se sirve típicamente en `http://localhost:5173` y consume el backend en `http://127.0.0.1:8000`.

2) Vistas incluidas

- Cálculo de Vacaciones (cómputo local + guardado vía backend)
- Cálculo de Licencias (cómputo local + guardado vía backend)
- Gestión de Feriados (altas/bajas y guardado en OneDrive)

## Flujo típico de uso

1) Gestionar feriados en la UI (opcional) y guardar → persiste en OneDrive.
2) Buscar empleado por código.
3) Ingresar fecha de inicio y cantidad de días.
4) Calcular para ver `fecha_fin` y `fecha_reintegro` (no cuenta fines de semana ni feriados).
5) Guardar vacaciones/licencias para registrar en los Excel de OneDrive.

## Notas y solución de problemas

- Autenticación OneDrive: el primer inicio abre navegador para autorizar. El token se almacena en `o365_token.txt` (mismo directorio del backend).
- Variables `.env`: si `CLIENT_ID` está vacío o incorrecto, las operaciones de OneDrive fallarán.
- Puertos: backend `8000`, frontend `5173`. Ajusta URLs en el frontend si cambias puertos.
- Endpoints en frontend: si ves llamadas a `/guardar-vacaciones-ext` o `/guardar-licencia-ext`, cámbialas a `/guardar-vacaciones` y `/guardar-licencia` o añade esos alias en el backend.

## Estructura del repositorio

```
CalculoPermisosDGA/
├─ vacaciones-backend/
│  ├─ main.py
│  ├─ logic/
│  │  └─ vacaciones.py
│  ├─ data/
│  │  └─ feriados.json
│  └─ requirements.txt
└─ vacaciones-frontend/
   ├─ src/
   │  ├─ CalcularVacaciones.jsx
   │  ├─ CalcularLicencias.jsx
   │  ├─ FeriadosManager.jsx
   │  └─ EmpleadoSearch.jsx
   └─ package.json
```

---

## Resumen rápido (lo esencial)

- Backend: `cd vacaciones-backend && python -m venv .venv && .\.venv\Scripts\Activate && pip install -r requirements.txt && uvicorn main:app --reload`
- Frontend: `cd vacaciones-frontend && npm install && npm run dev`

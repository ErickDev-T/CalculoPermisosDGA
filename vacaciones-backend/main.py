import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
from openpyxl import Workbook, load_workbook
from io import BytesIO
from dotenv import load_dotenv
from O365 import Account
import requests
import tempfile

from logic.vacaciones import calcular_vacaciones

# CONFIGURACIÓN BÁSICA

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
EMPLEADOS_PATH = os.getenv("EMPLEADOS_PATH")
VACACIONES_PATH = os.getenv("VACACIONES_PATH")
LICENCIAS_PATH = os.getenv("LICENCIAS_PATH")
FERIADOS_PATH = os.getenv("FERIADOS_PATH")

app = FastAPI(
    title="API Vacaciones DGA",
    description="API para calcular vacaciones y gestionar feriados con OneDrive Personal",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FUNCION DE CONEXIÓN
def conectar_drive():
    credentials = (CLIENT_ID, None)
    account = Account(credentials, auth_flow_type='authorization')

    if not account.is_authenticated:
        print("Abriendo navegador para autenticación en OneDrive Personal...")
        account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

    print("Autenticación exitosa con OneDrive Personal")
    return account.storage().get_default_drive()


# FUNCIONES AUXILIARES
def cargar_feriados():
    print("Leyendo feriados desde OneDrive...")
    credentials = (CLIENT_ID, None)
    account = Account(credentials, auth_flow_type='authorization')

    if not account.is_authenticated:
        account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

    storage = account.storage()
    drive = storage.get_default_drive()

    try:
        print(f"Buscando archivo en ruta: {FERIADOS_PATH}") 
        file = drive.get_item_by_path(FERIADOS_PATH)

        response = account.connection.get(
            f"https://graph.microsoft.com/v1.0/me/drive/items/{file.object_id}/content"
        )
        print(f"📡 Respuesta HTTP: {response.status_code}")  

        if response.status_code != 200:
            raise Exception(f"Error {response.status_code} al leer {FERIADOS_PATH}")

        feriados = json.loads(response.text)
        if isinstance(feriados, dict) and "feriados" in feriados:
            feriados = feriados["feriados"]
        return [datetime.strptime(d, "%Y-%m-%d") for d in feriados]

    except Exception as e:
        print("Error leyendo feriados:", e)
        raise HTTPException(status_code=400, detail=f"Error cargando feriados: {str(e)}")


from O365 import FileSystemTokenBackend

def guardar_feriados(fechas: List[str]):
    print("Subiendo feriados a OneDrive...")

    # Cargar token guardado
    token_backend = FileSystemTokenBackend(token_path=".", token_filename="o365_token.txt")
    credentials = (CLIENT_ID, None)
    account = Account(credentials, auth_flow_type='authorization', token_backend=token_backend)

    # autenticar si es necesario
    if not account.is_authenticated:
        print("Autenticando...")
        account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

    # sorzar conexión activa
    connection = account.connection
    if connection is None:
        raise HTTPException(status_code=400, detail="No se pudo establecer la conexión con OneDrive (token inválido o no cargado)")

    # crear el JSON que se subira
    data = json.dumps({"feriados": fechas}, indent=2, ensure_ascii=False)
    headers = {"Content-Type": "application/json"}

    url = f"https://graph.microsoft.com/v1.0/me/drive/root:{FERIADOS_PATH}:/content"
    print(f"Enviando a: {url}")

    # subir a OneDrive PUT
    response = connection.session.put(url, headers=headers, data=data.encode("utf-8"))

    print(f"Respuesta HTTP: {response.status_code}")
    print(f"Respuesta completa: {response.text}")

    if response.status_code not in [200, 201]:
        raise HTTPException(status_code=400, detail=f"Error guardando feriados: {response.text}")

    print("Feriados guardados correctamente en OneDrive.")




# MODELOS Pydantic
class VacacionesRequest(BaseModel):
    fecha_inicio: str
    dias: int

class FeriadosRequest(BaseModel):
    feriados: List[str]

class GuardarVacacionesRequest(BaseModel):
    codigo: int
    fecha_inicio: str
    dias: int


# ENDPOINTS DE FERIADOS
@app.get("/feriados")
def get_feriados():
    try:
        fechas = cargar_feriados()
        return [d.strftime("%Y-%m-%d") for d in fechas]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error cargando feriados: {str(e)}")


@app.post("/feriados")
def post_feriados(req: FeriadosRequest):
    try:
        guardar_feriados(req.feriados)
        return {"message": "Feriados actualizados correctamente ✅"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# CALCULAR VACACIONES
@app.post("/calcular-vacaciones")
def post_calcular_vacaciones(request: VacacionesRequest):
    feriados = cargar_feriados()
    fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
    fecha_fin, fecha_reintegro = calcular_vacaciones(fecha_inicio, request.dias, feriados)
    return {
        "fecha_inicio": fecha_inicio.strftime("%A, %d de %B %Y"),
        "fecha_fin": fecha_fin.strftime("%A, %d de %B %Y"),
        "fecha_reintegro": fecha_reintegro.strftime("%A, %d de %B %Y")
    }


# LEER EMPLEADOS
def cargar_empleados():
    # conexion completa (retorna tanto el drive como el account)
    credentials = (CLIENT_ID, None)
    account = Account(credentials, auth_flow_type='authorization')

    if not account.is_authenticated:
        account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

    storage = account.storage()
    drive = storage.get_default_drive()

    try:
        # obtener el archivo desde OneDrive por su ruta
        file = drive.get_item_by_path(EMPLEADOS_PATH)

        # descargar el archivo directamente desde Graph
        response = account.connection.get(
            f"https://graph.microsoft.com/v1.0/me/drive/items/{file.object_id}/content"
        )

        if response.status_code != 200:
            raise Exception(f"Error HTTP {response.status_code} al descargar el archivo")

        # guardar temporalmente el archivo descargado
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        tmp_file.write(response.content)
        tmp_file.close()

        # leer el excel con pandas
        df = pd.read_excel(tmp_file.name)
        df.columns = [c.strip().lower() for c in df.columns]

        os.remove(tmp_file.name)
        return df

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error cargando empleados: {str(e)}")


@app.get("/empleado/{codigo}")
def get_empleado(codigo: int):
    try:
        empleados_df = cargar_empleados()
        empleado = empleados_df.loc[empleados_df["número"] == codigo]
        if empleado.empty:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        return {
            "codigo": codigo,
            "nombre": empleado.iloc[0]["nombre"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# GUARDAR EN EXCEL
def guardar_registro_excel(path: str, data: list):
    # conexion directa con onedrive personal
    credentials = (CLIENT_ID, None)
    account = Account(credentials, auth_flow_type='authorization')

    if not account.is_authenticated:
        account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

    storage = account.storage()
    drive = storage.get_default_drive()

    try:
        # buscar el archivo por su ruta
        file = drive.get_item_by_path(path)

        # descargar su contenido actual
        response = account.connection.get(
            f"https://graph.microsoft.com/v1.0/me/drive/items/{file.object_id}/content"
        )
        if response.status_code != 200:
            raise Exception(f"Error {response.status_code} al descargar {path}")

        # guardar temporal y leer
        tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        tmp_in.write(response.content)
        tmp_in.close()

        try:
            df = pd.read_excel(tmp_in.name)
        except Exception:
            df = pd.DataFrame(columns=["Código", "Nombre", "Fecha inicio", "Días", "Fecha fin", "Fecha reintegro"])

        os.remove(tmp_in.name)

        # agregar nueva fila
        df.loc[len(df)] = data

        # guardar excel actualizado en temporal
        tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        df.to_excel(tmp_out.name, index=False)
        tmp_out.close()

        # subir al mismo archivo en OneDrive 
        headers = {
            "Content-Type": "application/octet-stream"
        }
        with open(tmp_out.name, "rb") as f:
            upload_response = account.connection.session.put(
                f"https://graph.microsoft.com/v1.0/me/drive/root:{path}:/content",
                headers=headers,
                data=f
            )

        os.remove(tmp_out.name)

        if upload_response.status_code not in [200, 201]:
            raise Exception(f"Error {upload_response.status_code} al subir {path}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"{upload_response.status_code if 'upload_response' in locals() else 400}: {str(e)}")

@app.post("/guardar-vacaciones")
def guardar_vacaciones(request: GuardarVacacionesRequest):
    try:
        feriados = cargar_feriados()
        fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
        fecha_fin, fecha_reintegro = calcular_vacaciones(fecha_inicio, request.dias, feriados)

        empleados_df = cargar_empleados()
        empleado = empleados_df.loc[empleados_df["número"] == request.codigo]
        if empleado.empty:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        nombre = empleado.iloc[0]["nombre"]

        guardar_registro_excel(
            VACACIONES_PATH,
            [
                request.codigo,
                nombre,
                fecha_inicio.strftime("%Y-%m-%d"),
                request.dias,
                fecha_fin.strftime("%Y-%m-%d"),
                fecha_reintegro.strftime("%Y-%m-%d")
            ]
        )

        return {"message": "Vacaciones guardadas correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/guardar-licencia")
def guardar_licencia(request: GuardarVacacionesRequest):
    try:
        feriados = cargar_feriados()
        fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
        fecha_fin, fecha_reintegro = calcular_vacaciones(fecha_inicio, request.dias, feriados)

        empleados_df = cargar_empleados()
        empleado = empleados_df.loc[empleados_df["número"] == request.codigo]
        if empleado.empty:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        nombre = empleado.iloc[0]["nombre"]

        guardar_registro_excel(
            LICENCIAS_PATH,
            [
                request.codigo,
                nombre,
                fecha_inicio.strftime("%Y-%m-%d"),
                request.dias,
                fecha_fin.strftime("%Y-%m-%d"),
                fecha_reintegro.strftime("%Y-%m-%d")
            ]
        )

        return {"message": "Licencia guardada correctamente ✅"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# test conexión onedrive
@app.get("/test-onedrive")
def test_onedrive():
    from O365 import Account
    try:
        credentials = (CLIENT_ID, None)
        account = Account(credentials, auth_flow_type='authorization')

        if not account.is_authenticated:
            account.authenticate(scopes=['offline_access', 'User.Read', 'Files.ReadWrite'])

        storage = account.storage()
        drive = storage.get_default_drive()

        response = account.connection.get(url="https://graph.microsoft.com/v1.0/me/drive")
        info = response.json()

        owner = info.get("owner", {}).get("user", {}).get("displayName", "Desconocido")
        email = info.get("owner", {}).get("user", {}).get("email", "N/A")
        drive_type = info.get("driveType", "N/A")
        drive_id = info.get("id", "N/A")

        root_folder = drive.get_root_folder()
        items = [item.name for item in root_folder.get_items(limit=5)]

        return {
            "status": "Conexión exitosa con OneDrive Personal",
            "owner": owner,
            "email": email,
            "drive_type": drive_type,
            "drive_id": drive_id,
            "ejemplo_items": items
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f" Error: {str(e)}")
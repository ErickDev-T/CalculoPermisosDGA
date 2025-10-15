import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
from openpyxl import Workbook, load_workbook
import os

from logic.vacaciones import calcular_vacaciones

FERIADOS_FILE = "data/feriados.json"

def cargar_feriados():
    with open(FERIADOS_FILE, "r", encoding="utf-8") as f:
        return [datetime.strptime(d, "%Y-%m-%d") for d in json.load(f)]

def guardar_feriados(fechas: List[str]):
    with open(FERIADOS_FILE, "w", encoding="utf-8") as f:
        json.dump(fechas, f, indent=2, ensure_ascii=False)

app = FastAPI(
    title="API Vacaciones DGA",
    description="API para calcular vacaciones y gestionar feriados.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VacacionesRequest(BaseModel):
    fecha_inicio: str
    dias: int

class FeriadosRequest(BaseModel):
    feriados: List[str]

@app.get("/feriados")
def get_feriados():
    with open(FERIADOS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/feriados")
def post_feriados(req: FeriadosRequest):
    try:
        guardar_feriados(req.feriados)
        return {"message": "Feriados actualizados correctamente."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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


class GuardarVacacionesRequest(BaseModel):
    codigo: int
    fecha_inicio: str
    dias: int

def cargar_empleados():
    df = pd.read_excel("empleados.xlsx")
    df.columns = [c.strip().lower() for c in df.columns]
    return df

@app.get("/empleado/{codigo}")
def get_empleado(codigo: int):
    try:
        empleados_df = cargar_empleados()
        empleado = empleados_df.loc[empleados_df["código"] == codigo]

        if empleado.empty:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        nombre = empleado.iloc[0]["nombre colaborador"]

        return {
            "codigo": codigo,
            "nombre": nombre
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/guardar-vacaciones")
def guardar_vacaciones(request: GuardarVacacionesRequest):
    try:
        # cargar feriados
        feriados = cargar_feriados()

        # calcular fechas
        fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
        fecha_fin, fecha_reintegro = calcular_vacaciones(fecha_inicio, request.dias, feriados)

        # buscar nombre del empleado por código
        # cargar empleados al momento de la consulta 
        empleados_df = cargar_empleados()
        empleado = empleados_df.loc[empleados_df["código"] == request.codigo]


        if empleado.empty:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        nombre = empleado.iloc[0]["nombre colaborador"]

        # crear o abrir el archivo Excel
        archivo = "registros_vacaciones.xlsx"
        if not os.path.exists(archivo):
            wb = Workbook()
            ws = wb.active
            ws.append(["Código", "Nombre del colaborador", "Fecha inicio", "Días", "Fecha fin", "Fecha reintegro"])
        else:
            wb = load_workbook(archivo)
            ws = wb.active

        # agregar nueva fila
        ws.append([
            request.codigo,
            nombre,
            fecha_inicio.strftime("%Y-%m-%d"),
            request.dias,
            fecha_fin.strftime("%Y-%m-%d"),
            fecha_reintegro.strftime("%Y-%m-%d")
        ])

        wb.save(archivo)

        return {
            "message": "Registro guardado correctamente ✅",
            "data": {
                "codigo": request.codigo,
                "nombre": nombre,
                "fecha_inicio": fecha_inicio.strftime("%Y-%m-%d"),
                "fecha_fin": fecha_fin.strftime("%Y-%m-%d"),
                "fecha_reintegro": fecha_reintegro.strftime("%Y-%m-%d")
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
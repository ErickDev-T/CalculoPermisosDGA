from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Permitir conexión desde React (por ejemplo localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# leer el excel una sola vez al iniciar
excel_path = "empleados.xlsx"  
df = pd.read_excel(excel_path)

df.columns = [c.strip().lower() for c in df.columns]

@app.get("/empleado/{codigo}")
def get_empleado(codigo: str):
    try:
        codigo_int = int(codigo)
    except ValueError:
        raise HTTPException(status_code=400, detail="Código inválido")

    # buscar por código
    empleado = df.loc[df["código"] == codigo_int]

    if empleado.empty:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    fila = empleado.iloc[0]
    return {
        "codigo": int(fila["código"]),
        "nombre": fila["nombre colaborador"],
        "cedula": fila["cédula"]
    }


#http://127.0.0.1:8000/docs
from datetime import datetime, timedelta
from typing import List

def es_dia_laboral(fecha: datetime, feriados: List[datetime]) -> bool:
    # devuelve False si la fecha cae sabado, domingo o feriado
    if fecha.weekday() in [5, 6]:  # 5 = sabado, 6 = domingo
        return False
    if fecha in feriados:
        return False
    return True

def calcular_vacaciones(fecha_inicio: datetime, dias: int, feriados: List[datetime]):
    # calcula la fecha fin y reintegro de vacaciones
    dias_contados = 0
    fecha_actual = fecha_inicio

    while dias_contados < dias:
        fecha_actual += timedelta(days=1)
        if es_dia_laboral(fecha_actual, feriados):
            dias_contados += 1

    fecha_fin = fecha_actual

    # siguiente dia laboral para reintegro
    fecha_reintegro = fecha_fin + timedelta(days=1)
    while not es_dia_laboral(fecha_reintegro, feriados):
        fecha_reintegro += timedelta(days=1)

    return fecha_fin, fecha_reintegro

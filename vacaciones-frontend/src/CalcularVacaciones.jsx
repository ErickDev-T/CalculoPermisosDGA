
import { useState, useEffect } from "react";

function CalcularVacaciones() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [vacaciones, setVacaciones] = useState(null);
  const [feriados, setFeriados] = useState([]);

  // Cargar feriados (una vez) para cálculo local
  useEffect(() => {
    fetch("http://127.0.0.1:8000/feriados")
      .then((r) => r.json())
      .then((fechas) => (Array.isArray(fechas) ? setFeriados(fechas) : setFeriados([])))
      .catch(() => setFeriados([]));
  }, []);

  // Ocultar mensajes automáticamente
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Util: determina si es día laboral (no fin de semana ni feriado)
  const esDiaLaboral = (fecha) => {
    const dow = fecha.getDay(); // 0=Domingo, 6=Sábado
    if (dow === 0 || dow === 6) return false;
    const iso = fecha.toISOString().split("T")[0];
    return !feriados.includes(iso);
  };

  // Cálculo local: misma lógica que el backend
  const calcularVacacionesLocal = (fechaInicioStr, diasNum) => {
    let fechaActual = new Date(fechaInicioStr);
    let contados = 0;

    while (contados < diasNum) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      if (esDiaLaboral(fechaActual)) contados += 1;
    }

    const fechaFin = new Date(fechaActual);
    // siguiente día laboral para reintegro
    const reintegro = new Date(fechaFin);
    do {
      reintegro.setDate(reintegro.getDate() + 1);
    } while (!esDiaLaboral(reintegro));

    return {
      fecha_fin: fechaFin.toISOString().split("T")[0],
      fecha_reintegro: reintegro.toISOString().split("T")[0],
    };
  };

  // Buscar empleado (detalle)
  const buscarEmpleado = async () => {
    setMensaje("");
    setEmpleado(null);
    setResultado(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/empleado-detalle/${codigo}`);
      if (!res.ok) throw new Error("Empleado no encontrado");
      const data = await res.json();
      setEmpleado(data);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  // Calcular vacaciones localmente (rápido, sin guardar)
  const calcularVacaciones = async () => {
    if (!codigo || !fechaInicio || !dias) {
      setMensaje("Por favor completa todos los campos");
      return;
    }

    setMensaje("Calculando...");
    try {
      const diasNum = Number(dias);
      const data = calcularVacacionesLocal(fechaInicio, diasNum);
      setResultado(data);
      setVacaciones(data);
      setMensaje("Cálculo realizado correctamente");
    } catch (err) {
      setMensaje("Error al calcular localmente");
    }
  };

  // Guardar en Excel (backend)
  const guardarVacaciones = async () => {
    if (!codigo || !fechaInicio || !dias || !vacaciones) {
      setMensaje("Primero calcula las vacaciones antes de guardar");
      return;
    }

    setMensaje("Guardando...");
    try {
      const res = await fetch("http://127.0.0.1:8000/guardar-vacaciones-ext", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: Number(codigo),
          fecha_inicio: fechaInicio,
          dias: Number(dias),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar");

      // limpiar todos los campos y ocultar info al guardar con éxito
      setMensaje("Vacaciones guardadas exitosamente");
      setCodigo("");
      setEmpleado(null);
      setFechaInicio("");
      setDias("");
      setResultado(null);
      setVacaciones(null);
    } catch (err) {
      setMensaje("Error: " + err.message);
    }
  };

  // Formatear fechas legibles
  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        background: "#f4f8f8",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        fontFamily: "Calibri, sans-serif",
        padding: "20px",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#1b3b70",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        Gerencia de RR.HH.
      </h2>
      <h3
        style={{
          textAlign: "center",
          color: "#004aad",
          marginBottom: "25px",
        }}
      >
        Cálculos para Vacaciones
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <input
          type="text"
          placeholder="Código del empleado"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          style={{
            flex: "1",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
        <button
          onClick={buscarEmpleado}
          style={{
            background: "#0066cc",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Buscar
        </button>
      </div>

      {empleado && (
        <div
          style={{
            background: "#e6f0ff",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #bcd4ff",
          }}
        >
          <div style={{ display: "flex", gap: "16px", marginBottom: "6px" }}>
            <div style={{ flex: 1 }}><strong>Código:</strong> {empleado.codigo}</div>
            <div style={{ flex: 1 }}><strong>Nombre:</strong> {empleado.nombre}</div>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "6px" }}>
            <div style={{ flex: 1 }}><strong>Cargo:</strong> {empleado.cargo}</div>
            <div style={{ flex: 1 }}><strong>Ubicación:</strong> {empleado.ubicacion}</div>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}><strong>Dependencia:</strong> {empleado.dependencia}</div>
            <div style={{ flex: 1 }}><strong>Oficina:</strong> {empleado.oficina}</div>
          </div>
        </div>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                background: "#c40000",
                color: "white",
                padding: "8px",
                border: "1px solid #999",
              }}
            >
              Fecha inicio Vacaciones
            </th>
            <th
              style={{
                background: "#c40000",
                color: "white",
                padding: "8px",
                border: "1px solid #999",
              }}
            >
              Días
            </th>
            <th
              style={{
                background: "#004aad",
                color: "white",
                padding: "8px",
                border: "1px solid #999",
              }}
            >
              Fecha fin de Vacaciones
            </th>
            <th
              style={{
                background: "#004aad",
                color: "white",
                padding: "8px",
                border: "1px solid #999",
              }}
            >
              Fecha de Reintegro Vacaciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "15px",
                }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              <input
                type="number"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                style={{
                  width: "60px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              {resultado ? formatearFecha(resultado.fecha_fin) : "-"}
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              {resultado ? formatearFecha(resultado.fecha_reintegro) : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={calcularVacaciones}
          style={{
            background: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            fontWeight: "600",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Calcular
        </button>

        <button
          onClick={guardarVacaciones}
          style={{
            background: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Guardar
        </button>
      </div>

      {mensaje && (
        <p
          style={{
            marginTop: "20px",
            color: (mensaje || "").toLowerCase().includes("error")
              ? "#e74c3c"
              : (mensaje || "").toLowerCase().includes("primero")
              ? "#f39c12"
              : "#2c3e50",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}

export default CalcularVacaciones;

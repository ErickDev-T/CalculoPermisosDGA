import { useState, useEffect } from "react";

function CalcularLicencias() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [licencia, setLicencia] = useState(null);
  const [feriados, setFeriados] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/feriados")
      .then((r) => r.json())
      .then((fechas) => (Array.isArray(fechas) ? setFeriados(fechas) : setFeriados([])))
      .catch(() => setFeriados([]));
  }, []);

  useEffect(() => {
    if (mensaje) {
      const t = setTimeout(() => setMensaje(""), 8000);
      return () => clearTimeout(t);
    }
  }, [mensaje]);

  const esDiaLaboral = (fecha) => {
    const dow = fecha.getDay();
    if (dow === 0 || dow === 6) return false;
    const iso = fecha.toISOString().split("T")[0];
    return !feriados.includes(iso);
  };

  const calcularLocal = (fechaInicioStr, diasNum) => {
    let fechaActual = new Date(fechaInicioStr);
    let contados = 0;
    while (contados < diasNum) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      if (esDiaLaboral(fechaActual)) contados += 1;
    }
    const fechaFin = new Date(fechaActual);
    const reintegro = new Date(fechaFin);
    do {
      reintegro.setDate(reintegro.getDate() + 1);
    } while (!esDiaLaboral(reintegro));
    return {
      fecha_fin: fechaFin.toISOString().split("T")[0],
      fecha_reintegro: reintegro.toISOString().split("T")[0],
    };
  };

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

  const calcularLicencia = async () => {
    if (!codigo || !fechaInicio || !dias) {
      setMensaje("Por favor completa todos los campos");
      return;
    }
    setMensaje("Calculando...");
    try {
      const data = calcularLocal(fechaInicio, Number(dias));
      setResultado(data);
      setLicencia(data);
      setMensaje("Cálculo realizado correctamente");
    } catch (err) {
      setMensaje("Error al calcular localmente");
    }
  };

  const guardarLicencia = async () => {
    if (!codigo || !fechaInicio || !dias || !licencia) {
      setMensaje("Primero calcula la licencia antes de guardar");
      return;
    }
    setMensaje("Guardando...");
    try {
      const res = await fetch("http://127.0.0.1:8000/guardar-licencia-ext", {
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
      setResultado(data.data);
      setMensaje("Licencia guardada exitosamente");
      setCodigo("");
      setEmpleado(null);
      setFechaInicio("");
      setDias("");
      setResultado(null);
      setLicencia(null);
    } catch (err) {
      setMensaje("Error: " + err.message);
    }
  };

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
        style={{ textAlign: "center", color: "#1b3b70", fontWeight: 700, marginBottom: 10 }}
      >
        Gerencia de RR.HH.
      </h2>
      <h3 style={{ textAlign: "center", color: "#004aad", marginBottom: 25 }}>
        Cálculos para Licencias
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
        <input
          type="text"
          placeholder="Código del empleado"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button
          onClick={buscarEmpleado}
          style={{ background: "#0066cc", color: "white", padding: "8px 16px", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
        >
          Buscar
        </button>
      </div>

      {empleado && (
        <div style={{ background: "#e6f0ff", borderRadius: 6, padding: 12, marginBottom: 15, border: "1px solid #bcd4ff" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
            <div style={{ flex: 1 }}><strong>Código:</strong> {empleado.codigo}</div>
            <div style={{ flex: 1 }}><strong>Nombre:</strong> {empleado.nombre}</div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
            <div style={{ flex: 1 }}><strong>Cargo:</strong> {empleado.cargo}</div>
            <div style={{ flex: 1 }}><strong>Ubicación:</strong> {empleado.ubicacion}</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}><strong>Dependencia:</strong> {empleado.dependencia}</div>
            <div style={{ flex: 1 }}><strong>Oficina:</strong> {empleado.oficina}</div>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ background: "#c40000", color: "white", padding: 8, border: "1px solid #999" }}>
              Fecha inicio Licencia
            </th>
            <th style={{ background: "#c40000", color: "white", padding: 8, border: "1px solid #999" }}>
              Días
            </th>
            <th style={{ background: "#004aad", color: "white", padding: 8, border: "1px solid #999" }}>
              Fecha fin de Licencia
            </th>
            <th style={{ background: "#004aad", color: "white", padding: 8, border: "1px solid #999" }}>
              Fecha de Reintegro de Licencia
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #ccc", padding: 6 }}>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 15 }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: 6 }}>
              <input
                type="number"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                style={{ width: 70, border: "1px solid #ccc", borderRadius: 4, textAlign: "center" }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: 6 }}>
              {resultado ? formatearFecha(resultado.fecha_fin) : "-"}
            </td>
            <td style={{ border: "1px solid #ccc", padding: 6 }}>
              {resultado ? formatearFecha(resultado.fecha_reintegro) : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button
          onClick={calcularLicencia}
          style={{ background: "#27ae60", color: "white", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer", marginRight: 10 }}
        >
          Calcular
        </button>
        <button
          onClick={guardarLicencia}
          style={{ background: "#27ae60", color: "white", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
        >
          Guardar
        </button>
      </div>

      {mensaje && (
        <p style={{ marginTop: 20, color: (mensaje || "").toLowerCase().includes("error") ? "#e74c3c" : (mensaje || "").toLowerCase().includes("primero") ? "#f39c12" : "#2c3e50", textAlign: "center", fontWeight: 500 }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}

export default CalcularLicencias;

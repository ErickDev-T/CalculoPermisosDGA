import { useState, useEffect } from "react";

function CalcularLicencias() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  //  borrar mensaje despues de pal segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // buscar empleado
  const buscarEmpleado = async () => {
    setMensaje("");
    setEmpleado(null);
    setResultado(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/empleado/${codigo}`);
      if (!res.ok) throw new Error("Empleado no encontrado");
      const data = await res.json();
      setEmpleado(data);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  // calcular Licencias
  const calcularLicencia = async () => {
    if (!codigo || !fechaInicio || !dias) {
      setMensaje("⚠️ Por favor completa todos los campos");
      return;
    }

    setMensaje("⏳ Calculando...");
    try {
      const res = await fetch("http://127.0.0.1:8000/guardar-licencia", {
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
      setMensaje("✅ " + data.message);
    } catch (err) {
      setMensaje("❌ " + err.message);
    }
  };

  // formatear fecha con día y mes escrito en español
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
        Cálculos para Licencias
      </h3>

      {/* Buscar empleado */}
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
          🔍 Buscar
        </button>
      </div>

      {empleado && (
        <div
          style={{
            background: "#e6f0ff",
            borderRadius: "6px",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #bcd4ff",
          }}
        >
          <strong>Nombre:</strong> {empleado.nombre}
        </div>
      )}

      {/* Tabla de cálculos */}
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
              Fecha inicio Licencia
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
              Fecha fin de Licencia
            </th>
            <th
              style={{
                background: "#004aad",
                color: "white",
                padding: "8px",
                border: "1px solid #999",
              }}
            >
              Fecha de Reintegro de Licencia
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
                  width: "70px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              {resultado ? formatearFecha(resultado.fecha_fin) : "—"}
            </td>
            <td style={{ border: "1px solid #ccc", padding: "6px" }}>
              {resultado ? formatearFecha(resultado.fecha_reintegro) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={calcularLicencia}
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
          💾 Calcular y Guardar
        </button>
      </div>

      {mensaje && (
        <p
          style={{
            marginTop: "20px",
            color: mensaje.includes("❌")
              ? "#e74c3c"
              : mensaje.includes("⚠️")
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

export default CalcularLicencias;

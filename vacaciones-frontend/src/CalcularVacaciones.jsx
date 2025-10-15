import { useState, useEffect } from "react";

function CalcularVacaciones() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  // efecto para borrar el mensaje automaticamente después de pal de segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

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

  const calcularVacaciones = async () => {
    if (!codigo || !fechaInicio || !dias) {
      setMensaje("⚠️ Por favor completa todos los campos");
      return;
    }

    setMensaje("⏳ Calculando...");
    try {
      const res = await fetch("http://127.0.0.1:8000/guardar-vacaciones", {
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

      // limpia los campos después de 4 segundos
      setTimeout(() => {
        setCodigo("");
        setEmpleado(null);
        setFechaInicio("");
        setDias("");
        setResultado(null);
      }, 4000);

    } catch (err) {
      setMensaje("❌ " + err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "40px auto",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        padding: "25px 30px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#2c3e50",
          fontWeight: "600",
        }}
      >
        🗓️ Cálculo de Vacaciones
      </h2>

      <input
        type="text"
        placeholder="Código del empleado"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "10px",
          fontSize: "15px",
        }}
      />
      <button
        onClick={buscarEmpleado}
        style={{
          width: "100%",
          background: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        🔍 Buscar empleado
      </button>

      {empleado && (
        <div
          style={{
            background: "#f5f9ff",
            marginTop: "15px",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Nombre:</strong> {empleado.nombre}
          </p>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <label style={{ fontWeight: "500" }}>📅 Fecha de inicio</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />

        <label style={{ fontWeight: "500" }}>🕒 Días de vacaciones</label>
        <input
          type="number"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />

        <button
          onClick={calcularVacaciones}
          style={{
            width: "100%",
            background: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
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

      {resultado && (
        <div
          style={{
            background: "#ecf9f1",
            borderRadius: "10px",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h4 style={{ marginTop: 0, color: "#27ae60" }}>📆 Resultado</h4>
          <p>
            <strong>Fecha inicio:</strong> {resultado.fecha_inicio}
          </p>
          <p>
            <strong>Fecha fin:</strong> {resultado.fecha_fin}
          </p>
          <p>
            <strong>Fecha reintegro:</strong> {resultado.fecha_reintegro}
          </p>
        </div>
      )}
    </div>
  );
}

export default CalcularVacaciones;

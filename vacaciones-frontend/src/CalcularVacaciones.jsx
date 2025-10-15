import { useState } from "react";

function CalcularVacaciones() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");

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
      setMensaje("Por favor completa todos los campos");
      return;
    }

    setMensaje("Calculando...");
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
      setMensaje(data.message);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "30px auto", textAlign: "center" }}>
      <h2>Cálculo de Vacaciones</h2>

      <input
        type="text"
        placeholder="Código del empleado"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        style={{ padding: "8px", width: "100%", marginBottom: "10px" }}
      />
      <button onClick={buscarEmpleado}>Buscar empleado</button>

      {empleado && (
        <div style={{ marginTop: "10px", textAlign: "left" }}>
          <p><strong>Nombre:</strong> {empleado.nombre}</p>
        </div>
      )}

      <div style={{ marginTop: "15px" }}>
        <label>Fecha de inicio:</label><br />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          style={{ padding: "8px", marginBottom: "10px" }}
        /><br />

        <label>Días de vacaciones:</label><br />
        <input
          type="number"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
          style={{ padding: "8px", marginBottom: "10px" }}
        /><br />

        <button onClick={calcularVacaciones}>Calcular y guardar</button>
      </div>

      {mensaje && <p style={{ marginTop: "15px", color: "blue" }}>{mensaje}</p>}

      {resultado && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h4>📅 Resultado</h4>
          <p><strong>Fecha inicio:</strong> {resultado.fecha_inicio}</p>
          <p><strong>Fecha fin:</strong> {resultado.fecha_fin}</p>
          <p><strong>Fecha reintegro:</strong> {resultado.fecha_reintegro}</p>
        </div>
      )}
    </div>
  );
}

export default CalcularVacaciones;

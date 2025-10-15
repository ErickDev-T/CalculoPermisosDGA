import { useState } from "react";

function EmpleadoSearch() {
  const [codigo, setCodigo] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [error, setError] = useState(null);

  const buscarEmpleado = async () => {
    setError(null);
    setEmpleado(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/empleado/${codigo}`);
      if (!res.ok) {
        throw new Error("Empleado no encontrado");
      }
      const data = await res.json();
      setEmpleado(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}>
      <h2>Buscar Empleado</h2>

      <input
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Ingresa el código"
        style={{ padding: "8px", width: "100%", marginBottom: "10px" }}
      />

      <button
        onClick={buscarEmpleado}
        style={{ padding: "8px 16px", cursor: "pointer" }}
      >
        Buscar
      </button>

      {empleado && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h4>Resultado:</h4>
          <p><strong>Código:</strong> {empleado.codigo}</p>
          <p><strong>Nombre:</strong> {empleado.nombre}</p>
          <p><strong>Cédula:</strong> {empleado.cedula}</p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default EmpleadoSearch;

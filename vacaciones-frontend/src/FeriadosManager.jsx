import { useState, useEffect } from "react";

function FeriadosManager() {
  const [feriados, setFeriados] = useState([]);
  const [nuevo, setNuevo] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/feriados")
      .then((r) => r.json())
      .then(setFeriados);
  }, []);

  const agregarFeriado = () => {
    if (!nuevo) return;
    setFeriados([...feriados, nuevo]);
    setNuevo("");
  };

  const eliminarFeriado = (fecha) => {
    setFeriados(feriados.filter((f) => f !== fecha));
  };

  const guardarCambios = async () => {
    await fetch("http://127.0.0.1:8000/feriados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feriados }),
    });
    alert("Feriados actualizados correctamente ✅");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto", textAlign: "center" }}>
      <h3>📅 Días Feriados</h3>
      <input
        type="date"
        value={nuevo}
        onChange={(e) => setNuevo(e.target.value)}
      />
      <button onClick={agregarFeriado}>Agregar</button>

      <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
        {feriados.map((f) => (
          <li key={f} style={{ marginBottom: "5px" }}>
            {f}{" "}
            <button onClick={() => eliminarFeriado(f)} style={{ color: "red" }}>
              X
            </button>
          </li>
        ))}
      </ul>

      <button onClick={guardarCambios} style={{ marginTop: "10px" }}>
        Guardar cambios
      </button>
    </div>
  );
}

export default FeriadosManager;

import { useState, useEffect } from "react";

function FeriadosManager() {
  const [feriados, setFeriados] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [mensaje, setMensaje] = useState("");

  //cargar feriados al iniciar
  useEffect(() => {
    fetch("http://127.0.0.1:8000/feriados")
      .then((r) => r.json())
      .then(setFeriados)
      .catch(() => setMensaje(" Error al cargar los feriados"));
  }, []);

  // agregar un nuevo feriado
  const agregarFeriado = () => {
    if (!nuevo) {
      setMensaje("Selecciona una fecha antes de agregar");
      return;
    }
    if (feriados.includes(nuevo)) {
      setMensaje("Esa fecha ya está registrada");
      return;
    }
    setFeriados([...feriados, nuevo]);
    setNuevo("");
    setMensaje("Feriado agregado temporalmente");
  };

  // eliminar feriado
  const eliminarFeriado = (fecha) => {
    setFeriados(feriados.filter((f) => f !== fecha));
    setMensaje("Feriado eliminado");
  };

  // guardar cambios en el backend
  const guardarCambios = async () => {
    try {
      await fetch("http://127.0.0.1:8000/feriados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feriados }), 
      });
      setMensaje("Feriados guardados correctamente");
    } catch (err) {
      setMensaje(" Error al guardar los cambios");
    }
  };

  // ocultar mensaje automáticamente después de 5s
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

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
        textAlign: "center",
      }}
    >
      <h3
        style={{
          color: "#2c3e50",
          fontWeight: "600",
          marginBottom: "20px",
        }}
      >
        📅 Gestión de Días Feriados
      </h3>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <input
          type="date"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            flex: "1",
          }}
        />
        <button
          onClick={agregarFeriado}
          style={{
            background: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ➕ Agregar
        </button>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          marginTop: "20px",
          maxHeight: "200px",
          overflowY: "auto",
          textAlign: "left",
        }}
      >
        {feriados.length === 0 && (
          <p style={{ color: "#7f8c8d", textAlign: "center" }}>
            No hay feriados registrados
          </p>
        )}
        {feriados.map((f) => (
          <li
            key={f}
            style={{
              background: "#f7f9fc",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #e3e6ea",
            }}
          >
            <span style={{ color: "#2c3e50" }}>{f}</span>
            <button
              onClick={() => eliminarFeriado(f)}
              style={{
                background: "transparent",
                color: "#e74c3c",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={guardarCambios}
        style={{
          marginTop: "15px",
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
        💾 Guardar cambios
      </button>

      {mensaje && (
        <p
          style={{
            marginTop: "15px",
            color: mensaje.includes("❌")
              ? "#e74c3c"
              : mensaje.includes("⚠️")
              ? "#f39c12"
              : "#2c3e50",
            fontWeight: "500",
          }}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}

export default FeriadosManager;

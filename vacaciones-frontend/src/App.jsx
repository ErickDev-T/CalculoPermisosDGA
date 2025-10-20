import { useState } from 'react'
import './App.css'
import EmpleadoSearch from './EmpleadoSearch.jsx'
import FeriadosManager from './FeriadosManager.jsx'
import CalcularVacaciones from './CalcularVacaciones.jsx'
import CalcularLicencias from './CalcularLicencias.jsx'
function App() {
  const [view, setView] = useState('vacaciones')

  return (
    <>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
        <button onClick={() => setView('vacaciones')} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: view==='vacaciones' ? '#004aad' : '#fff', color: view==='vacaciones' ? '#fff' : '#333' }}>Vacaciones</button>
        <button onClick={() => setView('licencias')} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: view==='licencias' ? '#004aad' : '#fff', color: view==='licencias' ? '#fff' : '#333' }}>Licencias</button>
      </div>

      {view === 'vacaciones' ? <CalcularVacaciones /> : <CalcularLicencias />}
      <hr />
      <FeriadosManager />
      <hr />
    </>
  )
}

export default App

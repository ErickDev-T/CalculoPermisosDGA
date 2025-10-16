import { useState } from 'react'
import './App.css'
import EmpleadoSearch from './EmpleadoSearch.jsx'
import FeriadosManager from './FeriadosManager.jsx'
import CalcularVacaciones from './CalcularVacaciones.jsx'
import CalcularLicencias from './CalcularLicencias.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <CalcularVacaciones />
      <hr />
      <CalcularLicencias />
      <hr />
      <FeriadosManager />
      <hr />
    </>
  )
}

export default App

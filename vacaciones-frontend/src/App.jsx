import { useState } from 'react'
import './App.css'
import EmpleadoSearch from './EmpleadoSearch.jsx'
import FeriadosManager from './FeriadosManager.jsx'
import CalcularVacaciones from './CalcularVacaciones.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      <EmpleadoSearch />
      <hr />
      <CalcularVacaciones />
      <hr />
      <FeriadosManager />
    </>
  )
}

export default App

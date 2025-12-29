import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import DashboardEntrenador from './pages/DashboardEntrenador';
import DashboardDeportista from './pages/DashboardDeportista';
import Deportistas from './pages/Deportistas';
import Evaluaciones from './pages/Evaluaciones';
import Progreso from './pages/Progreso';
import Habilidades from './pages/Habilidades';
import Grupos from './pages/Grupos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* RUTAS PROTEGIDAS CON LAYOUT */}
        <Route path="/entrenador" element={<Layout />}>
          <Route index element={<DashboardEntrenador />} />
          <Route path="deportistas" element={<Deportistas />} />
          <Route path="evaluaciones" element={<Evaluaciones />} />
          <Route path="habilidades" element={<Habilidades />} />
          <Route path="grupos" element={<Grupos />} />
        </Route>
        
        <Route path="/deportista" element={<Layout />}>
          <Route index element={<DashboardDeportista />} />
          <Route path="progreso" element={<Progreso />} />
          <Route path="evaluaciones" element={<Evaluaciones />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
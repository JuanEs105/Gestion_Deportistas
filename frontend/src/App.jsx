// frontend/src/App.jsx - VERSIÓN COMPLETADA CON RUTAS DE EDICIÓN
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelection from './pages/RoleSelection';
import DeportistaAcceso from './pages/DeportistaAcceso';
import RegistroDeportista from './pages/RegistroDeportista';
import TerminosCondiciones from './pages/TerminosCondiciones';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout/Layout';

// Páginas Entrenador
import DashboardEntrenador from './pages/DashboardEntrenador';
import Deportistas from './pages/Deportistas';
import Evaluaciones from './pages/Evaluaciones';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';

// ✅ NUEVO: Importar componente de edición para entrenador
import EditarDeportistaEntrenador from './pages/Entrenador/EditarDeportista';

// Páginas Deportista
import DashboardDeportista from './pages/DashboardDeportista';
import CalendarioDeportista from './pages/CalendarioDeportista';
import Progreso from './pages/Progreso';
import MisEvaluaciones from './pages/MisEvaluaciones';
import Habilidades from './pages/Habilidades';

// Páginas Admin
import DashboardAdmin from './pages/Admin/DashboardAdmin';
import AdminAdministradores from './pages/Admin/AdminAdministradores';
import AdminEntrenadores from './pages/Admin/AdminEntrenadores';
import AdminDeportistas from './pages/Admin/AdminDeportistas';

// ✅ NUEVO: Importar componente de edición para admin
import EditarDeportistaAdmin from './pages/Admin/EditarDeportista';

function App() {
  return (
    <Router>
      <Routes>
        {/* LANDING PAGE PÚBLICA */}
        <Route path="/" element={<LandingPage />} />
        
        {/* FLUJO DE ACCESO Y REGISTRO */}
        <Route path="/acceso" element={<RoleSelection />} />
        <Route path="/deportista-acceso" element={<DeportistaAcceso />} />
        <Route path="/registro-deportista" element={<RegistroDeportista />} />
        <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
        
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* RUTAS ADMIN */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<DashboardAdmin />} />
          <Route path="administradores" element={<AdminAdministradores />} />
          <Route path="entrenadores" element={<AdminEntrenadores />} />
          <Route path="deportistas" element={<AdminDeportistas />} />
          
          {/* ✅ NUEVO: Ruta para editar deportista como admin */}
          <Route path="deportistas/editar/:id" element={<EditarDeportistaAdmin />} />
          
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
        
        {/* RUTAS ENTRENADOR */}
        <Route path="/entrenador" element={<Layout />}>
          <Route index element={<DashboardEntrenador />} />
          <Route path="deportistas" element={<Deportistas />} />
          
          {/* ✅ NUEVO: Ruta para editar deportista como entrenador */}
          <Route path="deportistas/editar/:id" element={<EditarDeportistaEntrenador />} />
          
          <Route path="evaluaciones" element={<Evaluaciones />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
        
        {/* RUTAS DEPORTISTA */}
        <Route path="/deportista" element={<Layout />}>
          <Route index element={<DashboardDeportista />} />
          <Route path="calendario" element={<CalendarioDeportista />} />
          <Route path="progreso" element={<Progreso />} />
          <Route path="evaluaciones" element={<MisEvaluaciones />} />
          <Route path="habilidades" element={<Habilidades />} />
        </Route>

        {/* RUTAS NO ENCONTRADAS */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
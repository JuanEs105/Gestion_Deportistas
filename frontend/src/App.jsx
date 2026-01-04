// frontend/src/App.js - RUTAS ACTUALIZADAS
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout/Layout';
import DashboardEntrenador from './pages/DashboardEntrenador';
import DashboardDeportista from './pages/DashboardDeportista';
import Deportistas from './pages/Deportistas';
import Evaluaciones from './pages/Evaluaciones';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import DashboardAdmin from './pages/Admin/DashboardAdmin';
import AdminAdministradores from './pages/Admin/AdminAdministradores';
import AdminEntrenadores from './pages/Admin/AdminEntrenadores';
import AdminDeportistas from './pages/Admin/AdminDeportistas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* RUTAS ADMIN */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<DashboardAdmin />} />
          <Route path="administradores" element={<AdminAdministradores />} />
          <Route path="entrenadores" element={<AdminEntrenadores />} />
          <Route path="deportistas" element={<AdminDeportistas />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
        
        {/* RUTAS ENTRENADOR */}
        <Route path="/entrenador" element={<Layout />}>
          <Route index element={<DashboardEntrenador />} />
          <Route path="deportistas" element={<Deportistas />} />
          <Route path="evaluaciones" element={<Evaluaciones />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
        
        {/* RUTAS DEPORTISTA */}
        <Route path="/deportista" element={<Layout />}>
          <Route index element={<DashboardDeportista />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import TerrainsPage from '@/pages/terrains/TerrainsPage';
import LogementsPage from '@/pages/logements/LogementsPage';
import MembresPage from '@/pages/MembresPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/membres" element={<MembresPage />} />
          <Route path="/terrains/*" element={<TerrainsPage />} />
          <Route path="/logements/*" element={<LogementsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

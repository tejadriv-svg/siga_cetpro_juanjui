import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { PadronMaestroView } from './components/padron/PadronMaestroView';
import { EstudiantesView } from './components/estudiantes/EstudiantesView';
import { CalificacionesView } from './components/calificaciones/CalificacionesView';
import { TesoreriaView } from './components/tesoreria/TesoreriaView';
import { CertificadosView } from './components/certificados/CertificadosView';
import { ProgramasView } from './components/programas/ProgramasView';
import { FormacionContinuaView } from './components/formacion/FormacionContinuaView';
import { InventarioBienesView } from './components/inventario/InventarioBienesView';
import { AcervoDocumentarioView } from './components/acervo/AcervoDocumentarioView';
import { ReportesView } from './components/reportes/ReportesView';
import { AuditoriaView } from './components/auditoria/AuditoriaView';
import { ConfiguracionView } from './components/configuracion/ConfiguracionView';
import { EmisionYReportesView } from './components/reportes/EmisionYReportesView';
import { HorariosView } from './components/horarios/HorariosView';
import { DatabaseExplorerView } from './components/explorer/DatabaseExplorerView';
import { ImportadorView } from './components/importador/ImportadorView';
import { LoginView } from './components/auth/LoginView';
import { AsistenciaPersonalView } from './components/personal/AsistenciaPersonalView';
import { EgresadosView } from './components/egresados/EgresadosView';

const MainLayout: React.FC = () => {
  const { activeView, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'importador':
        return <ImportadorView />;
      case 'padron':
        return <PadronMaestroView />;
      case 'estudiantes':
        return <EstudiantesView />;
      case 'calificaciones':
        return <CalificacionesView />;
      case 'tesoreria':
        return <TesoreriaView />;
      case 'certificados':
      case 'documentos':
      case 'reportes':
        return <EmisionYReportesView />;
      case 'egresados':
        return <EgresadosView />;
      case 'horarios':
        return <HorariosView />;
      case 'programas':
        return <ProgramasView />;
      case 'trabajadores':
      case 'asistencia-personal':
        return <AsistenciaPersonalView />;
      case 'formacion-continua':
        return <FormacionContinuaView />;
      case 'inventario':
        return <InventarioBienesView />;
      case 'acervo':
        return <AcervoDocumentarioView />;
      case 'auditoria':
        return <AuditoriaView />;
      case 'explorer':
        return <DatabaseExplorerView />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 w-full space-y-3 custom-scrollbar">
          {renderCurrentView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

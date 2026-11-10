import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { EncyclopediaView } from './components/EncyclopediaView';
import { UnitGenerator } from './components/UnitGenerator';
import { PatientDetail } from './components/PatientDetail';
import { PatientModal } from './components/PatientModal';
import { CustomProtocolModal } from './components/CustomProtocolModal';
import { Toasts } from './components/ui';

function Shell() {
  const { state } = useApp();
  const [nav, setNav] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(state.patients[0]?.id || null);
  const [patientDetailTab, setPatientDetailTab] = useState('overview');

  // Modals
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [preselectedInjuryId, setPreselectedInjuryId] = useState(null);

  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [editingInjury, setEditingInjury] = useState(null);

  // عندما يضاف مريض جديد نفتح ملفه مباشرة
  useEffect(() => {
    if (state._lastAdded) {
      setSelectedPatientId(state._lastAdded);
      setPatientDetailTab('overview');
      setNav('patient-detail');
    }
  }, [state._lastAdded]);

  const openPatientProfile = (id, tab = 'overview') => {
    setSelectedPatientId(id);
    setPatientDetailTab(tab);
    setNav('patient-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddPatient = (injuryId = null) => {
    setEditingPatient(null);
    setPreselectedInjuryId(typeof injuryId === 'string' ? injuryId : null);
    setPatientModalOpen(true);
  };

  const handleOpenEditPatient = (patient) => {
    setEditingPatient(patient);
    setPreselectedInjuryId(null);
    setPatientModalOpen(true);
  };

  const handleOpenCreateInjury = () => {
    setEditingInjury(null);
    setProtocolModalOpen(true);
  };

  const handleOpenEditInjury = (injury) => {
    setEditingInjury(injury);
    setProtocolModalOpen(true);
  };

  const selectedPatient =
    state.patients.find((p) => p.id === selectedPatientId) || state.patients[0] || null;

  return (
    <>
      <Layout
        activeNav={nav}
        onNavigate={(view) => {
          setNav(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAddPatient={() => handleOpenAddPatient(null)}
        onCreateCustomInjury={handleOpenCreateInjury}
        onSelectPatient={(id) => openPatientProfile(id, 'overview')}
        selectedPatientId={selectedPatient?.id}
      >
        {nav === 'dashboard' && (
          <DashboardView
            onSelectPatient={(id) => openPatientProfile(id, 'overview')}
            onStartSession={(id) => openPatientProfile(id, 'generator')}
            onAddPatient={() => handleOpenAddPatient(null)}
            onNavigate={setNav}
            onCreateCustomInjury={handleOpenCreateInjury}
          />
        )}

        {nav === 'patients' && (
          <PatientsView
            onSelectPatient={(id) => openPatientProfile(id, 'overview')}
            onStartSession={(id) => openPatientProfile(id, 'generator')}
            onAddPatient={() => handleOpenAddPatient(null)}
          />
        )}

        {nav === 'encyclopedia' && (
          <EncyclopediaView
            onAssignToNewPatient={(injuryId) => handleOpenAddPatient(injuryId)}
            onEditInjury={handleOpenEditInjury}
            onCreateCustomInjury={handleOpenCreateInjury}
          />
        )}

        {nav === 'generator' && (
          <UnitGenerator
            onOpenPatient={(id) => openPatientProfile(id, 'overview')}
          />
        )}

        {nav === 'patient-detail' && selectedPatient && (
          <PatientDetail
            key={`${selectedPatient.id}_${patientDetailTab}`}
            patient={selectedPatient}
            initialTab={patientDetailTab}
            onBack={() => setNav('patients')}
            onEditPatient={handleOpenEditPatient}
            onEditProtocol={handleOpenEditInjury}
          />
        )}
      </Layout>

      <PatientModal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        initialPatient={editingPatient}
        preselectedInjuryId={preselectedInjuryId}
      />

      <CustomProtocolModal
        open={protocolModalOpen}
        onClose={() => setProtocolModalOpen(false)}
        initialInjury={editingInjury}
      />

      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

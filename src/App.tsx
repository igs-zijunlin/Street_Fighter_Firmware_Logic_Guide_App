
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';
import Initialization from './pages/Initialization';
import GateControl from './pages/GateControl';
import PositioningFlow from './pages/PositioningFlow';
import CardDispenserFlow from './pages/CardDispenserFlow';



function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="initialization" element={<Initialization />} />
          <Route path="gate-control" element={<GateControl />} />
          <Route path="positioning" element={<PositioningFlow />} />
          <Route path="card-dispenser" element={<CardDispenserFlow />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

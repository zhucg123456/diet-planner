import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Merchants from './pages/Merchants';
import Import from './pages/Import';
import History from './pages/History';
import Calories from './pages/Calories';
import Settings from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/import" element={<Import />} />
          <Route path="/history" element={<History />} />
          <Route path="/calories" element={<Calories />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

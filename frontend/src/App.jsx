import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import JobsDashboard from './components/JobsDashboard.jsx';
import JobPipeline from './components/JobPipeline.jsx';
import CandidateProfile from './components/CandidateProfile.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <Routes>
        <Route path="/" element={<JobsDashboard />} />
        <Route path="/jobs/:id" element={<JobPipeline />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
      </Routes>
    </div>
  );
}

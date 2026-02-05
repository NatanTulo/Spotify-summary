import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './hooks/useProfile';

// Lazy load design modules
import { lazy, Suspense } from 'react';

const VinylApp = lazy(() => import('./designs/vinyl/VinylApp'));
const NeonApp = lazy(() => import('./designs/neon/NeonApp'));
const AuroraApp = lazy(() => import('./designs/aurora/AuroraApp'));
const BrutalApp = lazy(() => import('./designs/brutalism/BrutalApp'));
const CosmosApp = lazy(() => import('./designs/cosmos/CosmosApp'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl animate-pulse">Loading...</div>
    </div>
  );
}

function App() {
  return (
    <ProfileProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Redirect root to first design */}
          <Route path="/" element={<Navigate to="/1" replace />} />
          
          {/* 5 Unique Designs */}
          <Route path="/1/*" element={<VinylApp />} />
          <Route path="/2/*" element={<NeonApp />} />
          <Route path="/3/*" element={<AuroraApp />} />
          <Route path="/4/*" element={<BrutalApp />} />
          <Route path="/5/*" element={<CosmosApp />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/1" replace />} />
        </Routes>
      </Suspense>
    </ProfileProvider>
  );
}

export default App;

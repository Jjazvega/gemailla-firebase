import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('./pages/GemaillaDashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const ERP = lazy(() => import('./pages/ERP'));
const Audit = lazy(() => import('./pages/Audit'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Companies = lazy(() => import('./pages/Companies'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const PredictiveAnalysis = lazy(() => import('./pages/PredictiveAnalysis'));
const FinancialHub = lazy(() => import('./pages/FinancialHub'));
const ClientPanel = lazy(() => import('./pages/ClientPanel'));
const Operations = lazy(() => import('./pages/Operations'));
const CRM = lazy(() => import('./pages/CRM'));
const HumanResources = lazy(() => import('./pages/HumanResources'));

import { SubscriptionProvider } from '@/lib/subscriptionContext';

// Loading component for Suspense fallback
const RouteLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Cargando página...</span>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando GEMAILLA AI...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <SubscriptionProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<RouteLoadingFallback />}><Dashboard /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<RouteLoadingFallback />}><Dashboard /></Suspense>} />
          <Route path="/documents" element={<Suspense fallback={<RouteLoadingFallback />}><Documents /></Suspense>} />
          <Route path="/erp" element={<Suspense fallback={<RouteLoadingFallback />}><ERP /></Suspense>} />
          <Route path="/audit" element={<Suspense fallback={<RouteLoadingFallback />}><Audit /></Suspense>} />
          <Route path="/ai" element={<Suspense fallback={<RouteLoadingFallback />}><AIAssistant /></Suspense>} />
          <Route path="/companies" element={<Suspense fallback={<RouteLoadingFallback />}><Companies /></Suspense>} />
          <Route path="/activity" element={<Suspense fallback={<RouteLoadingFallback />}><ActivityLog /></Suspense>} />
          <Route path="/subscriptions" element={<Suspense fallback={<RouteLoadingFallback />}><Subscriptions /></Suspense>} />
          <Route path="/predictive" element={<Suspense fallback={<RouteLoadingFallback />}><PredictiveAnalysis /></Suspense>} />
          <Route path="/finance" element={<Suspense fallback={<RouteLoadingFallback />}><FinancialHub /></Suspense>} />
          <Route path="/client" element={<Suspense fallback={<RouteLoadingFallback />}><ClientPanel /></Suspense>} />
          <Route path="/operations" element={<Suspense fallback={<RouteLoadingFallback />}><Operations /></Suspense>} />
          <Route path="/crm" element={<Suspense fallback={<RouteLoadingFallback />}><CRM /></Suspense>} />
          <Route path="/hr" element={<Suspense fallback={<RouteLoadingFallback />}><HumanResources /></Suspense>} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </SubscriptionProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

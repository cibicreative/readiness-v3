import { useEffect, useState } from 'react';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import ClientSharedView from './components/ClientSharedView';
import Sidebar from './components/Sidebar';
import { PublicLayout } from './components/literacy-check/PublicLayout';
import { LiteracyCheckIntro } from './components/literacy-check/LiteracyCheckIntro';
import { LiteracyCheckQuestions } from './components/literacy-check/LiteracyCheckQuestions';
import { LiteracyCheckResults } from './components/literacy-check/LiteracyCheckResults';
import { TokenGuardWrapper } from './components/guards/TokenGuardWrapper';
import ExecutiveCockpit from './components/ExecutiveCockpit';
import InvestmentMemo from './components/InvestmentMemo';
import InvestmentGates from './components/InvestmentGates';
import ProcessRoadmap from './components/ProcessRoadmap';
import KnowledgeDocumentPage from './pages/KnowledgeDocumentPage';

type Route =
  | { page: 'clients' }
  | { page: 'client-detail'; clientId: string }
  | { page: 'client-share'; token: string }
  | { page: 'literacy-check-intro'; token: string }
  | { page: 'literacy-check-questions'; token: string }
  | { page: 'literacy-check-results'; token: string }
  | { page: 'executive-cockpit'; clientId: string }
  | { page: 'investment-memo'; clientId: string; processId: string }
  | { page: 'investment-gates'; clientId: string }
  | { page: 'process-roadmap'; clientId: string; processId: string }
  | { page: 'knowledge-document'; clientId: string; documentId: string };

function parseRoute(): Route {
  const hash = window.location.hash.slice(1);

  if (hash.startsWith('/client-share/')) {
    const token = hash.replace('/client-share/', '');
    return { page: 'client-share', token };
  }

  const literacyCheckMatch = hash.match(/^\/c\/([^/]+)\/literacy-check(?:\/(.*))?$/);
  if (literacyCheckMatch) {
    const token = literacyCheckMatch[1];
    const subPath = literacyCheckMatch[2];

    if (subPath === 'questions') {
      return { page: 'literacy-check-questions', token };
    }
    if (subPath === 'results') {
      return { page: 'literacy-check-results', token };
    }
    return { page: 'literacy-check-intro', token };
  }

  const executiveMemoMatch = hash.match(/^\/client\/([^/]+)\/executive\/memo\/([^/]+)$/);
  if (executiveMemoMatch) {
    return { page: 'investment-memo', clientId: executiveMemoMatch[1], processId: executiveMemoMatch[2] };
  }

  const executiveRoadmapMatch = hash.match(/^\/client\/([^/]+)\/executive\/roadmap\/([^/]+)$/);
  if (executiveRoadmapMatch) {
    return { page: 'process-roadmap', clientId: executiveRoadmapMatch[1], processId: executiveRoadmapMatch[2] };
  }

  const executiveGatesMatch = hash.match(/^\/client\/([^/]+)\/executive\/gates$/);
  if (executiveGatesMatch) {
    return { page: 'investment-gates', clientId: executiveGatesMatch[1] };
  }

  const executiveCockpitMatch = hash.match(/^\/client\/([^/]+)\/executive$/);
  if (executiveCockpitMatch) {
    return { page: 'executive-cockpit', clientId: executiveCockpitMatch[1] };
  }

  const knowledgeDocumentMatch = hash.match(/^\/client\/([^/]+)\/knowledge\/([^/]+)$/);
  if (knowledgeDocumentMatch) {
    return { page: 'knowledge-document', clientId: knowledgeDocumentMatch[1], documentId: knowledgeDocumentMatch[2] };
  }

  if (hash.startsWith('/client/')) {
    const clientId = hash.replace('/client/', '');
    return { page: 'client-detail', clientId };
  }

  return { page: 'clients' };
}

function App() {
  const [route, setRoute] = useState<Route>(parseRoute());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.page === 'client-share') {
    return <ClientSharedView token={route.token} />;
  }

  if (
    route.page === 'literacy-check-intro' ||
    route.page === 'literacy-check-questions' ||
    route.page === 'literacy-check-results'
  ) {
    return (
      <TokenGuardWrapper token={route.token}>
        <PublicLayout>
          {route.page === 'literacy-check-intro' && <LiteracyCheckIntro />}
          {route.page === 'literacy-check-questions' && <LiteracyCheckQuestions />}
          {route.page === 'literacy-check-results' && <LiteracyCheckResults />}
        </PublicLayout>
      </TokenGuardWrapper>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {route.page === 'clients' && <ClientList />}
        {route.page === 'client-detail' && <ClientDetail clientId={route.clientId} />}
        {route.page === 'executive-cockpit' && <ExecutiveCockpit clientId={route.clientId} />}
        {route.page === 'investment-memo' && <InvestmentMemo clientId={route.clientId} processId={route.processId} />}
        {route.page === 'investment-gates' && <InvestmentGates clientId={route.clientId} />}
        {route.page === 'process-roadmap' && (
          <ProcessRoadmap
            clientId={route.clientId}
            processId={route.processId}
            onBack={() => window.location.hash = `#/client/${route.clientId}/executive`}
          />
        )}
        {route.page === 'knowledge-document' && (
          <KnowledgeDocumentPage
            clientId={route.clientId}
            documentId={route.documentId}
            onBack={() => window.location.hash = `#/client/${route.clientId}`}
          />
        )}
      </main>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { SubmissionReview } from './components/SubmissionReview';
import { ConfigBuilder } from './components/ConfigBuilder';
import { Project, Submission, EvaluationConfig } from './types';
import { MOCK_PROJECTS, MOCK_SUBMISSIONS, DEFAULT_CONFIG } from './services/mockDb';

// Simple hash-based router
type Route = 
  | { name: 'dashboard' }
  | { name: 'project'; id: string }
  | { name: 'submission'; id: string }
  | { name: 'config' };

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(MOCK_SUBMISSIONS);
  const [activeConfig, setActiveConfig] = useState<EvaluationConfig>(DEFAULT_CONFIG);

  const navigate = (newRoute: Route) => {
    window.scrollTo(0, 0);
    setRoute(newRoute);
  };

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name,
      managerId: 'u1',
      configId: activeConfig.id,
      status: 'ACTIVE',
      lastActivity: 'Just now',
      editorIds: [],
      submissionIds: []
    };
    setProjects([newProject, ...projects]);
  };

  const handleUpdateProjectSubmissions = (projectId: string, newSubmission: Submission) => {
    // Save submission to global state
    setSubmissions(prev => ({ ...prev, [newSubmission.id]: newSubmission }));
    
    // Update project reference
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          lastActivity: 'Just now',
          submissionIds: [newSubmission.id, ...p.submissionIds]
        };
      }
      return p;
    }));
  };

  const handleUpdateSubmissionStatus = (submissionId: string, status: any, comments?: any[]) => {
    setSubmissions(prev => {
        const sub = prev[submissionId];
        if (!sub) return prev;
        return {
            ...prev,
            [submissionId]: {
                ...sub,
                status,
                comments: comments || sub.comments
            }
        };
    });
  };

  const renderContent = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard projects={projects} navigate={navigate} onCreateProject={handleCreateProject} />;
      case 'project':
        const project = projects.find(p => p.id === route.id);
        return project ? (
          <ProjectDetail 
            project={project} 
            navigate={navigate} 
            onSubmissionCreated={handleUpdateProjectSubmissions}
            submissionsMap={submissions}
          />
        ) : (
          <div className="text-center py-12 text-slate-500">Project not found</div>
        );
      case 'submission':
        const sub = submissions[route.id];
        return sub ? (
             <SubmissionReview 
                submission={sub} 
                navigate={navigate} 
                onUpdateStatus={handleUpdateSubmissionStatus}
            /> 
        ) : ( 
            <div className="text-center py-12 text-slate-500">Submission not found</div>
        );
      case 'config':
        return <ConfigBuilder navigate={navigate} currentConfig={activeConfig} onSave={setActiveConfig} />;
      default:
        return <Dashboard projects={projects} navigate={navigate} onCreateProject={handleCreateProject} />;
    }
  };

  return (
    <Layout currentRoute={route.name} navigate={navigate}>
      {renderContent()}
    </Layout>
  );
};

export default App;
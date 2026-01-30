import React, { useState } from 'react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  navigate: (route: any) => void;
  onCreateProject: (name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, navigate, onCreateProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName);
      setNewProjectName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-300 rounded-lg">
           <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
           </svg>
           <h3 className="mt-2 text-sm font-medium text-slate-900">No projects yet</h3>
           <p className="mt-1 text-sm text-slate-500">Get started by creating a new brand compliance project.</p>
           <div className="mt-6">
             <button
               onClick={() => setIsModalOpen(true)}
               className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Create Project
             </button>
           </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-slate-200">
            {projects.map((project) => (
              <li key={project.id}>
                <div 
                  className="block hover:bg-slate-50 cursor-pointer transition duration-150 ease-in-out"
                  onClick={() => navigate({ name: 'project', id: project.id })}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">{project.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-slate-500">
                          {project.submissionIds.length} Submissions
                        </p>
                        <p className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 sm:ml-6">
                           ID: {project.id}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                        <p>Last activity {project.lastActivity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Project Name (e.g., Summer Campaign)"
                className="w-full border-slate-300 border rounded-md p-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { CURRENT_USER } from '../services/mockDb';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (route: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentRoute, navigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate({ name: 'dashboard' })}>
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="font-bold text-xl text-slate-800">BrandGuard</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => navigate({ name: 'dashboard' })}
                  className={`${currentRoute === 'dashboard' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full`}
                >
                  Dashboard
                </button>
                <button
                   onClick={() => navigate({ name: 'config' })}
                   className={`${currentRoute === 'config' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full`}
                >
                  Configs
                </button>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                   <img className="h-8 w-8 rounded-full" src={CURRENT_USER.avatarUrl} alt="" />
                   <span className="ml-2 text-sm font-medium text-slate-700">{CURRENT_USER.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
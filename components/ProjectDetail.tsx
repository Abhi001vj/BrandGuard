import React, { useState } from 'react';
import { Project, Submission } from '../types';
import { DEFAULT_CONFIG } from '../services/mockDb';
import { analyzeSubmission } from '../services/gemini';

interface ProjectDetailProps {
  project: Project;
  navigate: (route: any) => void;
  onSubmissionCreated: (projectId: string, submission: Submission) => void;
  submissionsMap: Record<string, Submission>;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, navigate, onSubmissionCreated, submissionsMap }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'image_url' | 'youtube'>('upload');
  const [inputUrl, setInputUrl] = useState('');

  // Derived state from global map
  const projectSubmissions = project.submissionIds
    .map(id => submissionsMap[id])
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await createSubmission(file, file.type.startsWith('video') ? 'VIDEO' : 'IMAGE', URL.createObjectURL(file));
    }
  };

  const handleUrlSubmit = async () => {
    if (!inputUrl) return;
    
    // Simple heuristic to distinguish image from generic/YouTube URL
    const isYoutube = inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be');
    const type = activeTab === 'image_url' ? 'IMAGE_URL' : (isYoutube ? 'URL' : 'URL');
    
    // For IMAGE_URL, we still use 'IMAGE' as the sourceType in the data model, 
    // but the analysis function needs to know it's a URL to fetch.
    const sourceType = activeTab === 'image_url' ? 'IMAGE' : 'URL';

    await createSubmission(inputUrl, sourceType, inputUrl, activeTab === 'image_url');
    setInputUrl('');
  };

  const createSubmission = async (
      content: File | string, 
      sourceType: 'IMAGE' | 'VIDEO' | 'URL', 
      displayUrl: string,
      isImageUrl: boolean = false
  ) => {
    setIsProcessing(true);
    
    const newSubmission: Submission = {
      id: `s-${Date.now()}`,
      projectId: project.id,
      editorId: 'u1', 
      version: projectSubmissions.length + 1,
      sourceType: sourceType,
      sourceUrl: displayUrl,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      comments: []
    };

    onSubmissionCreated(project.id, newSubmission);

    try {
      // Pass 'IMAGE_URL' to analyzeSubmission if it's an image link so it knows to fetch bytes
      const analysisType = isImageUrl ? 'IMAGE_URL' : (sourceType as any);
      
      const report = await analyzeSubmission(content, DEFAULT_CONFIG.json, analysisType);
      
      const updatedSubmission = {
        ...newSubmission,
        status: report.overall.decision === 'pass' ? 'APPROVED' : 'CHANGES_REQUESTED',
        report
      };
      
      onSubmissionCreated(project.id, updatedSubmission as Submission);
    } catch (err: any) {
      console.error("Analysis Error", err);
      const failedSubmission = {
        ...newSubmission,
        status: 'REJECTED',
        comments: [{
            id: `err-${Date.now()}`, 
            authorId: 'system', 
            body: `Analysis failed: ${err.message || 'Unknown error'}`, 
            createdAt: new Date().toISOString()
        }]
      };
      onSubmissionCreated(project.id, failedSubmission as Submission);
      alert(`Analysis failed: ${err.message || 'Check inputs and try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button onClick={() => navigate({ name: 'dashboard' })} className="text-slate-400 hover:text-slate-500">
                Projects
              </button>
            </li>
            <li className="flex items-center">
               <svg className="flex-shrink-0 h-5 w-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-sm font-medium text-slate-500">{project.name}</span>
            </li>
          </ol>
        </nav>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">{project.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage submissions and compliance reports.</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('upload')}
              className={`${activeTab === 'upload' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('image_url')}
              className={`${activeTab === 'image_url' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Image URL
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`${activeTab === 'youtube' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              YouTube URL
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'upload' ? (
             <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">MP4, PNG, JPG (MAX. 20MB)</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" disabled={isProcessing} />
                </label>
             </div>
          ) : (
            <div className="flex gap-4">
               <input 
                 type="text" 
                 value={inputUrl}
                 onChange={(e) => setInputUrl(e.target.value)}
                 placeholder={activeTab === 'image_url' ? "https://example.com/image.jpg" : "https://youtube.com/watch?v=..."}
                 className="flex-1 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border p-2"
                 disabled={isProcessing}
               />
               <button 
                 onClick={handleUrlSubmit}
                 disabled={!inputUrl || isProcessing}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
               >
                 Analyze
               </button>
            </div>
          )}
          {isProcessing && <p className="text-sm text-indigo-600 mt-2 font-medium animate-pulse">AI is analyzing content... This may take a moment.</p>}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
         <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Submission History</h3>
         </div>
         <ul className="divide-y divide-slate-200">
            {projectSubmissions.map(sub => (
                 <li key={sub.id} className="hover:bg-slate-50">
                   <div 
                    className="block cursor-pointer"
                    onClick={() => navigate({ name: 'submission', id: sub.id })}
                   >
                     <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center">
                              <span className="text-sm font-medium text-indigo-600 truncate">Version {sub.version}</span>
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                                {sub.sourceType}
                              </span>
                           </div>
                           <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${sub.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                  sub.status === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-800' : 
                                  sub.status === 'REJECTED' ? 'bg-red-800 text-white' : 
                                  sub.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-blue-100 text-blue-800'}`}>
                                {sub.status.replace('_', ' ')}
                              </span>
                           </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                           <div className="sm:flex">
                              <p className="flex items-center text-sm text-slate-500">
                                {sub.report ? `Score: ${sub.report.overall.score}/100` : sub.status === 'PROCESSING' ? 'Analyzing...' : 'No report'}
                              </p>
                           </div>
                           <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                              <p>Submitted on {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString()}</p>
                           </div>
                        </div>
                     </div>
                   </div>
                 </li>
            ))}
            {projectSubmissions.length === 0 && (
                <li className="px-4 py-12 text-center text-slate-500">No submissions yet. Upload a file or URL to start analysis.</li>
            )}
         </ul>
      </div>
    </div>
  );
};
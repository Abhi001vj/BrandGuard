import React, { useState, useRef } from 'react';
import { jsPDF } from "jspdf";
import { Submission, Issue, Comment } from '../types';
import { CURRENT_USER } from '../services/mockDb';

interface SubmissionReviewProps {
  submission: Submission;
  navigate: (route: any) => void;
  onUpdateStatus: (id: string, status: any, comments: any[]) => void;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({ submission, navigate, onUpdateStatus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubmission, setEditedSubmission] = useState<Submission>(submission);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync edits if submission prop changes externally
  React.useEffect(() => {
    setEditedSubmission(submission);
  }, [submission]);

  const handleApprove = () => onUpdateStatus(submission.id, 'APPROVED', submission.comments);
  const handleReturn = () => onUpdateStatus(submission.id, 'CHANGES_REQUESTED', submission.comments);

  const postComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorId: CURRENT_USER.id,
      body: commentText,
      createdAt: new Date().toISOString()
    };
    onUpdateStatus(submission.id, submission.status, [...submission.comments, newComment]);
    setCommentText('');
  };

  const toggleEdit = () => {
      if (isEditing) {
          alert("Report changes saved locally for this session.");
      }
      setIsEditing(!isEditing);
  };

  const updateIssue = (index: number, field: keyof Issue, value: string) => {
      if (!editedSubmission.report) return;
      const newIssues = [...editedSubmission.report.issues];
      newIssues[index] = { ...newIssues[index], [field]: value };
      setEditedSubmission({
          ...editedSubmission,
          report: { ...editedSubmission.report, issues: newIssues }
      });
  };

  const updateSummary = (value: string) => {
      if (!editedSubmission.report) return;
      setEditedSubmission({
          ...editedSubmission,
          report: { 
              ...editedSubmission.report, 
              overall: { ...editedSubmission.report.overall, summary: value } 
            }
      });
  };

  const formatTime = (ms?: number) => {
    if (ms === undefined) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
      try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
          });
      } catch (e) {
          console.error("Failed to load image for PDF", e);
          return null;
      }
  };

  const captureVideoFrame = async (timeInSeconds: number): Promise<string | null> => {
    const video = videoRef.current;
    if (!video) return null;

    return new Promise((resolve) => {
        const onSeeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    video.removeEventListener('seeked', onSeeked);
                    resolve(dataUrl);
                } else {
                    resolve(null);
                }
            } catch (e) {
                console.error("Frame capture failed (likely CORS)", e);
                resolve(null);
            }
        };

        video.addEventListener('seeked', onSeeked);
        video.currentTime = timeInSeconds;
    });
  };

  const downloadPDF = async () => {
    setIsGeneratingPdf(true);
    const currentData = editedSubmission;
    
    // Save video state
    const wasPlaying = videoRef.current && !videoRef.current.paused;
    const originalTime = videoRef.current ? videoRef.current.currentTime : 0;
    if (videoRef.current) videoRef.current.pause();

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = 20;

        // --- 1. Title Page ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text("BrandGuard Compliance Report", 20, y);
        y += 15;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Submission ID: ${currentData.id}`, 20, y);
        doc.text(`Version: ${currentData.version}`, 120, y);
        y += 8;
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
        doc.text(`Status: ${currentData.status}`, 120, y);
        y += 20;

        // Overall Score Box
        doc.setFillColor(243, 244, 246);
        doc.rect(20, y, pageWidth - 40, 30, "F");
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text("Overall Score", 30, y + 12);
        
        const score = currentData.report?.overall.score || 0;
        doc.setFontSize(22);
        doc.setTextColor(score > 80 ? 22 : 220, score > 80 ? 163 : 38, score > 80 ? 74 : 38);
        doc.text(`${score}/100`, 30, y + 24);
        
        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.text(`Decision: ${currentData.report?.overall.decision.toUpperCase()}`, 100, y + 20);
        y += 45;

        // Summary Text
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Executive Summary", 20, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(currentData.report?.overall.summary || "No summary.", pageWidth - 40);
        doc.text(summaryLines, 20, y);
        y += (summaryLines.length * 5) + 15;

        // --- 2. Issues Summary Table ---
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Violations Summary", 20, y);
        y += 10;
        
        doc.setFillColor(229, 231, 235);
        doc.rect(20, y, pageWidth - 40, 10, "F");
        doc.setFontSize(10);
        doc.text("SEVERITY", 25, y + 7);
        doc.text("CATEGORY", 60, y + 7);
        doc.text("ISSUE", 100, y + 7);
        y += 10;

        currentData.report?.issues.forEach((issue) => {
            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");
            doc.text(issue.severity.toUpperCase(), 25, y + 7);
            doc.text(issue.category, 60, y + 7);
            const title = issue.title.length > 40 ? issue.title.substring(0, 37) + '...' : issue.title;
            doc.text(title, 100, y + 7);
            
            doc.setDrawColor(229, 231, 235);
            doc.line(20, y + 10, pageWidth - 20, y + 10);
            y += 10;
        });

        // --- 3. Detailed Issue Pages ---
        let mainImageBase64: string | null = null;
        // Pre-fetch main image if it's an image submission
        if (currentData.sourceType === 'IMAGE') {
            mainImageBase64 = await getBase64ImageFromUrl(currentData.sourceUrl);
        }

        if (currentData.report?.issues.length) {
            for (const issue of currentData.report.issues) {
                doc.addPage();
                y = 20;

                // Header
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.setTextColor(79, 70, 229);
                doc.text(`Issue: ${issue.title}`, 20, y);
                y += 10;

                // Metadata
                doc.setFontSize(10);
                doc.setTextColor(100);
                let metaText = `Severity: ${issue.severity.toUpperCase()} | Category: ${issue.category}`;
                if (issue.evidence?.timestamp_range) {
                    metaText += ` | Time: ${formatTime(issue.evidence.timestamp_range.start_ms)}`;
                }
                doc.text(metaText, 20, y);
                y += 15;

                // Description
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.setFontSize(11);
                const descLines = doc.splitTextToSize(issue.description, pageWidth - 40);
                doc.text(descLines, 20, y);
                y += (descLines.length * 5) + 10;

                // Recommendation
                if (issue.recommendation) {
                    doc.setFont("helvetica", "italic");
                    doc.setTextColor(22, 163, 74);
                    const recLines = doc.splitTextToSize(`Recommendation: ${issue.recommendation.action}`, pageWidth - 40);
                    doc.text(recLines, 20, y);
                    y += (recLines.length * 5) + 10;
                }

                // EVIDENCE VISUALIZATION
                let evidenceImage: string | null = mainImageBase64;

                // If Video, extract frame
                if (currentData.sourceType === 'VIDEO' && issue.evidence?.timestamp_range) {
                   const startSec = issue.evidence.timestamp_range.start_ms / 1000;
                   evidenceImage = await captureVideoFrame(startSec);
                }

                if (evidenceImage && issue.evidence?.coordinates) {
                    const imgW = 120;
                    const imgH = 80;
                    
                    // Center image roughly
                    doc.addImage(evidenceImage, 'JPEG', 20, y, imgW, imgH);

                    // Draw Annotations
                    const { x, y: boxY, w, h } = issue.evidence.coordinates;
                    const pdfBoxX = 20 + (x * imgW);
                    const pdfBoxY = y + (boxY * imgH);
                    const pdfBoxW = w * imgW;
                    const pdfBoxH = h * imgH;

                    doc.setDrawColor(220, 38, 38); // Red
                    doc.setLineWidth(1);
                    doc.rect(pdfBoxX, pdfBoxY, pdfBoxW, pdfBoxH);
                    
                    // Label
                    doc.setFillColor(220, 38, 38);
                    doc.rect(pdfBoxX, pdfBoxY - 4, 30, 4, "F");
                    doc.setTextColor(255);
                    doc.setFontSize(6);
                    doc.text("VIOLATION", pdfBoxX + 1, pdfBoxY - 1);
                } else if (currentData.sourceType === 'URL') {
                    doc.setFont("helvetica", "italic");
                    doc.setTextColor(150);
                    if (getYoutubeId(currentData.sourceUrl)) {
                         doc.text("(Screenshots unavailable for YouTube videos. Please refer to timestamp.)", 20, y + 10);
                    } else {
                         doc.text("(Visual evidence not available for external URLs)", 20, y + 10);
                    }
                }
            }
        }
        
        doc.save(`BrandGuard-Report-${currentData.id}.pdf`);

    } catch (e) {
        console.error("PDF Gen Error", e);
        alert("Failed to generate PDF. See console for details.");
    } finally {
        // Restore video state
        if (videoRef.current) {
            videoRef.current.currentTime = originalTime;
            if (wasPlaying) videoRef.current.play();
        }
        setIsGeneratingPdf(false);
    }
  };

  const downloadWord = async () => {
    const currentData = editedSubmission;
    
    // Simple Word export doesn't handle complex video frame extraction in this demo
    // We will include the main image if available.
    let imgTag = '';
    if (currentData.sourceType === 'IMAGE') {
        const b64 = await getBase64ImageFromUrl(currentData.sourceUrl);
        if (b64) {
            imgTag = `<br><img src="${b64}" width="400" /><br>`;
        }
    }

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>BrandGuard Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; }
          .header { color: #4F46E5; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .score-box { background-color: #f3f4f6; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
          .issue { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">BrandGuard Compliance Report</div>
        <p>Submission ID: ${currentData.id} | Status: ${currentData.status}</p>
        
        ${imgTag}

        <div class="score-box">
          <p><strong>Overall Score:</strong> ${currentData.report?.overall.score}/100</p>
          <p>${currentData.report?.overall.summary}</p>
        </div>

        <h2>Detailed Findings</h2>
        ${currentData.report?.issues.map(issue => `
          <div class="issue">
            <h3>[${issue.severity}] ${issue.title}</h3>
            <p><strong>Category:</strong> ${issue.category} ${issue.evidence?.timestamp_range ? `| <strong>Time:</strong> ${formatTime(issue.evidence.timestamp_range.start_ms)}` : ''}</p>
            <p>${issue.description}</p>
            <p><em>Recommendation: ${issue.recommendation?.action}</em></p>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BrandGuard-Report-${currentData.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ytId = submission.sourceType === 'URL' ? getYoutubeId(submission.sourceUrl) : null;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-4">
        <div>
           <button onClick={() => navigate({ name: 'project', id: submission.projectId })} className="text-sm text-slate-500 hover:text-slate-700 mb-1">
             &larr; Back to Project
           </button>
           <h1 className="text-2xl font-bold text-slate-900">Review Version {submission.version}</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={toggleEdit} 
            className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm border ${isEditing ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
          >
            {isEditing ? 'Save Edits' : 'Edit Report'}
          </button>
          
          <div className="flex rounded-md shadow-sm">
             <button 
                onClick={downloadPDF} 
                disabled={isGeneratingPdf}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-l-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-wait"
             >
               {isGeneratingPdf ? 'Generating...' : 'PDF'}
             </button>
             <button onClick={downloadWord} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border-t border-b border-r border-slate-300 rounded-r-md hover:bg-slate-50">
               DOCX
             </button>
          </div>

          <div className="w-px h-8 bg-slate-300 mx-2 self-center"></div>
          <button onClick={handleReturn} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
            Return
          </button>
          <button onClick={handleApprove} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Approve
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* Left: Media Viewer */}
        <div className="flex-1 bg-black rounded-lg flex items-center justify-center relative overflow-hidden group">
           {submission.sourceType === 'VIDEO' || (submission.sourceType === 'URL' && !submission.sourceUrl.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
             submission.sourceType === 'URL' ? (
                 ytId ? (
                    <div className="w-full h-full">
                       <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube.com/embed/${ytId}`} 
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                       ></iframe>
                    </div>
                 ) : (
                    <div className="text-white text-center p-8">
                        <p className="mb-4 text-lg">External Link Analysis</p>
                        <a href={submission.sourceUrl} target="_blank" className="text-indigo-400 underline mb-4 block">{submission.sourceUrl}</a>
                        <p className="text-xs text-gray-400">Preview not available for this URL type.</p>
                    </div>
                 )
             ) : (
                // Direct Video File (Blob)
                <video 
                    ref={videoRef}
                    src={submission.sourceUrl} 
                    controls 
                    className="max-h-full max-w-full" 
                />
             )
           ) : (
             <div className="relative max-h-full max-w-full">
                <img src={submission.sourceUrl} alt="Submission" className="max-h-full max-w-full object-contain" />
                {editedSubmission.report?.issues.map(issue => {
                  if (issue.evidence?.coordinates) {
                    const { x, y, w, h } = issue.evidence.coordinates;
                    const isSelected = selectedIssue?.issue_id === issue.issue_id;
                    return (
                      <div
                        key={issue.issue_id}
                        className={`absolute border-2 transition-all cursor-pointer ${isSelected ? 'border-yellow-400 bg-yellow-400/20 z-10' : 'border-red-500 hover:border-red-300'}`}
                        style={{
                          left: `${x * 100}%`,
                          top: `${y * 100}%`,
                          width: `${w * 100}%`,
                          height: `${h * 100}%`
                        }}
                        onClick={() => setSelectedIssue(issue)}
                      />
                    );
                  }
                  return null;
                })}
             </div>
           )}
        </div>

        {/* Right: Report & Issues */}
        <div className="w-96 flex flex-col bg-white border-l border-slate-200">
           {/* Score Header */}
           <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-medium text-slate-500">Overall Score</span>
                 <span className={`text-2xl font-bold ${
                   (editedSubmission.report?.overall.score || 0) > 80 ? 'text-green-600' : 'text-amber-600'
                 }`}>
                   {editedSubmission.report?.overall.score || 0}
                 </span>
              </div>
              
              {isEditing ? (
                  <textarea 
                    className="w-full text-xs text-slate-600 border rounded p-1"
                    rows={3}
                    value={editedSubmission.report?.overall.summary || ''}
                    onChange={(e) => updateSummary(e.target.value)}
                  />
              ) : (
                  <p className="text-xs text-slate-600">{editedSubmission.report?.overall.summary || "Pending Analysis..."}</p>
              )}
           </div>

           {/* Tabs / Lists */}
           <div className="flex-1 overflow-y-auto p-4">
             <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Issues</h3>
             <div className="space-y-3">
               {editedSubmission.report?.issues.length === 0 && <p className="text-sm text-slate-400 italic">No issues detected.</p>}
               {editedSubmission.report?.issues.map((issue, idx) => (
                 <div 
                   key={issue.issue_id} 
                   className={`p-3 rounded-md border text-left cursor-pointer transition ${
                     selectedIssue?.issue_id === issue.issue_id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                   }`}
                   onClick={() => {
                       setSelectedIssue(issue);
                       // Seek video if applicable
                       if (videoRef.current && issue.evidence?.timestamp_range) {
                           videoRef.current.currentTime = issue.evidence.timestamp_range.start_ms / 1000;
                           videoRef.current.pause(); // Auto-pause to show the frame
                       }
                   }}
                 >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                        ${issue.severity === 'blocker' ? 'bg-red-100 text-red-800' : 
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {issue.severity}
                      </span>
                      {issue.evidence?.timestamp_range && (
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded">
                              {formatTime(issue.evidence.timestamp_range.start_ms)}
                          </span>
                      )}
                    </div>
                    
                    {isEditing ? (
                        <div className="mt-2 space-y-2">
                            <input 
                                className="w-full text-sm font-medium text-slate-900 border rounded px-1"
                                value={issue.title}
                                onChange={(e) => updateIssue(idx, 'title', e.target.value)}
                            />
                            <textarea 
                                className="w-full text-xs text-slate-600 border rounded px-1"
                                rows={2}
                                value={issue.description}
                                onChange={(e) => updateIssue(idx, 'description', e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <h4 className="text-sm font-medium text-slate-900">{issue.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{issue.description}</p>
                        </>
                    )}
                 </div>
               ))}
             </div>

             {/* Comments Section */}
             <div className="mt-8 pt-6 border-t border-slate-200">
               <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Comments</h3>
               <div className="space-y-4 mb-4">
                 {submission.comments.map(comment => (
                   <div key={comment.id} className="flex space-x-3">
                     <div className="flex-shrink-0">
                       <div className="h-6 w-6 rounded-full bg-slate-300 flex items-center justify-center text-xs">
                         {comment.authorId.substring(0,2)}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs text-slate-500">
                         <span className="font-medium text-slate-900">{comment.authorId === CURRENT_USER.id ? 'You' : 'Editor'}</span> &bull; {new Date(comment.createdAt).toLocaleTimeString()}
                       </div>
                       <div className="text-sm text-slate-700">{comment.body}</div>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                   placeholder="Add a comment..."
                   value={commentText}
                   onChange={(e) => setCommentText(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && postComment()}
                 />
                 <button 
                  onClick={postComment}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                 >
                   Send
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
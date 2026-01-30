import React from 'react';

export const Architecture: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto prose prose-indigo text-slate-700">
            <h1>Architecture & Backend Specification</h1>
            
            <section className="mb-12">
                <h2>1. System Overview</h2>
                <p>
                    The platform follows an event-driven microservices architecture to handle large media files and asynchronous AI processing.
                </p>
                <div className="bg-slate-800 text-slate-200 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                    Client (React) <br/>
                    &nbsp;&nbsp;|<br/>
                    &nbsp;&nbsp;v<br/>
                    API Gateway / Load Balancer<br/>
                    &nbsp;&nbsp;|<br/>
                    &nbsp;&nbsp;v<br/>
                    Backend API (FastAPI/Python) --+--> PostgreSQL (Metadata, Users, Projects)<br/>
                    &nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>
                    &nbsp;&nbsp;+--> S3 Storage (Media)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+--> Redis (Job Queue)<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AI Worker Service (Python/Celery)<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|--> FFMPEG (Frame Extraction)<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+--> Gemini API (Analysis)<br/>
                </div>
            </section>

            <section className="mb-12">
                <h2>2. Database Schema (PostgreSQL)</h2>
                <pre className="bg-slate-100 p-4 rounded text-xs overflow-x-auto">
{`CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  manager_id UUID REFERENCES users(id),
  config_id UUID REFERENCES evaluation_configs(id),
  status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  editor_id UUID REFERENCES users(id),
  version_number INT NOT NULL,
  source_type VARCHAR(20) CHECK (source_type IN ('image', 'video', 'url')),
  source_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai_reports (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id),
  report_json JSONB NOT NULL,
  overall_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE issues (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES ai_reports(id),
  rule_id VARCHAR(100),
  severity VARCHAR(20),
  coordinates_json JSONB,
  status VARCHAR(50) DEFAULT 'open'
);`}
                </pre>
            </section>

            <section className="mb-12">
                <h2>3. Worker Logic (Python)</h2>
                <p>The worker handles media processing and AI interaction to keep the API responsive.</p>
                <pre className="bg-slate-100 p-4 rounded text-xs overflow-x-auto">
{`# worker.py (Pseudo-code)

@celery.task
def process_submission(submission_id):
    submission = db.get_submission(submission_id)
    config = db.get_config(submission.project.config_id)
    
    # 1. Download Media
    file_path = download_from_s3(submission.source_url)
    
    # 2. Pre-process (FFMPEG)
    if submission.type == 'video':
        frames = extract_keyframes(file_path, interval=2.0)
        audio = extract_audio(file_path)
    
    # 3. AI Analysis
    prompt = build_system_prompt(config)
    ai_response = gemini.generate_content(
        model='gemini-3-pro-preview',
        prompt=prompt,
        media=frames or file_path
    )
    
    # 4. Parse & Save
    report_json = validate_json(ai_response.text)
    save_report(submission_id, report_json)
    
    # 5. Notify
    notify_manager(submission.project.manager_id, "Report Ready")
`}
                </pre>
            </section>

             <section>
                <h2>4. Deployment Notes</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Env Vars:</strong> <code>DATABASE_URL</code>, <code>REDIS_URL</code>, <code>API_KEY</code> (Gemini), <code>AWS_ACCESS_KEY_ID</code>.</li>
                    <li><strong>Scaling:</strong> The <code>Worker</code> service should be scaled independently based on queue depth (using KEDA on Kubernetes).</li>
                    <li><strong>Storage:</strong> Use S3 Lifecycle policies to delete raw video assets after X days, keeping only generated reports and thumbnails to save costs.</li>
                </ul>
            </section>
        </div>
    );
};
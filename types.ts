export type Role = 'MANAGER' | 'EDITOR' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
};

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export type Project = {
  id: string;
  name: string;
  managerId: string;
  configId: string;
  status: ProjectStatus;
  lastActivity: string;
  editorIds: string[];
  submissionIds: string[];
};

export type EvaluationConfig = {
  id: string;
  name: string;
  json: ConfigJSON;
  version: number;
};

export type ConfigJSON = {
  allowed_colors: { name: string; hex: string; tolerance: number }[];
  allowed_fonts: { family: string; weights: number[] }[];
  logo_rules: { min_size_px: number; safe_margin_percent: number };
  video_rules: { max_duration_sec: number; resolution: string };
  scoring: { pass_threshold: number };
  guidelines?: string; // Markdown/Plain text guidelines
};

export type SubmissionStatus = 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING';

export type Submission = {
  id: string;
  projectId: string;
  editorId: string;
  version: number;
  sourceType: 'IMAGE' | 'VIDEO' | 'URL';
  sourceUrl: string;
  status: SubmissionStatus;
  createdAt: string;
  report?: ReportJSON;
  comments: Comment[];
};

export type ReportJSON = {
  overall: {
    score: number;
    decision: 'pass' | 'needs_changes';
    summary: string;
  };
  issues: Issue[];
  editor_action_list: { priority: number; action: string; related_issue_ids: string[] }[];
};

export type Issue = {
  issue_id: string;
  rule_id: string;
  category: 'colors' | 'typography' | 'layout' | 'logo' | 'audio' | 'video' | 'other';
  severity: 'blocker' | 'high' | 'medium' | 'low';
  confidence: number;
  title: string;
  description: string;
  evidence?: {
    timestamp_range?: { start_ms: number; end_ms: number };
    coordinates?: { x: number; y: number; w: number; h: number };
  };
  recommendation?: {
    action: string;
    details: string;
  };
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};
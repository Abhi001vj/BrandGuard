import { Project, Submission, User, EvaluationConfig } from '../types';

// In a real app, this would come from Auth
export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Manager',
  email: 'alex@brandco.com',
  role: 'MANAGER',
  avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Manager&background=random'
};

export const DEFAULT_CONFIG: EvaluationConfig = {
  id: 'c1',
  name: 'Standard Brand Guidelines v1',
  version: 1,
  json: {
    allowed_colors: [
      { name: 'Brand Blue', hex: '#0056D2', tolerance: 0.1 },
      { name: 'Accent Orange', hex: '#FF6B00', tolerance: 0.1 },
      { name: 'White', hex: '#FFFFFF', tolerance: 0.05 }
    ],
    allowed_fonts: [
      { family: 'Inter', weights: [400, 600, 700] },
      { family: 'Roboto', weights: [400] }
    ],
    logo_rules: { min_size_px: 50, safe_margin_percent: 5 },
    video_rules: { max_duration_sec: 60, resolution: '1080p' },
    scoring: { pass_threshold: 80 }
  }
};

// Empty initial state for a real working app
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_SUBMISSIONS: Record<string, Submission> = {};
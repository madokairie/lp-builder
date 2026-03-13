import { LPProject } from './types';

const STORAGE_KEY = 'lp-builder-projects';

function load(): LPProject[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function save(projects: LPProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects(): LPProject[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): LPProject | undefined {
  return load().find(p => p.id === id);
}

export function saveProject(project: Omit<LPProject, 'id' | 'createdAt' | 'updatedAt'>): LPProject {
  const projects = load();
  const now = new Date().toISOString();
  const newProject: LPProject = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  projects.push(newProject);
  save(projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<LPProject>): LPProject | undefined {
  const projects = load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  save(projects);
  return projects[idx];
}

export function deleteProject(id: string) {
  const projects = load().filter(p => p.id !== id);
  save(projects);
}

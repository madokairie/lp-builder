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

export function exportProjects(): string {
  return JSON.stringify(load());
}

export function importProjects(json: string) {
  const incoming: LPProject[] = JSON.parse(json);
  const existing = load();
  const existingIds = new Set(existing.map(p => p.id));
  const merged = [...existing, ...incoming.filter(p => !existingIds.has(p.id))];
  save(merged);
}

const MAX_PROJECTS = 20;

export function getProjectCount(): number {
  return load().length;
}

export function getStorageInfo(): { count: number; max: number; usedKB: number; nearLimit: boolean; atLimit: boolean } {
  const projects = load();
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  const usedKB = Math.round(new Blob([raw]).size / 1024);
  return {
    count: projects.length,
    max: MAX_PROJECTS,
    usedKB,
    nearLimit: projects.length >= MAX_PROJECTS - 3,
    atLimit: projects.length >= MAX_PROJECTS,
  };
}

export function duplicateProject(id: string): LPProject | undefined {
  const projects = load();
  const source = projects.find(p => p.id === id);
  if (!source) return undefined;
  const now = new Date().toISOString();
  const copy: LPProject = {
    ...source,
    id: crypto.randomUUID(),
    name: source.name + ' (コピー)',
    createdAt: now,
    updatedAt: now,
  };
  projects.push(copy);
  save(projects);
  return copy;
}

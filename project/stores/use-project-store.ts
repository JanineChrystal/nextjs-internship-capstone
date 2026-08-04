import { create } from "zustand";
import { mockProjects } from "@/app/(dashboard)/_constants/mock-projects";
import type { Project } from "@/lib/validations/project-schema";

interface ProjectState {
	projects: Project[];
	addProject: (project: Omit<Project, "id">) => void;
	deleteProjects: (ids: Set<string>) => void;
	updateProject: (id: string, updates: Partial<Project>) => void;
}

// 2. Zustand Store Implementation
export const useProjectStore = create<ProjectState>((set) => ({
	projects: mockProjects,

	// CREATE: Injects a new project at the top of the list with a generated UUID
	addProject: (projectData) =>
		set((state) => {
			const newProject: Project = {
				...projectData,
				id: crypto.randomUUID(), // Standard browser API for generating UUIDs
			};
			return { projects: [newProject, ...state.projects] };
		}),

	// DELETE: Filters out projects whose IDs match the incoming Set
	deleteProjects: (ids) =>
		set((state) => ({
			projects: state.projects.filter((project) => !ids.has(project.id)),
		})),

	// UPDATE: Maps over the array and applies partial updates to the matching ID
	updateProject: (id, updates) =>
		set((state) => ({
			projects: state.projects.map((project) =>
				project.id === id ? { ...project, ...updates } : project,
			),
		})),
}));

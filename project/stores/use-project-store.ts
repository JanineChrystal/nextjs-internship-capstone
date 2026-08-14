import { create } from "zustand";
import type { Project } from "@/lib/validations/project-schema";

interface ProjectState {
	projects: Project[];
	addProject: (project: Omit<Project, "id">) => void;
	deleteProjects: (ids: Set<string>) => void;
	updateProject: (id: string, updates: Partial<Project>) => void;
	setProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
	projects: [],

	// CREATE
	addProject: (projectData) =>
		set((state) => {
			const newProject: Project = {
				...projectData,
				id: crypto.randomUUID(),
			};
			return { projects: [newProject, ...state.projects] };
		}),

	// DELETE
	deleteProjects: (ids) =>
		set((state) => ({
			projects: state.projects.filter((project) => !ids.has(project.id)),
		})),

	// UPDATE
	updateProject: (id, updates) =>
		set((state) => ({
			projects: state.projects.map((project) =>
				project.id === id ? { ...project, ...updates } : project,
			),
		})),

	// SET: Hydrates the store with initial data passed down from the server
	setProjects: (projects) => set({ projects }),
}));

import { create } from "zustand";
import type { Project } from "@/lib/validations/project-schema";

interface ProjectState {
	projects: Project[];
	addProject: (project: Project | Omit<Project, "id">) => void;
	deleteProjects: (ids: Set<string>) => void;
	updateProject: (id: string, updates: Partial<Project>) => void;
	setProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
	projects: [],

	// CREATE
	addProject: (projectData) =>
		set((state) => {
			// Respect a caller-supplied id (e.g. a real DB id being hydrated into
			// the store, or an optimistic temp id awaiting server confirmation).
			// Only mint a new one if the caller genuinely didn't provide any.
			const newProject: Project = {
				...projectData,
				id:
					"id" in projectData && projectData.id
						? projectData.id
						: crypto.randomUUID(),
			} as Project;
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

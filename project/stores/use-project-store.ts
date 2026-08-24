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

	/** create action - inserts a new project at the beginning of the list. */
	addProject: (projectData) =>
		set((state) => {
			/** id generation - respects caller-supplied IDs (like real DB IDs or temp UI IDs) and only mints a UUID if none was provided. */
			const newProject: Project = {
				...projectData,
				id:
					"id" in projectData && projectData.id
						? projectData.id
						: crypto.randomUUID(),
			} as Project;
			return { projects: [newProject, ...state.projects] };
		}),

	/** delete action - removes projects by ID from the state. */
	deleteProjects: (ids) =>
		set((state) => ({
			projects: state.projects.filter((project) => !ids.has(project.id)),
		})),

	/** update action - merges partial changes into an existing project. */
	updateProject: (id, updates) =>
		set((state) => ({
			projects: state.projects.map((project) =>
				project.id === id ? { ...project, ...updates } : project,
			),
		})),

	/** hydration action - seeds the store with initial project data passed down from the server. */
	setProjects: (projects) => set({ projects }),
}));

// import { forbidden } from "next/navigation";
// import { requireUser } from "@/lib/dal/auth";
// import { getProjectForUser } from "@/lib/dal/projects";

// export default async function ProjectLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
//     const user = await requireUser();
//     const project = await getProjectForUser(params.id, user.id);

//     // If they just a VIEWER, kick them out to forbidden.tsx
//     if (project.role === 'VIEWER') {
//         forbidden();
//     }

//     return <div>{children}</div>;
// }

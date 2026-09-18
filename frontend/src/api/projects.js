import { api } from "./client.js";

export async function fetchProjects() {
  const { data } = await api.get("/projects");
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function fetchProject(projectId) {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
}

export async function createSite(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/sites`, payload);
  return data;
}

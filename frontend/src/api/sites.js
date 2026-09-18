import { api } from "./client.js";

export async function fetchSite(siteId) {
  const { data } = await api.get(`/sites/${siteId}`);
  return data;
}

export async function fetchSiteMetrics(siteId, params = {}) {
  const { data } = await api.get(`/sites/${siteId}/metrics`, { params });
  return data;
}

export async function fetchSiteAiInsights(siteId) {
  const { data } = await api.get(`/sites/${siteId}/ai-insights`, { timeout: 45000 });
  return data;
}

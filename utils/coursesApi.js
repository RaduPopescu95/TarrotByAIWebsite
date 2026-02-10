import { authentication } from "../firebase";

function getDashboardAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dashboard_access_token");
  } catch (_) {
    return null;
  }
}

async function getIdTokenOptional() {
  const user = authentication.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

async function apiRequest(url, options = {}) {
  const token = await getIdTokenOptional();
  const dashboardToken = getDashboardAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(dashboardToken ? { "X-Dashboard-Access": dashboardToken } : {}),
    ...(options.headers || {}),
  };
  let response;
  try {
    response = await fetch(url, { ...options, headers });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const message = data?.error || "Eroare necunoscută";
      throw new Error(message);
    }
    return data;
  } catch (error) {
    console.error("[courses.api] request_fail", {
      url,
      method: options.method || "GET",
      status: response?.status || null,
      message: error?.message || "unknown_error",
    });
    throw error;
  }
}

export async function fetchAdminCourses() {
  const data = await apiRequest("/api/admin/courses", { method: "GET" });
  return data?.courses || [];
}

export async function fetchAdminCourse(courseId) {
  return await apiRequest(`/api/admin/courses/${courseId}`, { method: "GET" });
}

export async function createAdminCourse(payload) {
  return await apiRequest("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCourse(courseId, payload) {
  return await apiRequest(`/api/admin/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCourse(courseId) {
  return await apiRequest(`/api/admin/courses/${courseId}`, {
    method: "DELETE",
  });
}

export async function fetchCourseCategories() {
  const data = await apiRequest("/api/admin/course-categories", { method: "GET" });
  return data?.categories || [];
}

export async function createCourseCategory(payload) {
  return await apiRequest("/api/admin/course-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourseCategory(categoryId, payload) {
  return await apiRequest(`/api/admin/course-categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCourseCategory(categoryId) {
  return await apiRequest(`/api/admin/course-categories/${categoryId}`, {
    method: "DELETE",
  });
}

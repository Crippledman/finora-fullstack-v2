const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("finora_token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  register: body => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: body => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),

  transactions: {
    list: () => request("/transactions"),
    create: body => request("/transactions", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: id => request(`/transactions/${id}`, { method: "DELETE" })
  },

  budgets: {
    list: () => request("/budgets"),
    create: body => request("/budgets", { method: "POST", body: JSON.stringify(body) }),
    remove: id => request(`/budgets/${id}`, { method: "DELETE" })
  },

  loans: {
    list: () => request("/loans"),
    create: body => request("/loans", { method: "POST", body: JSON.stringify(body) }),
    remove: id => request(`/loans/${id}`, { method: "DELETE" })
  },

  investments: {
    list: () => request("/investments"),
    create: body => request("/investments", { method: "POST", body: JSON.stringify(body) }),
    remove: id => request(`/investments/${id}`, { method: "DELETE" })
  }
};

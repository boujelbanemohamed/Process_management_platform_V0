export class ApiClient {
  static async getUsers() {
    const response = await fetch("/api/users")
    if (!response.ok) throw new Error("Failed to fetch users")
    return response.json()
  }

  static async createUser(userData: {
    name: string
    email: string
    role: string
    password: string
  }) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    if (!response.ok) throw new Error("Failed to create user")
    return response.json()
  }

  static async getProcesses() {
    const response = await fetch("/api/processes")
    if (!response.ok) throw new Error("Failed to fetch processes")
    return response.json()
  }

  static async createProcess(processData: {
    name: string
    description: string
    category: string
    status: string
    createdBy: string
    tags: string[]
  }) {
    const response = await fetch("/api/processes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processData),
    })
    if (!response.ok) throw new Error("Failed to create process")
    return response.json()
  }
}

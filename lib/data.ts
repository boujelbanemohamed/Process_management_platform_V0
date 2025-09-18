import type { Process, Document, Entity } from "@/types"

// Mock data for demonstration
export const mockProcesses: Process[] = [
  {
    id: "1",
    name: "Processus de Recrutement",
    description: "Processus complet de recrutement des nouveaux employés",
    category: "Ressources Humaines",
    status: "active",
    createdBy: "1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-20"),
    documents: [],
    tags: ["RH", "Recrutement", "Onboarding"],
  },
  {
    id: "2",
    name: "Gestion des Commandes",
    description: "Processus de traitement des commandes clients",
    category: "Ventes",
    status: "active",
    createdBy: "2",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-25"),
    documents: [],
    tags: ["Ventes", "Commandes", "Client"],
  },
  {
    id: "3",
    name: "Contrôle Qualité",
    description: "Processus de contrôle qualité des produits",
    category: "Production",
    status: "draft",
    createdBy: "1",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-28"),
    documents: [],
    tags: ["Qualité", "Production", "Contrôle"],
  },
]

export const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Guide_Recrutement_v2.pdf",
    type: "pdf",
    size: 2048000,
    version: "2.0",
    uploadedBy: "1",
    uploadedAt: new Date("2024-02-20"),
    processId: "1",
    url: "#",
  },
  {
    id: "2",
    name: "Formulaire_Entretien.docx",
    type: "docx",
    size: 512000,
    version: "1.3",
    uploadedBy: "2",
    uploadedAt: new Date("2024-02-18"),
    processId: "1",
    url: "#",
  },
]

export const mockEntities: Entity[] = [
  {
    id: "1",
    name: "Département RH",
    type: "department",
    description: "Gestion des ressources humaines",
    processes: ["1"],
  },
  {
    id: "2",
    name: "Équipe Ventes",
    type: "team",
    description: "Équipe commerciale",
    processes: ["2"],
  },
]

export const processes = mockProcesses
export const documents = mockDocuments
export const entities = mockEntities

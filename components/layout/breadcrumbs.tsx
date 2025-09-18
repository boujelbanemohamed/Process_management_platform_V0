"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Accueil", href: "/dashboard" }]

    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      let label = segment
      switch (segment) {
        case "dashboard":
          label = "Tableau de bord"
          break
        case "processes":
          label = "Processus"
          break
        case "documents":
          label = "Documents"
          break
        case "search":
          label = "Recherche"
          break
        case "entities":
          label = "Entités"
          break
        case "settings":
          label = "Paramètres"
          break
        case "upload":
          label = "Import"
          break
        default:
          // For dynamic segments, keep the original value
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      if (index > 0 || segment !== "dashboard") {
        breadcrumbs.push({ label, href: currentPath })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-slate-800 font-medium">{breadcrumb.label}</span>
          ) : (
            <Link href={breadcrumb.href} className="hover:text-slate-800 transition-colors">
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AuthService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Search,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileBarChart,
  Shield,
  Activity,
  Tag,
  Circle,
  Briefcase,
} from "lucide-react"

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Processus", href: "/processes", icon: FileText },
  { name: "Projets", href: "/projects", icon: Briefcase },
  { name: "Documents", href: "/documents", icon: FolderOpen },
  { name: "Recherche", href: "/search", icon: Search },
  { name: "Entités", href: "/entities", icon: Users },
  { name: "Analytiques", href: "/analytics", icon: BarChart3 },
  { name: "Rapports", href: "/reports", icon: FileBarChart },
]

const adminNavigation = [
  { name: "Utilisateurs", href: "/settings", icon: Settings },
  { name: "Permissions", href: "/settings/permissions", icon: Shield },
  { name: "Catégories", href: "/settings/categories", icon: Tag }, // Added categories management
  { name: "Statuts", href: "/settings/statuses", icon: Circle }, // Added statuses management
  { name: "Journal d'accès", href: "/settings/logs", icon: Activity },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = AuthService.getCurrentUser()
  const isAdmin = user?.role === "admin"

  const handleLogout = () => {
    AuthService.logout()
    router.push("/")
  }

  return (
    <div
      className={cn("flex flex-col bg-slate-900 text-white transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && <h1 className="text-lg font-semibold text-balance">Gestion Processus</h1>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="space-y-2">
            {!collapsed && (
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</h3>
              </div>
            )}
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
        )}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}

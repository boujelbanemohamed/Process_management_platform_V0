"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SearchPage as SearchPageComponent } from "@/components/search/search-page"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [initialQuery, setInitialQuery] = useState("")

  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setInitialQuery(q)
    }
  }, [searchParams])

  return (
    <DashboardLayout>
      <SearchPageComponent />
    </DashboardLayout>
  )
}

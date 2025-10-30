import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import "./globals.css"
import { Suspense } from "react"
import { ClientLayout } from "@/components/ClientLayout"
import { Sidebar } from "@/components/layout/sidebar" // Assurez-vous que le chemin est correct

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Plateforme de Gestion des Processus",
  description: "Plateforme de gestion des processus organisationnels",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="antialiased">
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ClientLayout>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col overflow-y-auto">
                <Suspense fallback={null}>
                  {children}
                  <Toaster />
                </Suspense>
              </main>
            </div>
          </ClientLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

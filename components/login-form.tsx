"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await AuthService.login(email, password)
      if (user) {
        router.push("/dashboard")
      } else {
        setError("Email ou mot de passe incorrect")
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center pb-10">
        <CardTitle className="text-4xl font-bold text-slate-800">Connexion</CardTitle>
        <CardDescription className="text-slate-600 text-lg mt-3">
          Accédez à votre plateforme de gestion des processus
        </CardDescription>
      </CardHeader>
      <CardContent className="px-12 pb-12">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <Label htmlFor="email" className="text-xl font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@entreprise.com"
              className="h-20 text-xl px-6"
              required
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="password" className="text-xl font-medium">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-20 text-xl px-6"
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full h-20 text-xl bg-slate-800 hover:bg-slate-700 font-medium" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

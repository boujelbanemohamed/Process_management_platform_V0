"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle } from "lucide-react"

export default function SetupPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError("Token d'invitation manquant ou invalide")
    }
  }, [searchParams])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Le mot de passe doit contenir au moins 8 caractères"
    if (!/(?=.*[a-z])/.test(pwd)) return "Le mot de passe doit contenir au moins une minuscule"
    if (!/(?=.*[A-Z])/.test(pwd)) return "Le mot de passe doit contenir au moins une majuscule"
    if (!/(?=.*\d)/.test(pwd)) return "Le mot de passe doit contenir au moins un chiffre"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    try {
      // TODO: In production, call API to set password with token
      console.log("[v0] Setting password for token:", token)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login?message=Compte activé avec succès")
      }, 2000)
    } catch (err) {
      setError("Erreur lors de la configuration du mot de passe")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">Compte activé !</h2>
              <p className="text-slate-600">
                Votre mot de passe a été configuré avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">Configurer votre mot de passe</CardTitle>
          <CardDescription>Définissez un mot de passe sécurisé pour activer votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          {error && !token ? (
            <div className="text-center space-y-4">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => router.push("/auth/login")} variant="outline">
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="text-xs text-slate-500 space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Au moins 8 caractères</li>
                  <li>Une lettre minuscule</li>
                  <li>Une lettre majuscule</li>
                  <li>Un chiffre</li>
                </ul>
              </div>

              <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700" disabled={isLoading}>
                {isLoading ? "Configuration..." : "Activer mon compte"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

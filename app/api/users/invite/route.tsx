import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, inviteToken } = await request.json()

    // In production, you would:
    // 1. Generate a secure invitation token
    // 2. Store it in database with expiration
    // 3. Send email using a service like SendGrid, Resend, or Nodemailer

    // For now, we'll simulate the email sending
    console.log("[v0] Sending invitation email to:", email)
    console.log("[v0] Invitation details:", { name, role, inviteToken })

    // Simulate email template
    const invitationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/setup-password?token=${inviteToken}`

    const emailContent = {
      to: email,
      subject: "Invitation à rejoindre la plateforme de gestion des processus",
      html: `
        <h2>Bonjour ${name},</h2>
        <p>Vous avez été invité(e) à rejoindre notre plateforme de gestion des processus avec le rôle de <strong>${role}</strong>.</p>
        <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
        <a href="${invitationLink}" style="background-color: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Activer mon compte
        </a>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
      `,
    }

    // TODO: In production, replace this with actual email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send(emailContent)

    // For development, log the email content
    console.log("[v0] Email content:", emailContent)

    return NextResponse.json({
      success: true,
      message: "Invitation envoyée avec succès",
      // In development, return the invitation link for testing
      invitationLink: process.env.NODE_ENV === "development" ? invitationLink : undefined,
    })
  } catch (error) {
    console.error("[v0] Error sending invitation:", error)
    return NextResponse.json({ success: false, message: "Erreur lors de l'envoi de l'invitation" }, { status: 500 })
  }
}

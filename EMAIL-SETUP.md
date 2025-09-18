# Configuration du système d'envoi d'emails

## Services d'email recommandés

### 1. Resend (Recommandé)
\`\`\`bash
npm install resend
\`\`\`

\`\`\`typescript
// Dans app/api/users/invite/route.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'noreply@votre-domaine.com',
  to: email,
  subject: 'Invitation à rejoindre la plateforme',
  html: emailContent.html
})
\`\`\`

### 2. SendGrid
\`\`\`bash
npm install @sendgrid/mail
\`\`\`

### 3. Nodemailer (SMTP)
\`\`\`bash
npm install nodemailer
\`\`\`

## Variables d'environnement à ajouter

\`\`\`env
# Pour Resend
RESEND_API_KEY=your_resend_api_key

# Pour SendGrid  
SENDGRID_API_KEY=your_sendgrid_api_key

# Pour SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
\`\`\`

## En développement

Les emails ne sont pas envoyés mais les liens d'invitation sont affichés dans la console pour les tests.

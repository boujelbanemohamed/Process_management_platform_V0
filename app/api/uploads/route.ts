import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // Gère la génération du jeton sécurisé avant que l'upload ne commence côté client.
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        const { userId } = payload;

        // Sécurité : On s'assure qu'un utilisateur est bien identifié.
        if (!userId) {
          throw new Error('Authentification requise pour téléverser.');
        }

        return {
          allowedContentTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/png',
            'image/jpeg',
            'image/jpg',
          ],
          // On passe les métadonnées du client au callback onUploadCompleted.
          tokenPayload: clientPayload,
        };
      },
      // S'exécute après que le fichier a été téléversé avec succès sur Vercel Blob.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload vers le Blob terminé', { url: blob.url });

        const payload = JSON.parse(tokenPayload || '{}');
        const {
          processId,
          projectId,
          description,
          existingId,
          userId,
          linkType = 'process',
          fileName,
          contentType,
          fileSize,
        } = payload;

        const sql = getSql();

        if (existingId) {
          // Mise à jour d'un document existant (nouvelle version)
          const current = await sql`SELECT version FROM documents WHERE id = ${Number(existingId)}`;
          const currentVersion = (current?.[0]?.version as string) || "1.0";
          const nextVersion = (parseFloat(currentVersion) + 0.1).toFixed(1);

          await sql`
            UPDATE documents
            SET name = ${fileName},
                url = ${blob.url},
                type = ${contentType},
                size = ${fileSize},
                version = ${nextVersion},
                link_type = ${linkType},
                process_id = ${processId ? Number(processId) : null},
                project_id = ${projectId ? Number(projectId) : null},
                uploaded_at = CURRENT_TIMESTAMP
            WHERE id = ${Number(existingId)}`;
          console.log(`Document ${existingId} mis à jour avec la version ${nextVersion}.`);
        } else {
          // Création d'un nouveau document
          const uploaderId = userId ? Number(userId) : null;
          if (!uploaderId) {
            throw new Error('User ID est requis pour créer un document.');
          }

          const result = await sql`
            INSERT INTO documents (name, description, type, size, version, process_id, project_id, link_type, url, uploaded_by)
            VALUES (${fileName}, ${description || null}, ${contentType}, ${fileSize}, '1.0', ${processId ? Number(processId) : null}, ${projectId ? Number(projectId) : null}, ${linkType}, ${blob.url}, ${uploaderId})
            RETURNING id`;
          console.log(`Nouveau document créé avec l'ID: ${result[0].id}`);
        }
      },
    });

    // La réponse contient l'URL de téléversement que le client utilisera.
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("/api/uploads error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // Utiliser 400 pour les erreurs client comme l'authentification manquante
    );
  }
}

// La fonction GET pour le diagnostic reste inchangée.
export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    let dbOk = false
    let dbError: string | null = null
    try {
      const sql = getSql()
      await sql`SELECT 1`
      dbOk = true
    } catch (err: any) {
      dbOk = false
      dbError = err?.message || String(err)
    }
    return NextResponse.json({ hasToken: Boolean(token), dbOk, dbError })
  } catch (e: any) {
    return NextResponse.json({ error: 'diagnostic-failed', details: e?.message || String(e) }, { status: 500 })
  }
}

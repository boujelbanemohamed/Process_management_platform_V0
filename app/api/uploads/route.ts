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
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        const { userId, version } = payload;

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error('Le token Vercel Blob n\'est pas configuré côté serveur.');
        }
        if (!userId) {
          throw new Error('Authentification requise pour téléverser.');
        }
        if (!version) {
          throw new Error('Le champ version est obligatoire.');
        }

        return {
          allowOverwrite: true, // Permet de remplacer un fichier dans le blob si le chemin est le même
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');
        const {
          processId,
          projectId,
          description,
          existingId, // ID du document principal, s'il existe déjà
          userId,
          version, // La version est maintenant obligatoire
          linkType = 'process',
          fileName,
          contentType,
          fileSize,
        } = payload;

        if (!version) {
          // Double validation, au cas où
          throw new Error("La version est obligatoire et n'a pas été fournie.");
        }

        const sql = getSql();
        let documentId = existingId ? Number(existingId) : null;

        if (documentId) {
          // Le document existe, on ne crée qu'une nouvelle version
          console.log(`Ajout d'une nouvelle version au document existant: ${documentId}`);
        } else {
          // Nouveau document : créer l'entrée principale dans `documents`
          const uploaderId = userId ? Number(userId) : null;
          if (!uploaderId) {
            throw new Error('User ID est requis pour créer un document.');
          }

          const docResult = await sql`
            INSERT INTO documents (name, description, process_id, project_id, link_type, created_by)
            VALUES (${fileName}, ${description || null}, ${processId ? Number(processId) : null}, ${projectId ? Number(projectId) : null}, ${linkType}, ${uploaderId})
            RETURNING id`;

          documentId = docResult[0].id;
          console.log(`Nouveau document créé avec l'ID: ${documentId}`);
        }

        // Insérer la nouvelle version dans `document_versions`
        await sql`
          INSERT INTO document_versions (document_id, version, url, type, size, uploaded_by)
          VALUES (${documentId}, ${version}, ${blob.url}, ${contentType}, ${fileSize}, ${Number(userId)})
        `;
        console.log(`Nouvelle version '${version}' enregistrée pour le document ID: ${documentId}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("/api/uploads error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

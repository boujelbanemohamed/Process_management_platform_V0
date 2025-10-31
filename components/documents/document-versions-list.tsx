"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DocumentVersion {
  id: number;
  version: string;
  uploaded_at: string;
  uploaded_by_name: string;
  url: string;
}

interface DocumentVersionsListProps {
  versions: DocumentVersion[];
}

export function DocumentVersionsList({ versions }: DocumentVersionsListProps) {
  if (!versions || versions.length === 0) {
    return <p className="text-slate-500">Aucune version disponible pour ce document.</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Version</TableHead>
            <TableHead>Date d'import</TableHead>
            <TableHead>Importé par</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((version, index) => (
            <TableRow key={version.id}>
              <TableCell className="font-medium">
                {version.version}
                {index === 0 && <Badge className="ml-2 bg-green-100 text-green-800">Actuelle</Badge>}
              </TableCell>
              <TableCell>{new Date(version.uploaded_at).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell>{version.uploaded_by_name || 'Inconnu'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <a href={version.url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

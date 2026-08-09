import type { AdminDocument, AdminDocType } from '../../types/admin'
import { Table, TableHead, TableHeaderCell, TableRow, TableCell } from '../ui/Table'
import { StatusPill } from '../ui/StatusPill'
import { formatDate } from '../../lib/dates'

const typeLabels: Record<AdminDocType, string> = {
  contract: 'Contrat',
  payment: 'Paiement',
  legal: 'Juridique',
}

const typeTone: Record<AdminDocType, 'blue' | 'green' | 'purple'> = {
  contract: 'blue',
  payment: 'green',
  legal: 'purple',
}

export function DocumentRepo({ docs }: { docs: AdminDocument[] }) {
  return (
    <Table>
      <TableHead>
        <TableHeaderCell>Titre</TableHeaderCell>
        <TableHeaderCell>Type</TableHeaderCell>
        <TableHeaderCell>Ajouté le</TableHeaderCell>
        <TableHeaderCell>Par</TableHeaderCell>
      </TableHead>
      <tbody>
        {docs.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <a
                href={doc.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {doc.title}
              </a>
              {doc.description && <p className="text-xs text-zinc-500 dark:text-zinc-500">{doc.description}</p>}
            </TableCell>
            <TableCell>
              <StatusPill label={typeLabels[doc.type]} tone={typeTone[doc.type]} />
            </TableCell>
            <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(doc.uploadedAt)}</TableCell>
            <TableCell className="text-zinc-500 dark:text-zinc-400">{doc.uploadedBy}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}

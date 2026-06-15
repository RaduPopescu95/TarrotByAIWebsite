import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit2, Eye, EyeOff, Trash2 } from "lucide-react";

function formatPeriod(row) {
  const start = row.displayStartAt
    ? new Date(row.displayStartAt).toLocaleDateString("ro-RO")
    : "—";
  const end = row.displayEndAt
    ? new Date(row.displayEndAt).toLocaleDateString("ro-RO")
    : "—";
  return `${start} → ${end}`;
}

export default function PartnerPromotionsTable({
  promotions,
  zones,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[32%]">Firmă</TableHead>
          <TableHead className="w-[18%]">Perioadă</TableHead>
          <TableHead className="w-[22%]">Zone</TableHead>
          <TableHead className="w-[12%]">Status</TableHead>
          <TableHead className="w-[8%] text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((row) => (
          <TableRow key={row.id} className="group hover:bg-gray-50">
            <TableCell>
              <div className="flex items-center gap-3">
                {row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.logoUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg border object-contain bg-white"
                  />
                ) : null}
                <div>
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="line-clamp-1 text-xs text-gray-500">{row.description}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-600">{formatPeriod(row)}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(row.placements || []).slice(0, 3).map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {zones[p]?.label || p}
                  </Badge>
                ))}
                {(row.placements || []).length > 3 ? (
                  <Badge variant="secondary" className="text-xs">
                    +{(row.placements || []).length - 3}
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={row.isActive ? "default" : "secondary"}>
                {row.isActive ? "Activ" : "Inactiv"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-70 hover:opacity-100"
                    aria-label="Acțiuni"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(row)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editează
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(row)}>
                    {row.isActive ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Dezactivează
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Activează
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Șterge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

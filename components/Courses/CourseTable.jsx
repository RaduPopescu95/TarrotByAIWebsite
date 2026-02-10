import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

function formatPrice(price, currency) {
  if (typeof price !== "number") return "-";
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CourseTable({ courses, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titlu</TableHead>
            <TableHead>Preț</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actualizat</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length === 0 ? (
            <TableRow>
              <TableCell className="text-center text-muted-foreground" colSpan={5}>
                Nu există cursuri încă.
              </TableCell>
            </TableRow>
          ) : (
            courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{course.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {formatPrice(course.price, course.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={course.status === "published" ? "success" : "warning"}>
                    {course.status === "published" ? "Publicat" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {course.updatedAt?.seconds
                    ? new Date(course.updatedAt.seconds * 1000).toLocaleDateString("ro-RO")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
                      Editează
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(course)}>
                      Șterge
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

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
import { MoreHorizontal, Edit2, Copy, Eye, EyeOff, Trash2, PlayCircle } from "lucide-react";

export default function CoursesTable({
  courses,
  categoryMap,
  onEdit,
  onTogglePublish,
  onDuplicate,
  onTestVideo,
  onDelete,
  formatPrice,
  formatUpdated,
  formatScheduled,
}) {
  const statusLabel = (value) => {
    if (value === "draft") return "Ciornă";
    if (value === "published") return "Publicat";
    return "Programat";
  };

  const statusVariant = (value) => {
    if (value === "draft") return "secondary";
    if (value === "published") return "default";
    return "outline";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Titlu</TableHead>
          <TableHead className="w-[12%]">Preț</TableHead>
          <TableHead className="w-[12%]">Status</TableHead>
          <TableHead className="w-[12%]">Evidențiat</TableHead>
          <TableHead className="w-[16%]">Programare</TableHead>
          <TableHead className="w-[16%]">Actualizat</TableHead>
          <TableHead className="w-[8%] text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id} className="group hover:bg-gray-50">
            <TableCell>
              <div>
                <div className="font-medium text-gray-900">{course.title}</div>
                {Array.isArray(course.categoryIds) && course.categoryIds.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {course.categoryIds.slice(0, 3).map((id) => (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {categoryMap[id] || "Necunoscută"}
                      </Badge>
                    ))}
                    {course.categoryIds.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{course.categoryIds.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium text-gray-700">
              {formatPrice(course.price)} lei
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(course.status)}>
                {statusLabel(course.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {course.featuredOnHome ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  Evidențiat
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {course.status === "scheduled" ? formatScheduled?.(course.scheduledAt) : "—"}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatUpdated(course.updatedAt)}
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
                  <DropdownMenuItem onClick={() => onEdit(course)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editează
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTogglePublish(course)}>
                    {course.status === "published" ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Depublică
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Publică
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(course)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplică
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTestVideo?.(course)}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Test video
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(course)}
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

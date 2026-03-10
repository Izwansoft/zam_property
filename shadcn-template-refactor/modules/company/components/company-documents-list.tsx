// =============================================================================
// CompanyDocumentsList — Display and manage company documents
// =============================================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Loader2,
  MoreVertical,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCompanyDocuments,
  useAddCompanyDocument,
  useDeleteCompanyDocument,
  useVerifyCompanyDocument,
} from "../hooks/useCompanySettings";
import {
  CompanyDocumentType,
  COMPANY_DOCUMENT_TYPE_CONFIG,
  type CompanyDocument,
} from "../types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const addDocumentSchema = z.object({
  type: z.nativeEnum(CompanyDocumentType),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Please enter a valid URL"),
  fileSize: z.coerce.number().min(1, "File size is required"),
  mimeType: z.string().min(1),
  expiresAt: z.string().optional(),
});

type AddDocumentFormValues = z.infer<typeof addDocumentSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CompanyDocumentsListProps {
  companyId: string;
  canVerify?: boolean;
}

export function CompanyDocumentsList({ companyId, canVerify = false }: CompanyDocumentsListProps) {
  const { data: documents, isLoading } = useCompanyDocuments(companyId);
  const addDocument = useAddCompanyDocument(companyId);
  const deleteDocument = useDeleteCompanyDocument(companyId);
  const verifyDocument = useVerifyCompanyDocument(companyId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [verifyDocId, setVerifyDocId] = useState<string | null>(null);

  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      type: CompanyDocumentType.OTHER,
      fileName: "",
      fileUrl: "",
      fileSize: 0,
      mimeType: "application/pdf",
      expiresAt: "",
    },
  });

  const onSubmit = async (values: AddDocumentFormValues) => {
    await addDocument.mutateAsync({
      type: values.type,
      fileName: values.fileName,
      fileUrl: values.fileUrl,
      fileSize: values.fileSize,
      mimeType: values.mimeType,
      expiresAt: values.expiresAt || undefined,
    });
    form.reset();
    setIsAddDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteDocId) {
      await deleteDocument.mutateAsync({ documentId: deleteDocId });
      setDeleteDocId(null);
    }
  };

  const handleVerify = async () => {
    if (verifyDocId) {
      await verifyDocument.mutateAsync({ documentId: verifyDocId, verified: true });
      setVerifyDocId(null);
    }
  };

  if (isLoading) {
    return <CompanyDocumentsListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Company Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage required business documents.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Upload a new company document. Provide the URL to the document.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(COMPANY_DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ssm-certificate.pdf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." {...field} />
                          <Button type="button" variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL to the uploaded document file.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When does this document expire?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDocument.isPending}>
                    {addDocument.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Document
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {documents && documents.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  canVerify={canVerify}
                  onDelete={() => setDeleteDocId(doc.id)}
                  onVerify={() => setVerifyDocId(doc.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No documents</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your business documents to complete your company profile.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteDocument.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Confirmation Dialog */}
      <AlertDialog open={!!verifyDocId} onOpenChange={() => setVerifyDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify this document? This will mark it as approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify}>
              {verifyDocument.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Row
// ---------------------------------------------------------------------------

interface DocumentRowProps {
  document: CompanyDocument;
  canVerify: boolean;
  onDelete: () => void;
  onVerify: () => void;
}

function DocumentRow({ document, canVerify, onDelete, onVerify }: DocumentRowProps) {
  const config = COMPANY_DOCUMENT_TYPE_CONFIG[document.type];
  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date();
  const isExpiringSoon =
    document.expiresAt &&
    new Date(document.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{document.fileName}</p>
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              {config?.label ?? document.type}
            </a>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {document.verified ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {document.expiresAt ? (
          <div className="flex items-center gap-2">
            {isExpired ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Expired
              </Badge>
            ) : isExpiringSoon ? (
              <Badge variant="warning" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {format(new Date(document.expiresAt), "MMM d, yyyy")}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {format(new Date(document.expiresAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(document.createdAt), "MMM d, yyyy")}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canVerify && !document.verified && (
              <DropdownMenuItem onClick={onVerify}>
                <Shield className="mr-2 h-4 w-4" />
                Verify
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CompanyDocumentsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

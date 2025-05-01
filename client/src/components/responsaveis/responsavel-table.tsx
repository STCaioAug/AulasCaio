import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
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

interface Responsavel {
  id: number;
  nome: string;
  telefone: string;
  whatsapp: string;
  alunos: Array<{ aluno: { id: number; nome: string } }>;
}

interface ResponsavelTableProps {
  responsaveis: Responsavel[];
  onEdit: (responsavel: Responsavel) => void;
}

export function ResponsavelTable({ responsaveis, onEdit }: ResponsavelTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [responsavelToDelete, setResponsavelToDelete] = React.useState<Responsavel | null>(null);

  // Mutação para deletar responsável
  const deleteResponsavelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/responsaveis/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis"] });
      toast({
        title: "Responsável removido",
        description: "O responsável foi removido com sucesso."
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o responsável: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleDeleteClick = (responsavel: Responsavel) => {
    setResponsavelToDelete(responsavel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (responsavelToDelete) {
      deleteResponsavelMutation.mutate(responsavelToDelete.id);
    }
  };

  // Formatar nome dos alunos
  const formatStudentNames = (alunos: Array<{ aluno: { id: number; nome: string } }>) => {
    return alunos.map(rel => rel.aluno.nome).join(", ");
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Responsável por</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responsaveis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  Nenhum responsável encontrado.
                </TableCell>
              </TableRow>
            ) : (
              responsaveis.map((responsavel) => (
                <TableRow key={responsavel.id}>
                  <TableCell className="font-medium">{responsavel.nome}</TableCell>
                  <TableCell>{responsavel.telefone}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {responsavel.alunos && responsavel.alunos.length > 0 
                      ? formatStudentNames(responsavel.alunos)
                      : <span className="text-gray-400">Nenhum aluno</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <a
                        href={responsavel.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(responsavel)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(responsavel)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o responsável{" "}
              <span className="font-medium">{responsavelToDelete?.nome}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteResponsavelMutation.isPending}
            >
              {deleteResponsavelMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

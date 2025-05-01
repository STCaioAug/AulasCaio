import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Função para gerar o PDF
export const exportToPDF = async (tipoRelatorio: string, alunoId?: string) => {
  try {
    const toast = { 
      toast: (data: any) => {
        console.log('Toast:', data);
        // Implementação fictícia para não precisar do hook dentro de função
        const toastEl = document.createElement('div');
        toastEl.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md z-50';
        toastEl.textContent = data.title + ': ' + data.description;
        document.body.appendChild(toastEl);
        setTimeout(() => {
          toastEl.remove();
        }, 3000);
      }
    };

    toast.toast({
      title: "PDF gerado",
      description: "O relatório foi gerado e está pronto para download."
    });

    setTimeout(() => {
      alert("Esta funcionalidade de exportação para PDF será implementada em uma versão futura. Por enquanto, esta é apenas uma simulação.");
    }, 1000);
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error);
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md z-50';
    toastEl.textContent = 'Erro ao gerar PDF';
    document.body.appendChild(toastEl);
    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  }
};

// Função para gerar PNG
export const exportToPNG = async (tipoRelatorio: string, alunoId?: string) => {
  try {
    const toast = { 
      toast: (data: any) => {
        console.log('Toast:', data);
        // Implementação fictícia para não precisar do hook dentro de função
        const toastEl = document.createElement('div');
        toastEl.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md z-50';
        toastEl.textContent = data.title + ': ' + data.description;
        document.body.appendChild(toastEl);
        setTimeout(() => {
          toastEl.remove();
        }, 3000);
      }
    };

    toast.toast({
      title: "PNG gerado",
      description: "O relatório foi gerado como imagem e está pronto para download."
    });

    setTimeout(() => {
      alert("Esta funcionalidade de exportação para PNG será implementada em uma versão futura. Por enquanto, esta é apenas uma simulação.");
    }, 1000);
  } catch (error) {
    console.error("Erro ao exportar para PNG:", error);
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md z-50';
    toastEl.textContent = 'Erro ao gerar PNG';
    document.body.appendChild(toastEl);
    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  }
};

// Função para gerar texto para WhatsApp
export const generateWhatsAppText = async (tipoRelatorio: string, alunoId?: string) => {
  try {
    let texto = "";

    // Verificar o tipo de relatório
    if (tipoRelatorio === "aluno" && alunoId) {
      // Buscar dados do aluno
      const response = await apiRequest("GET", `/api/alunos/${alunoId}`, undefined);
      const aluno = await response.json();

      // Formatar dados para texto do WhatsApp
      const formatAnoEscolar = (anoEscolar: string) => {
        switch (anoEscolar) {
          case '6_ano': return '6º Ano';
          case '7_ano': return '7º Ano';
          case '8_ano': return '8º Ano';
          case '9_ano': return '9º Ano';
          case '1_em': return '1º EM';
          case '2_em': return '2º EM';
          case '3_em': return '3º EM';
          case 'superior': return 'Ensino Superior';
          default: return anoEscolar;
        }
      };

      // Temas estudados
      const temasEstudados = aluno.temas
        ?.filter((tema: any) => tema.estudado)
        .map((tema: any) => tema.nome)
        .join(", ") || "Nenhum tema concluído ainda";

      // Próximas aulas
      const proximasAulas = aluno.aulas
        ?.filter((aula: any) => aula.status === "agendada" || aula.status === "confirmada")
        .map((aula: any) => {
          const data = new Date(aula.data);
          return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${aula.materia?.nome}`;
        })
        .join("\n") || "Nenhuma aula agendada";

      texto = `*Relatório: ${aluno.nome}*\n\n` +
        `*Ano Escolar:* ${formatAnoEscolar(aluno.anoEscolar)}\n\n` +
        `*Temas Estudados:*\n${temasEstudados}\n\n` +
        `*Próximas Aulas:*\n${proximasAulas}`;
    } else if (tipoRelatorio === "horarios") {
      // Buscar horários disponíveis
      const response = await apiRequest("GET", "/api/horarios-disponiveis", undefined);
      const horarios = await response.json();

      // Formatar dias da semana
      const formatDiaSemana = (dia: number) => {
        const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        return dias[dia] || `Dia ${dia}`;
      };

      // Formatando horários disponíveis
      const horariosFormatados = horarios
        .map((horario: any) => 
          `${formatDiaSemana(horario.diaSemana)}: ${horario.horaInicio} às ${horario.horaFim}`
        )
        .join("\n");

      texto = `*Horários Disponíveis*\n\n${horariosFormatados || "Nenhum horário disponível cadastrado"}`;
    } else if (tipoRelatorio === "financeiro") {
      texto = "*Relatório Financeiro*\n\nEsta funcionalidade estará disponível em breve.";
    } else {
      texto = "Tipo de relatório não suportado ou dados insuficientes.";
    }

    // Copiar para área de transferência
    await navigator.clipboard.writeText(texto);

    // Notificar usuário
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md z-50';
    toast.textContent = 'Texto copiado para a área de transferência!';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  } catch (error) {
    console.error("Erro ao gerar texto para WhatsApp:", error);
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md z-50';
    toastEl.textContent = 'Erro ao gerar texto para WhatsApp';
    document.body.appendChild(toastEl);
    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  }
};

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Receivable } from "@/hooks/useReceivables";
import { Payable } from "@/hooks/usePayables";

interface DREData {
  receivables: Receivable[];
  payables: Payable[];
  month: number;
  year: number;
  companyName?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function generateDREReport({ receivables, payables, month, year, companyName = "Empresa" }: DREData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Helper functions
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Calculate metrics
  const totalReceivables = receivables.reduce((sum, r) => sum + r.value, 0);
  const paidReceivables = receivables.filter(r => r.status === "paid");
  const totalReceived = paidReceivables.reduce((sum, r) => sum + (r.paid_value || r.value), 0);
  const pendingReceivables = receivables.filter(r => r.status === "pending");
  const totalPendingReceivables = pendingReceivables.reduce((sum, r) => sum + r.value, 0);

  const totalPayables = payables.reduce((sum, p) => sum + p.value, 0);
  const paidPayables = payables.filter(p => p.status === "paid");
  const totalPaid = paidPayables.reduce((sum, p) => sum + (p.paid_value || p.value), 0);
  const pendingPayables = payables.filter(p => p.status === "pending");
  const totalPendingPayables = pendingPayables.reduce((sum, p) => sum + p.value, 0);

  // Group payables by category
  const payablesByCategory = payables.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = { total: 0, paid: 0, items: [] };
    acc[p.category].total += p.value;
    if (p.status === "paid") acc[p.category].paid += p.paid_value || p.value;
    acc[p.category].items.push(p);
    return acc;
  }, {} as Record<string, { total: number; paid: number; items: Payable[] }>);

  const categoryLabels: Record<string, string> = {
    'fornecedor': 'Fornecedores',
    'servico': 'Serviços',
    'imposto': 'Impostos',
    'salario': 'Salários',
    'aluguel': 'Aluguel',
    'outros': 'Outros',
  };

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DEMONSTRAÇÃO DO RESULTADO", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`${MONTHS[month - 1]} de ${year}`, pageWidth / 2, 28, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(companyName, pageWidth / 2, 36, { align: "center" });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  let yPos = 55;

  // DRE Summary Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Período", 14, yPos);
  yPos += 8;

  const expectedBalance = totalReceivables - totalPayables;
  const realizedBalance = totalReceived - totalPaid;

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Previsto', 'Realizado']],
    body: [
      ['(+) Receitas Brutas', formatCurrency(totalReceivables), formatCurrency(totalReceived)],
      ['(-) Deduções e Custos', formatCurrency(totalPayables), formatCurrency(totalPaid)],
      ['(=) Resultado do Período', formatCurrency(expectedBalance), formatCurrency(realizedBalance)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 50, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index > 0) {
          const value = data.row.index === 2 ? 
            (data.column.index === 1 ? expectedBalance : realizedBalance) : 0;
          data.cell.styles.textColor = value >= 0 ? [22, 163, 74] : [220, 38, 38];
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Receivables Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Receitas", 14, yPos);
  yPos += 8;

  if (receivables.length > 0) {
    const receivablesData = receivables.map(r => [
      r.description,
      r.client_id ? 'Cliente' : '-',
      formatDate(r.due_date),
      r.status === 'paid' ? 'Recebido' : 'Pendente',
      formatCurrency(r.value),
      r.status === 'paid' ? formatCurrency(r.paid_value || r.value) : '-',
    ]);

    receivablesData.push([
      'TOTAL RECEITAS', '', '', '', 
      formatCurrency(totalReceivables),
      formatCurrency(totalReceived)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Tipo', 'Vencimento', 'Status', 'Valor', 'Recebido']],
      body: receivablesData,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === receivablesData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma receita registrada no período.", 14, yPos);
    yPos += 15;
  }

  // Check if need new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Payables Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Despesas por Categoria", 14, yPos);
  yPos += 8;

  if (payables.length > 0) {
    // Category summary
    const categoryData = Object.entries(payablesByCategory).map(([cat, data]) => [
      categoryLabels[cat] || cat,
      data.items.length.toString(),
      formatCurrency(data.total),
      formatCurrency(data.paid),
    ]);

    categoryData.push([
      'TOTAL DESPESAS', 
      payables.length.toString(), 
      formatCurrency(totalPayables),
      formatCurrency(totalPaid)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Qtd.', 'Previsto', 'Pago']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === categoryData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Check if need new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Detailed payables
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento das Despesas", 14, yPos);
    yPos += 8;

    const payablesData = payables.map(p => [
      p.description,
      categoryLabels[p.category] || p.category,
      p.supplier || '-',
      formatDate(p.due_date),
      p.status === 'paid' ? 'Pago' : 'Pendente',
      formatCurrency(p.value),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Categoria', 'Fornecedor', 'Vencimento', 'Status', 'Valor']],
      body: payablesData,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        5: { halign: 'right' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma despesa registrada no período.", 14, yPos);
    yPos += 15;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `DRE_${MONTHS[month - 1]}_${year}.pdf`;
  doc.save(fileName);
}

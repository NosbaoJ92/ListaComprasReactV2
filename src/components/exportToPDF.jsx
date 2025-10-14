import jsPDF from 'jspdf';

const exportToPDF = (historico) => {
  const doc = new jsPDF();
  doc.text('Histórico de Compras', 10, 10);
  historico.forEach((compra, index) => {
    doc.text(`${index + 1}. ${compra}`, 10, 20 + (index * 10));
  });
  doc.save('historico-compras.pdf');
};

const HistoricoCompras = ({ historico }) => {
  return (
    <div>
      <h2>Histórico de Compras</h2>
      <ul>
        {historico.map((compra, index) => (
          <li key={index}>{compra}</li>
        ))}
      </ul>
      <button onClick={() => exportToPDF(historico)}>Exportar para PDF</button>
    </div>
  );
};

export default HistoricoCompras;

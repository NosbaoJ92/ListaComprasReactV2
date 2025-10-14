import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Menu, MenuItem, IconButton, Switch, Modal, Box, Button, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';

const ValorMaximo = () => {
  const [produtos, setProdutos] = useState([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [valorMaximoConfirmado, setValorMaximoConfirmado] = useState(null);
  const [erro, setErro] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoTemp, setProdutoTemp] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [modoNoturno, setModoNoturno] = useState(false);

  const valorMaximoNumerico = parseFloat(valorMaximo) || 0;
  const valorMaximoConfirmadoNumerico = parseFloat(valorMaximoConfirmado) || 0;

  const handleAddProduto = () => {
    if (!nomeProduto || !valorProduto || !quantidadeProduto) {
      setErro('Por favor, preencha todos os campos.');
      setTimeout(() => setErro(''), 3000);
      return;
    }

    const novoProduto = {
      nome: nomeProduto,
      valor: parseFloat(valorProduto),
      quantidade: parseInt(quantidadeProduto),
      total: parseFloat(valorProduto) * parseInt(quantidadeProduto),
    };

    const totalAtual = calcularTotalCompra() - (editandoIndex !== null ? produtos[editandoIndex].total : 0);
    const novoTotalCompra = totalAtual + novoProduto.total;

    if (valorMaximoConfirmadoNumerico > 0 && novoTotalCompra > valorMaximoConfirmadoNumerico) {
      setProdutoTemp(novoProduto);
      setModalAberto(true);
      return;
    }

    if (editandoIndex !== null) {
      const produtosAtualizados = produtos.map((produto, index) =>
        index === editandoIndex ? novoProduto : produto
      );
      setProdutos(produtosAtualizados);
      setEditandoIndex(null);
    } else {
      setProdutos([...produtos, novoProduto]);
    }

    resetarCampos();
  };

  const handleEditProduto = (index) => {
    const produto = produtos[index];
    setNomeProduto(produto.nome);
    setValorProduto(produto.valor.toString());
    setQuantidadeProduto(produto.quantidade.toString());
    setEditandoIndex(index);
    setModalAberto(true);
  };

  const handleDeleteProduto = (index) => {
    const produtosAtualizados = produtos.filter((_, i) => i !== index);
    setProdutos(produtosAtualizados);
  };

  const handleIncrementarQuantidade = (index) => {
    const produtosAtualizados = produtos.map((produto, i) => {
      if (i === index) {
        return {
          ...produto,
          quantidade: produto.quantidade + 1,
          total: (produto.quantidade + 1) * produto.valor,
        };
      }
      return produto;
    });
    setProdutos(produtosAtualizados);
  };

  const handleDecrementarQuantidade = (index) => {
    const produtosAtualizados = produtos.map((produto, i) => {
      if (i === index && produto.quantidade > 1) {
        return {
          ...produto,
          quantidade: produto.quantidade - 1,
          total: (produto.quantidade - 1) * produto.valor,
        };
      }
      return produto;
    });
    setProdutos(produtosAtualizados);
  };

  const calcularTotalCompra = () => {
    return produtos.reduce((acc, produto) => acc + produto.total, 0);
  };

  const calcularValorRestante = () => {
    return valorMaximoConfirmadoNumerico - calcularTotalCompra();
  };

  const resetarCampos = () => {
    setNomeProduto('');
    setValorProduto('');
    setQuantidadeProduto('');
    setErro('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddProduto();
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Estipulação de Valor Máximo", 10, 10);

    const tableColumn = ["Nome", "Valor Unitário", "Quantidade", "Total"];
    const tableRows = produtos.map((produto) => [
      produto.nome,
      `R$ ${produto.valor.toFixed(2)}`,
      produto.quantidade,
      `R$ ${produto.total.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });

    const totalCompra = calcularTotalCompra().toFixed(2);
    const valorExcedente = (totalCompra > valorMaximoConfirmadoNumerico ? (totalCompra - valorMaximoConfirmadoNumerico).toFixed(2) : '0.00');
    doc.text(`Total da Compra: R$ ${totalCompra}`, 10, doc.lastAutoTable.finalY + 10);
    doc.text(`Valor Máximo: R$ ${valorMaximoConfirmadoNumerico.toFixed(2)}`, 10, doc.lastAutoTable.finalY + 20);
    doc.text(`Valor Excedente: R$ ${valorExcedente}`, 10, doc.lastAutoTable.finalY + 30);

    doc.save('valor-maximo.pdf');
  };

  const handleModalConfirmar = () => {
    if (produtoTemp) {
      if (editandoIndex !== null) {
        const produtosAtualizados = produtos.map((produto, index) =>
          index === editandoIndex ? produtoTemp : produto
        );
        setProdutos(produtosAtualizados);
        setEditandoIndex(null);
      } else {
        setProdutos((produtos) => [...produtos, produtoTemp]);
      }
      setProdutoTemp(null);
    }
    setModalAberto(false);
    resetarCampos();
  };

  const handleModalRevisar = () => {
    setModalAberto(false);
    setProdutoTemp(null);
  };

  const confirmarValorMaximo = () => {
    setValorMaximoConfirmado(valorMaximo);
    setValorMaximo('');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const alternarModoNoturno = () => {
    setModoNoturno(!modoNoturno);
  };

  return (
    <div className={`container mx-auto p-4 h-screen w-screen flex flex-col justify-between ${modoNoturno ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="flex w-full justify-between items-center mb-4">
        <IconButton onClick={handleMenuClick}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Switch checked={modoNoturno} onChange={alternarModoNoturno} /><p>Dark Mode</p>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Opção 2</MenuItem>
          <MenuItem onClick={handleMenuClose}>Opção 3</MenuItem>
        </Menu>
        <h1 className="text-xl font-bold">Estipular Valor Máximo de Gasto</h1>
        <div className='invisible'>
        <IconButton onClick={handleMenuClick}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Switch checked={modoNoturno} onChange={alternarModoNoturno} /><p>Dark Mode</p>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Opção 2</MenuItem>
          <MenuItem onClick={handleMenuClose}>Opção 3</MenuItem>
        </Menu>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-center">Valor Máximo (R$)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {valorMaximoConfirmado ? (
            <IconButton onClick={() => setValorMaximoConfirmado(null)}>
              <EditIcon />
            </IconButton>
          ) : (
            <div className='flex flex-wrap gap-2'>
              <input
                type="number"
                placeholder="Ex: 100.00"
                value={valorMaximo}
                onChange={(e) => setValorMaximo(e.target.value)}
                className={`border rounded-md p-2 flex-1 ${modoNoturno ? 'bg-gray-700 text-white' : 'text-black'}`}
              />
              <div className="flex w-full  justify-between gap-2">
                <button
                  onClick={confirmarValorMaximo}
                  className="bg-green-500 w-6/12 text-white rounded-md p-2 hover:bg-green-600"
                >
                  Confirmar Valor Máximo
                </button>
                {/* <button
                onClick={() => setValorMaximo('')}
                className="bg-red-500 w-6/12 text-white rounded-md p-2 hover:bg-red-600"
                >
                Cancelar
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>

      
      <div className="overflow-x-auto mb-4 h-full">
        <table className="w-full min-w-max table-auto">
          <thead>
            <tr className="bg-gray-300">
              <th className="px-4 py-2 border-2 border-black text-black">Nome</th>
              <th className="px-4 py-2 border-2 border-black text-black">Valor Unitário</th>
              <th className="px-4 py-2 border-2 border-black text-black">Quantidade</th>
              <th className="px-4 py-2 border-2 border-black text-black">Total</th>
              <th className="px-4 py-2 border-2 border-black text-black">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, index) => (
              <tr key={index} className="bg-white text-center border-b text-black">
                <td className="px-4 py-2 border-2 border-black">{produto.nome}</td>
                <td className="px-4 py-2 border-2 border-black">R$ {produto.valor.toFixed(2)}</td>
                <td className="p-2 py-2 border-2 border-black flex justify-between items-center">
                  <button
                    onClick={() => handleDecrementarQuantidade(index)}
                    className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600"
                  >
                    -
                  </button>
                  <span className="mx-2">{produto.quantidade}</span>
                  <button
                  onClick={() => handleIncrementarQuantidade(index)}
                  className="bg-green-500 text-white rounded-md p-2 hover:bg-green-600"
                  >
                  +
                  </button>
                </td>
                <td className="px-4 py-2 border-2 border-black">R$ {produto.total.toFixed(2)}</td>
                <td className="px-4 py-2 border-2 border-black">
                  <button 
                    onClick={() => handleEditProduto(index)} 
                    className="bg-yellow-500 text-white rounded-md p-2 hover:bg-yellow-600 mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProduto(index)}
                    className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-4 flex justify-center items-center">
        <Button variant="contained" color="primary" onClick={() => setModalAberto(true)}>
          Adicionar Produto
        </Button>
        {erro && <p className="text-red-500">{erro}</p>}
      </div>
      <div className="bg-yellow-100 p-4 rounded-md mb-4">
        <p className="text-yellow-800 font-bold text-center">Valor Máximo Confirmado: R$ {valorMaximoConfirmado}</p>
      </div>

      <div className="flex justify-around">
        <p>Total da Compra: R$ {calcularTotalCompra().toFixed(2)}</p>
        {valorMaximoConfirmado && (
          <p>
            {calcularTotalCompra() > valorMaximoConfirmadoNumerico ? (
              <span className="text-red-500">
                Excedeu o valor máximo em R$ {(calcularTotalCompra() - valorMaximoConfirmadoNumerico).toFixed(2)}
              </span>
            ) : (
              <>
                <span>Restante: R$ {calcularValorRestante().toFixed(2)}</span>
              </>
            )}
          </p>
        )}
      </div>

      <button
        onClick={gerarPDF}
        className="bg-blue-500 text-white rounded-md p-2 mt-4 hover:bg-blue-600"
      >
        Gerar PDF
      </button>

      <Modal
        open={modalAberto}
        onClose={handleModalRevisar}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box className="bg-white rounded p-4 max-w-sm mx-auto mt-40">
          <h2 id="modal-title" className="text-xl font-bold mb-4 text-black text-center">Adicionar Produto</h2>
          <TextField
            label="Nome do Produto"
            value={nomeProduto}
            onChange={(e) => setNomeProduto(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Valor do Produto"
            type="number"
            value={valorProduto}
            onChange={(e) => setValorProduto(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Quantidade"
            type="number"
            value={quantidadeProduto}
            onChange={(e) => setQuantidadeProduto(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button variant="contained" color="primary" onClick={handleAddProduto}>
              Confirmar
            </Button>
            <Button variant="contained" color="secondary" onClick={handleModalRevisar}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default ValorMaximo;

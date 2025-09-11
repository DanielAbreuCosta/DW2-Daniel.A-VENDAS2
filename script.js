// Dados em memória
let produtos = [];
let clientes = [];
let vendas = [];

const API_URL = 'http://localhost:3000/api';

// Funções de modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    if (modalId === 'vendaModal') {
        populateSelects();
    }
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Funções de formulário e integração backend
function setupFormListeners() {
    // Cadastro de produtos
    document.getElementById('produtoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const produto = {
            name: formData.get('nome'),
            price: parseFloat(formData.get('preco')),
            estoque: parseInt(formData.get('estoque')),
            descricao: formData.get('descricao') || ''
        };
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
            if (!res.ok) throw new Error('Erro ao cadastrar produto');
            await loadProdutos();
            e.target.reset();
            hideModal('produtoModal');
            updateStats();
            showSuccess('Produto cadastrado com sucesso!');
        } catch (err) {
            showError(err.message);
        }
    });

    // Cadastro de clientes (mantém local)
    document.getElementById('clienteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const cliente = {
            id: Date.now(),
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone') || '',
            endereco: formData.get('endereco') || ''
        };
        clientes.push(cliente);
        e.target.reset();
        hideModal('clienteModal');
        updateStats();
        showSuccess('Cliente cadastrado com sucesso!');
    });

    // Registro de vendas
    document.getElementById('vendaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const produtoId = parseInt(formData.get('produto'));
        const clienteId = parseInt(formData.get('cliente'));
        const quantidade = parseInt(formData.get('quantidade'));
        const data = formData.get('data');
        const produto = produtos.find(p => p.id === produtoId);
        const cliente = clientes.find(c => c.id === clienteId);
        if (!produto || !cliente) {
            showError('Produto ou cliente inválido!');
            return;
        }
        if (quantidade > 9999) {
            showError('Quantidade inválida!');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [{ produtoId, clienteId, quantidade, data }] })
            });
            if (!res.ok) throw new Error('Erro ao registrar venda');
            await loadVendas();
            e.target.reset();
            hideModal('vendaModal');
            updateStats();
            showSuccess('Venda registrada com sucesso!');
        } catch (err) {
            showError(err.message);
        }
    });
}

// Carregar produtos do backend
async function loadProdutos() {
    try {
        const res = await fetch(`${API_URL}/products`);
        produtos = await res.json();
        renderProdutosListaVisual();
    } catch {
        produtos = [];
        renderProdutosListaVisual();
    }
}

// Carregar vendas do backend
async function loadVendas() {
    try {
        const res = await fetch(`${API_URL}/sales`);
        vendas = await res.json();
    } catch {
        vendas = [];
    }
}

// Inicialização única
document.addEventListener('DOMContentLoaded', async function() {
    // Event listeners para botões de fechar
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        }
    });

    // Fechar modal ao clicar fora dele
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }

    // Definir data atual no campo de data
    const dataInput = document.querySelector('input[name="data"]');
    if (dataInput) {
        dataInput.valueAsDate = new Date();
    }

    // Event listeners para formulários
    setupFormListeners();

    // Carregar dados do backend
    await loadProdutos();
    await loadVendas();
    updateStats();
    renderProdutosListaVisual();
});


// Popular selects do modal de venda
function populateSelects() {
    const clienteSelect = document.getElementById('clienteSelect');
    const produtoSelect = document.getElementById('produtoSelect');
    
    // Limpar options existentes
    clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
    produtoSelect.innerHTML = '<option value="">Selecione um produto</option>';
    
    // Adicionar clientes
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        clienteSelect.appendChild(option);
    });
    
    // Adicionar produtos com estoque disponível
    produtos.filter(produto => produto.estoque > 0).forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.nome} (Estoque: ${produto.estoque}) - R$ ${produto.preco.toFixed(2)}`;
        produtoSelect.appendChild(option);
    });
}

// Renderizar lista visual de produtos
function renderProdutosListaVisual() {
    const container = document.getElementById('produtos-lista-container');
    if (!container) return;
    if (!produtos || produtos.length === 0) {
        container.innerHTML = '<p style="color:#888">Nenhum produto cadastrado ainda.</p>';
        return;
    }
    container.innerHTML = produtos.map(produto => `
        <div class="produto-card-visual">
            <div class="produto-nome">${produto.name || produto.nome}</div>
            <div class="produto-preco">Preço: R$ ${(produto.price || produto.preco).toFixed(2)}</div>
            <div class="produto-estoque">Estoque: ${produto.estoque !== undefined ? produto.estoque : '-'}</div>
            <div class="produto-desc">${produto.descricao || ''}</div>
        </div>
    `).join('');
}

// Atualizar estatísticas
function updateStats() {
    document.getElementById('totalProdutos').textContent = produtos.length;
    document.getElementById('totalClientes').textContent = clientes.length;
    document.getElementById('totalVendas').textContent = vendas.length;
    
    const faturamento = vendas.reduce((total, venda) => total + venda.total, 0);
    document.getElementById('faturamento').textContent = formatCurrency(faturamento);
}

// Formatar moeda
function formatCurrency(value) {
    return `R$ ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Funções de listagem
function showProductList() {
    if (produtos.length === 0) {
        showError('Nenhum produto cadastrado ainda.');
        return;
    }
    
    let lista = 'PRODUTOS CADASTRADOS:\n\n';
    produtos.forEach(produto => {
        lista += `• ${produto.nome}\n`;
        lista += `  Preço: ${formatCurrency(produto.preco)}\n`;
        lista += `  Estoque: ${produto.estoque} unidades\n`;
        if (produto.descricao) {
            lista += `  Descrição: ${produto.descricao}\n`;
        }
        lista += '\n';
    });
    
    showInfo(lista);
}

function showClientList() {
    if (clientes.length === 0) {
        showError('Nenhum cliente cadastrado ainda.');
        return;
    }
    
    let lista = 'CLIENTES CADASTRADOS:\n\n';
    clientes.forEach(cliente => {
        lista += `• ${cliente.nome}\n`;
        lista += `  Email: ${cliente.email}\n`;
        if (cliente.telefone) {
            lista += `  Telefone: ${cliente.telefone}\n`;
        }
        if (cliente.endereco) {
            lista += `  Endereço: ${cliente.endereco}\n`;
        }
        lista += '\n';
    });
    
    showInfo(lista);
}

function showSalesList() {
    if (vendas.length === 0) {
        showError('Nenhuma venda registrada ainda.');
        return;
    }
    
    let lista = 'VENDAS REGISTRADAS:\n\n';
    let totalGeral = 0;
    
    vendas.forEach(venda => {
        const cliente = clientes.find(c => c.id === venda.clienteId);
        const produto = produtos.find(p => p.id === venda.produtoId);
        
        if (cliente && produto) {
            lista += `• ${cliente.nome} - ${produto.nome}\n`;
            lista += `  Quantidade: ${venda.quantidade}\n`;
            lista += `  Valor Total: ${formatCurrency(venda.total)}\n`;
            lista += `  Data: ${formatDate(venda.data)}\n\n`;
            totalGeral += venda.total;
        }
    });
    
    lista += `FATURAMENTO TOTAL: ${formatCurrency(totalGeral)}`;
    showInfo(lista);
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Funções de notificação
function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function showInfo(message) {
    alert('ℹ️ ' + message);
}

// Função para limpar todos os dados (útil para desenvolvimento)
function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        produtos = [];
        clientes = [];
        vendas = [];
        updateStats();
        showSuccess('Todos os dados foram limpos!');
    }
}

// Função para exportar dados (básico)
function exportData() {
    const data = {
        produtos: produtos,
        clientes: clientes,
        vendas: vendas,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sistema-vendas-backup.json';
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccess('Dados exportados com sucesso!');
}


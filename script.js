// Variáveis globais
let pieChart;
let todosTestes = [];

// Função para mostrar detalhes do teste
function mostrarDetalhesTeste(testId) {
    const teste = todosTestes.find(t => t.id === testId);
    if (!teste) return;

    const modalBody = document.getElementById('detalhesTesteBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>ID:</strong> ${teste.id}</p>
                <p><strong>Nome:</strong> ${teste.nome}</p>
                <p><strong>Resultado:</strong> <span class="badge bg-${teste.resultado === 'APROVADO' ? 'success' : 'danger'}">${teste.resultado}</span></p>
            </div>
            <div class="col-md-6">
                <p><strong>Data:</strong> ${teste.data}</p>
                <p><strong>Hora:</strong> ${teste.hora}</p>
                <p><strong>Setor:</strong> ${teste.setor || 'N/A'}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Detalhes:</h6>
                <p>${teste.detalhes || 'Não há informações adicionais'}</p>
            </div>
        </div>
        <div class="row mt-2">
            <div class="col-12">
                <h6>Informações Completas:</h6>
                <pre class="bg-light p-3">${JSON.stringify(teste, null, 2)}</pre>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detalhesTesteModal'));
    modal.show();
}

// Função para criar item de histórico
function criarItemHistorico(test) {
    const item = document.createElement('div');
    item.className = 'history-item clickable-item';
    item.dataset.id = test.id;
    item.innerHTML = `
        <p><strong>ID:</strong> ${test.id}</p>
        <p><strong>Nome:</strong> ${test.nome}</p>
        <p><strong>Resultado:</strong> ${test.resultado}</p>
        <p><strong>Data:</strong> ${test.data}</p>
        <p><strong>Hora:</strong> ${test.hora}</p>
    `;
    
    // Adiciona o evento de clique a todo o item
    item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('no-click')) {
            mostrarDetalhesTeste(test.id);
        }
    });
    
    return item;
}

// Função para contar itens nas grids
function contarItensNasGrids() {
    const aprovados = document.querySelectorAll('.green-grid .history-item').length;
    const reprovados = document.querySelectorAll('.red-grid .history-item').length;
    return { aprovados, reprovados };
}

// Função para atualizar o gráfico de pizza
function atualizarGraficoPizza() {
    const { aprovados, reprovados } = contarItensNasGrids();
    const ctx = document.getElementById('pieChart').getContext('2d');

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Aprovados', 'Reprovados'],
            datasets: [{
                data: [aprovados, reprovados],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Função para atualizar os indicadores
function atualizarIndicadores() {
    const { aprovados, reprovados } = contarItensNasGrids();
    document.querySelector('.stat-box.green h4').textContent = aprovados;
    document.querySelector('.stat-box.red h4').textContent = reprovados;
}

// Função para exibir testes nas grids
function exibirTestesNasGrids(testes) {
    const greenGrid = document.querySelector('.green-grid');
    const redGrid = document.querySelector('.red-grid');
    
    greenGrid.innerHTML = '';
    redGrid.innerHTML = '';

    const idsProcessados = new Set();

    testes.forEach(test => {
        if (!idsProcessados.has(test.id)) {
            idsProcessados.add(test.id);
            const grid = test.resultado === 'APROVADO' ? greenGrid : redGrid;
            grid.appendChild(criarItemHistorico(test));
        }
    });

    atualizarGraficoPizza();
    atualizarIndicadores();
}

// Função para carregar testes do arquivo
async function carregarTestes() {
    try {
        const response = await fetch('testes.txt');
        if (!response.ok) throw new Error('Erro ao carregar arquivo');
        
        const data = await response.text();
        const linhas = data.split('\n').filter(linha => linha.trim() !== '');
        
        todosTestes = linhas.map(linha => {
            const [id, nome, resultado, data, hora, detalhes, setor] = linha.split('|');
            return {
                id: id.trim(),
                nome: nome.trim(),
                resultado: resultado.trim(),
                data: data.trim(),
                hora: hora.trim(),
                detalhes: detalhes?.trim(),
                setor: setor?.trim()
            };
        });

        // Exibir na lista de últimos testes
        const testList = document.querySelector('.test-list');
        testList.innerHTML = todosTestes.map(test => `
            <p class="no-click">
                <strong>ID:</strong> ${test.id}<br>
                <strong>Nome:</strong> ${test.nome}<br>
                <strong>Resultado:</strong> ${test.resultado}<br>
                <strong>Data:</strong> ${test.data}<br>
                <strong>Hora:</strong> ${test.hora}<br>
                <strong>Detalhes:</strong> ${test.detalhes || 'N/A'}
            </p>
        `).join('');

        exibirTestesNasGrids(todosTestes);
    } catch (error) {
        console.error('Erro:', error);
        document.querySelector('.test-list').innerHTML = '<p>Erro ao carregar os testes.</p>';
    }
}

// Função para filtrar resultados
function filtrarResultados() {
    const filtroResultado = document.getElementById('filtroResultado').value;
    const filtroData = document.getElementById('filtroData').value;

    let testesFiltrados = todosTestes;

    if (filtroResultado !== 'todos') {
        const resultadoDesejado = filtroResultado === 'aprovados' ? 'APROVADO' : 'REPROVADO';
        testesFiltrados = testesFiltrados.filter(t => t.resultado === resultadoDesejado);
    }

    if (filtroData) {
        testesFiltrados = testesFiltrados.filter(t => {
            const [dia, mes, ano] = t.data.split('/');
            const dataTeste = `${ano}-${mes}-${dia}`;
            return dataTeste === filtroData;
        });
    }

    if (testesFiltrados.length === 0) {
        alert('Nenhum resultado encontrado para os filtros selecionados.');
    }

    exibirTestesNasGrids(testesFiltrados);
}

// Função para resetar filtros
function resetarFiltros() {
    document.getElementById('filtroResultado').value = 'todos';
    document.getElementById('filtroData').value = '';
    exibirTestesNasGrids(todosTestes);
}

// Event listeners
document.getElementById('btnFiltrar').addEventListener('click', filtrarResultados);
document.querySelector('.btn-light').addEventListener('click', resetarFiltros);

// Inicialização
document.addEventListener('DOMContentLoaded', carregarTestes);
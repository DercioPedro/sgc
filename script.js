       // Variáveis globais
        let dados = {
            produtos: [],
            vendas: [],
            despesas: [],
            movimentacoes: []
        };

        let chartMaisVendidos = null;
        let chartVendas7Dias = null;

        // Funções de atualização de lista (declaradas primeiro)
        function atualizarListaProdutos() {
            const tbody = document.getElementById('listaProdutos');
            if (!tbody) return;
            tbody.innerHTML = '';

            dados.produtos.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
    <td>${p.nome}</td>
    <td>${p.categoria || '-'}</td>
    <td class="text-right">MT${p.precoCompra.toFixed(2)}</td>
    <td class="text-right">MT${p.precoVenda.toFixed(2)}</td>
    <td class="text-right MT{p.quantidade < 10 ? 'low-stock' : ''}">${p.quantidade}</td>
    <td class="text-right text-green">MT${(p.precoVenda - p.precoCompra).toFixed(2)}</td>
    <td class="text-center">
        <button class="btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem"
            onclick="confirmarRemocaoProduto(${p.id})">
            Remover
        </button>
    </td>
`;

                tbody.appendChild(tr);
            });
        }

        function atualizarListaVendas() {
            const tbody = document.getElementById('listaVendas');
            if (!tbody) return;
            tbody.innerHTML = '';

            [...dados.vendas].reverse().forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(v.data).toLocaleString('pt-PT')}</td>
                    <td>${v.nomeProduto}</td>
                    <td class="text-right">${v.quantidade}</td>
                    <td class="text-right">MT${v.precoUnitario.toFixed(2)}</td>
                    <td class="text-right"><strong>MT${v.valorTotal.toFixed(2)}</strong></td>
                    <td class="text-right text-green"><strong>MT${v.lucro.toFixed(2)}</strong></td>
                `;
                tbody.appendChild(tr);
            });
        }

        function confirmarRemocaoProduto(produtoId) {
            const produto = dados.produtos.find(p => p.id === produtoId);
            if (!produto) {
                alert('Produto não encontrado!');
                return;
            }

            const confirmar = confirm(
                `⚠️ ATENÇÃO!\n\nDeseja realmente remover o produto:\n"${produto.nome}"?\n\n` +
                `Esta ação irá remover também vendas e movimentações relacionadas.`
            );

            if (!confirmar) return;

            removerProduto(produtoId);
        }


        function removerProduto(produtoId) {
            // Remove produto
            dados.produtos = dados.produtos.filter(p => p.id !== produtoId);

            // Remove vendas associadas
            dados.vendas = dados.vendas.filter(v => v.produtoId !== produtoId);

            // Remove movimentações associadas
            dados.movimentacoes = dados.movimentacoes.filter(m => m.produtoId !== produtoId);

            salvarDados();

            alert('✅ Produto removido com sucesso!');
        }


        function atualizarListaDespesas() {
            const tbody = document.getElementById('listaDespesas');
            if (!tbody) return;
            tbody.innerHTML = '';

            [...dados.despesas].reverse().forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(d.data).toLocaleString('pt-PT')}</td>
                    <td>${d.descricao}</td>
                    <td>${d.categoria || '-'}</td>
                    <td class="text-right text-red"><strong>€${d.valor.toFixed(2)}</strong></td>
                `;
                tbody.appendChild(tr);
            });
        }

        function atualizarListaMovimentacoes() {
            const tbody = document.getElementById('listaMovimentacoes');
            if (!tbody) return;
            tbody.innerHTML = '';

            [...dados.movimentacoes].reverse().forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(m.data).toLocaleString('pt-PT')}</td>
                    <td>${m.nomeProduto}</td>
                    <td class="text-center">
                        <span class="badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}">
                            ${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                    </td>
                    <td class="text-right"><strong>${m.quantidade}</strong></td>
                    <td>${m.motivo}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function exportarPDF() {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            pdf.text('Relatório de Vendas', 10, 10);
            let y = 20;

            dados.vendas.forEach(v => {
                pdf.text(`${v.nomeProduto} | Qtd: ${v.quantidade} | MT${v.valorTotal}`, 10, y);
                y += 8;
            });

            pdf.save('relatorio_vendas.pdf');
        }


        function atualizarSelects() {
            const selectVenda = document.getElementById('vendaProduto');
            const selectMov = document.getElementById('movProduto');

            if (selectVenda) {
                selectVenda.innerHTML = '<option value="">Selecione um produto</option>';
                dados.produtos.forEach(p => {
                    if (p.quantidade > 0) {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = `${p.nome} (Stock: ${p.quantidade})`;
                        selectVenda.appendChild(option);
                    }
                });
            }

            if (selectMov) {
                selectMov.innerHTML = '<option value="">Selecione um produto</option>';
                dados.produtos.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.nome;
                    selectMov.appendChild(option);
                });
            }
        }

        function calcularFluxoCaixa() {
            const totalVendas = dados.vendas.reduce((acc, v) => acc + v.valorTotal, 0);
            const totalDespesas = dados.despesas.reduce((acc, d) => acc + d.valor, 0);
            const lucroTotal = dados.vendas.reduce((acc, v) => acc + v.lucro, 0);

            return {
                entradas: totalVendas,
                saidas: totalDespesas,
                saldo: totalVendas - totalDespesas,
                lucro: lucroTotal
            };
        }

        function atualizarStockBaixo() {
            const container = document.getElementById('stockBaixo');
            if (!container) return;

            const produtosBaixo = dados.produtos.filter(p => p.quantidade < 10);

            if (produtosBaixo.length > 0) {
                container.innerHTML = `
                    <h3 style="margin-bottom: 1rem;">⚠️ Produtos com Stock Baixo</h3>
                    ${produtosBaixo.slice(0, 5).map(p => `
                        <div class="alert alert-warning">
                            <strong>${p.nome}</strong> - Stock: ${p.quantidade} unidades
                        </div>
                    `).join('')}
                `;
            } else {
                container.innerHTML = '<p style="color: #10b981;">✓ Todos os produtos com stock adequado</p>';
            }
        }

        function atualizarGraficoMaisVendidos() {
            const vendasPorProduto = {};
            dados.vendas.forEach(v => {
                if (!vendasPorProduto[v.nomeProduto]) {
                    vendasPorProduto[v.nomeProduto] = 0;
                }
                vendasPorProduto[v.nomeProduto] += v.quantidade;
            });

            const maisVendidos = Object.entries(vendasPorProduto)
                .map(([nome, quantidade]) => ({ nome, quantidade }))
                .sort((a, b) => b.quantidade - a.quantidade)
                .slice(0, 5);

            const canvas = document.getElementById('chartMaisVendidos');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (chartMaisVendidos) {
                chartMaisVendidos.destroy();
            }

            if (maisVendidos.length > 0) {
                chartMaisVendidos = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: maisVendidos.map(p => p.nome),
                        datasets: [{
                            label: 'Quantidade Vendida',
                            data: maisVendidos.map(p => p.quantidade),
                            backgroundColor: [
                                '#3b82f6',
                                '#10b981',
                                '#f59e0b',
                                '#ef4444',
                                '#8b5cf6'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            } else {
                canvas.parentElement.innerHTML = '<p class="text-center" style="padding: 2rem; color: #6b7280;">Nenhuma venda registrada ainda</p>';
            }
        }

        function atualizarDashboard() {
            const fluxoCaixa = calcularFluxoCaixa();

            const elTotalProdutos = document.getElementById('totalProdutos');
            const elTotalVendas = document.getElementById('totalVendas');
            const elTotalDespesas = document.getElementById('totalDespesas');
            const elSaldo = document.getElementById('saldo');

            if (elTotalProdutos) elTotalProdutos.textContent = dados.produtos.length;
            if (elTotalVendas) elTotalVendas.textContent = `MT${fluxoCaixa.entradas.toFixed(2)}`;
            if (elTotalDespesas) elTotalDespesas.textContent = `MT${fluxoCaixa.saidas.toFixed(2)}`;
            if (elSaldo) elSaldo.textContent = `MT${fluxoCaixa.saldo.toFixed(2)}`;

            atualizarStockBaixo();
            atualizarGraficoMaisVendidos();
        }

        function atualizarResumoFinanceiro() {
            const fluxoCaixa = calcularFluxoCaixa();

            const elResumoEntradas = document.getElementById('resumoEntradas');
            const elResumoSaidas = document.getElementById('resumoSaidas');
            const elResumoSaldo = document.getElementById('resumoSaldo');

            if (elResumoEntradas) elResumoEntradas.textContent = `MT${fluxoCaixa.entradas.toFixed(2)}`;
            if (elResumoSaidas) elResumoSaidas.textContent = `MT${fluxoCaixa.saidas.toFixed(2)}`;
            if (elResumoSaldo) elResumoSaldo.textContent = `MT${fluxoCaixa.saldo.toFixed(2)}`;
        }

        function obterRelatorioVendas(periodo) {
            const agora = new Date();
            const vendasFiltradas = dados.vendas.filter(v => {
                const dataVenda = new Date(v.data);
                if (periodo === 'diario') {
                    return dataVenda.toDateString() === agora.toDateString();
                } else if (periodo === 'semanal') {
                    const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return dataVenda >= umaSemanaAtras;
                } else if (periodo === 'mensal') {
                    return dataVenda.getMonth() === agora.getMonth() &&
                        dataVenda.getFullYear() === agora.getFullYear();
                }
                return true;
            });

            const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.valorTotal, 0);
            const lucro = vendasFiltradas.reduce((acc, v) => acc + v.lucro, 0);

            return {
                vendas: vendasFiltradas,
                totalVendas,
                lucro,
                quantidade: vendasFiltradas.length
            };
        }

        function atualizarRelatorios() {
            const relDiario = obterRelatorioVendas('diario');
            const relSemanal = obterRelatorioVendas('semanal');
            const relMensal = obterRelatorioVendas('mensal');

            const elRelDiarioQtd = document.getElementById('relDiarioQtd');
            const elRelDiarioTotal = document.getElementById('relDiarioTotal');
            const elRelDiarioLucro = document.getElementById('relDiarioLucro');

            if (elRelDiarioQtd) elRelDiarioQtd.textContent = relDiario.quantidade;
            if (elRelDiarioTotal) elRelDiarioTotal.textContent = `MT${relDiario.totalVendas.toFixed(2)}`;
            if (elRelDiarioLucro) elRelDiarioLucro.textContent = `MT${relDiario.lucro.toFixed(2)}`;

            const elRelSemanalQtd = document.getElementById('relSemanalQtd');
            const elRelSemanalTotal = document.getElementById('relSemanalTotal');
            const elRelSemanalLucro = document.getElementById('relSemanalLucro');

            if (elRelSemanalQtd) elRelSemanalQtd.textContent = relSemanal.quantidade;
            if (elRelSemanalTotal) elRelSemanalTotal.textContent = `MT${relSemanal.totalVendas.toFixed(2)}`;
            if (elRelSemanalLucro) elRelSemanalLucro.textContent = `MT${relSemanal.lucro.toFixed(2)}`;

            const elRelMensalQtd = document.getElementById('relMensalQtd');
            const elRelMensalTotal = document.getElementById('relMensalTotal');
            const elRelMensalLucro = document.getElementById('relMensalLucro');

            if (elRelMensalQtd) elRelMensalQtd.textContent = relMensal.quantidade;
            if (elRelMensalTotal) elRelMensalTotal.textContent = `MT${relMensal.totalVendas.toFixed(2)}`;
            if (elRelMensalLucro) elRelMensalLucro.textContent = `MT${relMensal.lucro.toFixed(2)}`;

            atualizarGraficoVendas7Dias();
        }

        function atualizarGraficoVendas7Dias() {
            const dados7Dias = Array.from({ length: 7 }, (_, i) => {
                const data = new Date();
                data.setDate(data.getDate() - (6 - i));
                const vendasDia = dados.vendas.filter(v =>
                    new Date(v.data).toDateString() === data.toDateString()
                );
                const total = vendasDia.reduce((acc, v) => acc + v.valorTotal, 0);
                return {
                    dia: data.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit' }),
                    vendas: total
                };
            });

            const canvas = document.getElementById('chartVendas7Dias');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (chartVendas7Dias) {
                chartVendas7Dias.destroy();
            }

            chartVendas7Dias = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dados7Dias.map(d => d.dia),
                    datasets: [{
                        label: 'Vendas (MT)',
                        data: dados7Dias.map(d => d.vendas),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return 'Vendas: MT' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return 'MT' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarTela() {
            atualizarListaProdutos();
            atualizarListaVendas();
            atualizarListaDespesas();
            atualizarListaMovimentacoes();
            atualizarSelects();
            atualizarDashboard();
            atualizarResumoFinanceiro();
        }

        // Funções de dados
        function carregarDados() {
            const dadosSalvos = localStorage.getItem('gestaoComercial');
            if (dadosSalvos) {
                dados = JSON.parse(dadosSalvos);
            }
            atualizarTela();
        }

        function salvarDados() {
            localStorage.setItem('gestaoComercial', JSON.stringify(dados));
            atualizarTela();
        }

        // Funções de interface
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            const tabContent = document.getElementById(tabName);
            if (tabContent) {
                tabContent.classList.add('active');
            }

            event.target.classList.add('active');

            if (tabName === 'dashboard') {
                atualizarDashboard();
            } else if (tabName === 'relatorios') {
                atualizarRelatorios();
            }
        }

        // Funções de cadastro
        function adicionarProduto() {
            const nome = document.getElementById('produtoNome').value;
            const categoria = document.getElementById('produtoCategoria').value;
            const precoCompra = parseFloat(document.getElementById('produtoPrecoCompra').value);
            const precoVenda = parseFloat(document.getElementById('produtoPrecoVenda').value);
            const quantidade = parseInt(document.getElementById('produtoQuantidade').value) || 0;

            if (!nome || !precoCompra || !precoVenda) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }

            const produto = {
                id: Date.now(),
                nome,
                categoria,
                precoCompra,
                precoVenda,
                quantidade,
                dataCadastro: new Date().toISOString()
            };

            dados.produtos.push(produto);
            salvarDados();

            document.getElementById('produtoNome').value = '';
            document.getElementById('produtoCategoria').value = '';
            document.getElementById('produtoPrecoCompra').value = '';
            document.getElementById('produtoPrecoVenda').value = '';
            document.getElementById('produtoQuantidade').value = '';

            alert('Produto cadastrado com sucesso!');
        }

        function registrarVenda() {
            const produtoId = parseInt(document.getElementById('vendaProduto').value);
            const quantidade = parseInt(document.getElementById('vendaQuantidade').value);

            if (!produtoId || !quantidade) {
                alert('Selecione um produto e informe a quantidade!');
                return;
            }

            const produto = dados.produtos.find(p => p.id === produtoId);
            if (!produto) {
                alert('Produto não encontrado!');
                return;
            }

            if (produto.quantidade < quantidade) {
                alert('Stock insuficiente!');
                return;
            }

            const venda = {
                id: Date.now(),
                produtoId: produto.id,
                nomeProduto: produto.nome,
                quantidade,
                precoUnitario: produto.precoVenda,
                valorTotal: produto.precoVenda * quantidade,
                lucro: (produto.precoVenda - produto.precoCompra) * quantidade,
                data: new Date().toISOString()
            };

            dados.vendas.push(venda);
            produto.quantidade -= quantidade;

            dados.movimentacoes.push({
                id: Date.now(),
                produtoId: produto.id,
                nomeProduto: produto.nome,
                tipo: 'saida',
                quantidade,
                motivo: 'Venda',
                data: new Date().toISOString()
            });

            salvarDados();

            document.getElementById('vendaProduto').value = '';
            document.getElementById('vendaQuantidade').value = '';

            alert('Venda registrada com sucesso!');
        }

        function registrarDespesa() {
            const descricao = document.getElementById('despesaDescricao').value;
            const valor = parseFloat(document.getElementById('despesaValor').value);
            const categoria = document.getElementById('despesaCategoria').value;

            if (!descricao || !valor) {
                alert('Preencha os campos obrigatórios!');
                return;
            }

            const despesa = {
                id: Date.now(),
                descricao,
                valor,
                categoria,
                data: new Date().toISOString()
            };

            dados.despesas.push(despesa);
            salvarDados();

            document.getElementById('despesaDescricao').value = '';
            document.getElementById('despesaValor').value = '';
            document.getElementById('despesaCategoria').value = '';

            alert('Despesa registrada com sucesso!');
        }

        function removerProdutoPorNome(nomeProduto) {
            const index = dados.produtos.findIndex(p =>
                p.nome.toLowerCase() === nomeProduto.toLowerCase()
            );

            if (index === -1) {
                console.log('❌ Produto não encontrado');
                return;
            }

            const produto = dados.produtos[index];

            // Remove vendas relacionadas
            dados.vendas = dados.vendas.filter(v => v.produtoId !== produto.id);

            // Remove movimentações relacionadas
            dados.movimentacoes = dados.movimentacoes.filter(m => m.produtoId !== produto.id);

            // Remove o produto
            dados.produtos.splice(index, 1);

            salvarDados();

            console.log(`✅ Produto "${produto.nome}" removido com sucesso`);
        }

        function exportarExcel() {
            let csv = 'Data,Produto,Quantidade,Total\n';
            dados.vendas.forEach(v => {
                csv += `${v.data},${v.nomeProduto},${v.quantidade},${v.valorTotal}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'relatorio_vendas.csv';
            link.click();
        }

        // ===== LOGIN =====

        // credenciais (uso particular)
        const USUARIO = 'LUISHORACIO';
        const SENHA = '4321';

        // verificar sessão ao carregar
        function verificarLogin() {
            const logado = localStorage.getItem('usuarioLogado');

            if (logado === 'true') {
                document.getElementById('login').style.display = 'none';
                document.getElementById('app').style.display = 'block';
                carregarDados();
            } else {
                document.getElementById('login').style.display = 'flex';
                document.getElementById('app').style.display = 'none';
            }
        }

        // login
        function login() {
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;

            if (user === USUARIO && pass === SENHA) {
                localStorage.setItem('usuarioLogado', 'true');
                verificarLogin();
            } else {
                document.getElementById('loginErro').style.display = 'block';
            }
        }

        // logout
        function logout() {
            if (!confirm('Deseja sair do sistema?')) return;
            localStorage.removeItem('usuarioLogado');
            location.reload();
        }




        function registrarMovimentacao() {
            const produtoId = parseInt(document.getElementById('movProduto').value);
            const tipo = document.getElementById('movTipo').value;
            const quantidade = parseInt(document.getElementById('movQuantidade').value);
            const motivo = document.getElementById('movMotivo').value;

            if (!produtoId || !quantidade) {
                alert('Preencha todos os campos!');
                return;
            }

            const produto = dados.produtos.find(p => p.id === produtoId);
            if (!produto) {
                alert('Produto não encontrado!');
                return;
            }

            if (tipo === 'saida' && produto.quantidade < quantidade) {
                alert('Stock insuficiente!');
                return;
            }

            const movimentacao = {
                id: Date.now(),
                produtoId: produto.id,
                nomeProduto: produto.nome,
                tipo,
                quantidade,
                motivo,
                data: new Date().toISOString()
            };

            dados.movimentacoes.push(movimentacao);

            if (tipo === 'entrada') {
                produto.quantidade += quantidade;
            } else {
                produto.quantidade -= quantidade;
            }

            salvarDados();

            document.getElementById('movProduto').value = '';
            document.getElementById('movQuantidade').value = '';
            document.getElementById('movMotivo').value = '';

            alert('Movimentação registrada com sucesso!');
        }

        window.onload = function () {
            verificarLogin();

        };


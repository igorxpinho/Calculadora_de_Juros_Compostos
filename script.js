let chartInstance = null;

// Função para formatar números no padrão brasileiro (ex.: 2.325.785,40)
function formatNumber(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função para converter entrada do usuário para número (lida com vírgulas)
function parseInput(value) {
    const cleanedValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedValue) || 0;
}

// Função para calcular a diferença em meses entre duas datas
function calculateMonthsBetweenDates(startDate, endDate) {
    const start = new Date(startDate.split('/').reverse().join('-'));
    const end = new Date(endDate.split('/').reverse().join('-'));
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(0, months);
}

// Função para calcular a duração em anos para exibição
function calculateYearsBetweenDates(startDate, endDate) {
    return Math.floor(calculateMonthsBetweenDates(startDate, endDate) / 12);
}

// Função para calcular a data final com base na data inicial e na duração
function calculateEndDate(startDate, years) {
    const start = new Date(startDate.split('/').reverse().join('-'));
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + years);
    return `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
}

// Validar inputs numéricos
function validateInput(input, minValue = 0) {
    input.addEventListener('input', () => {
        const value = parseInput(input.value);
        input.classList.toggle('error', isNaN(value) || value < minValue);
    });
}

// Validar formato de data (dd/mm/aaaa)
function validateDateInput(input) {
    input.addEventListener('input', () => {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        const isValid = regex.test(input.value);
        input.classList.toggle('error', !isValid);
        if (isValid) {
            const [day, month, year] = input.value.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            const isValidDate = date.getDate() === day && date.getMonth() + 1 === month && date.getFullYear() === year;
            input.classList.toggle('error', !isValidDate);
        }
    });
}

// Função para limpar os resultados
function clearResults() {
    document.getElementById('result').style.display = 'none';
    document.getElementById('totalFinal').textContent = 'R$ 0,00';
    document.getElementById('totalInvestido').textContent = 'R$ 0,00';
    document.getElementById('totalJuros').textContent = 'R$ 0,00';
    document.getElementById('rendaMensal').textContent = 'R$ 0,00';
    document.getElementById('detailsTableBody').innerHTML = '';
    document.getElementById('detailsTable').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'none';
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    document.getElementById('exportBtn').style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Validar inputs do formulário Clássico
    validateInput(document.getElementById('classicInitialValue'));
    validateInput(document.getElementById('classicMonthlyContribution'));
    validateInput(document.getElementById('classicInterestRate'));
    validateInput(document.getElementById('classicPeriod'), 1);

    // Validar inputs do formulário Variável
    validateInput(document.getElementById('variableInitialValue'));
    validateDateInput(document.getElementById('variableStartDate'));
    validateInput(document.getElementById('newDuration'), 1);
    validateInput(document.getElementById('newContribution'));
    validateInput(document.getElementById('newInterestRate'));

    // Alternar entre modos
    const classicModeBtn = document.getElementById('classicModeBtn');
    const variableModeBtn = document.getElementById('variableModeBtn');
    const classicForm = document.getElementById('classicForm');
    const variableForm = document.getElementById('variableForm');

    classicModeBtn.addEventListener('click', () => {
        clearResults();
        classicModeBtn.classList.add('active');
        variableModeBtn.classList.remove('active');
        classicForm.style.display = 'flex';
        variableForm.style.display = 'none';
    });

    variableModeBtn.addEventListener('click', () => {
        clearResults();
        variableModeBtn.classList.add('active');
        classicModeBtn.classList.remove('active');
        variableForm.style.display = 'flex';
        classicForm.style.display = 'none';
    });

    // Botão Voltar
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back(); // Volta para a página anterior no histórico do navegador
    });

    // Gerenciar a tabela de períodos
    const periodsTable = document.getElementById('periodsTable');
    const periodsTableBody = document.getElementById('periodsTableBody');
    const startDateInput = document.getElementById('variableStartDate');
    let periods = [];

    document.getElementById('addPeriodBtn').addEventListener('click', () => {
        const startDate = startDateInput.value;
        const duration = parseInt(document.getElementById('newDuration').value);
        const contribution = parseInput(document.getElementById('newContribution').value);
        const interestRate = parseInput(document.getElementById('newInterestRate').value);

        // Validações
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(startDate)) {
            alert('A data inicial deve estar no formato dd/mm/aaaa.');
            return;
        }

        if (isNaN(duration) || duration < 1) {
            alert('A duração do investimento deve ser um número maior que 0.');
            return;
        }

        if (isNaN(contribution) || contribution < 0) {
            alert('O aporte mensal deve ser um número válido e não negativo.');
            return;
        }

        if (isNaN(interestRate) || interestRate < 0) {
            alert('A taxa de juros deve ser um número válido e não negativo.');
            return;
        }

        // Calcular a data final
        const endDate = calculateEndDate(periods.length === 0 ? startDate : periods[periods.length - 1].endDate, duration);

        // Adicionar o período à lista
        periods.push({ startDate: periods.length === 0 ? startDate : periods[periods.length - 1].endDate, endDate, contribution, interestRate });

        // Atualizar a tabela
        const years = calculateYearsBetweenDates(periods[periods.length - 1].startDate, endDate);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Recorrente</td>
            <td>${periods[periods.length - 1].startDate} (por ${years} anos)</td>
            <td>R$ ${formatNumber(contribution)}/mês</td>
            <td>${formatNumber(interestRate)}%</td>
            <td>
                <button type="button" class="edit-btn">Editar</button>
                <button type="button" class="remove-btn">Excluir</button>
            </td>
        `;
        periodsTableBody.appendChild(row);
        periodsTable.style.display = 'table';

        // Limpar os campos
        document.getElementById('newDuration').value = '';
        document.getElementById('newContribution').value = '';
        document.getElementById('newInterestRate').value = '';

        // Adicionar eventos de edição e remoção
        row.querySelector('.edit-btn').addEventListener('click', () => {
            const index = periods.findIndex(p => p.endDate === endDate && p.contribution === contribution && p.interestRate === interestRate);
            if (index !== -1) {
                document.getElementById('newDuration').value = calculateYearsBetweenDates(periods[index].startDate, periods[index].endDate);
                document.getElementById('newContribution').value = formatNumber(periods[index].contribution);
                document.getElementById('newInterestRate').value = formatNumber(periods[index].interestRate);
                periods.splice(index, 1);
                row.remove();
                if (periods.length === 0) {
                    periodsTable.style.display = 'none';
                }
            }
        });

        row.querySelector('.remove-btn').addEventListener('click', () => {
            const index = periods.findIndex(p => p.endDate === endDate && p.contribution === contribution && p.interestRate === interestRate);
            if (index !== -1) {
                periods.splice(index, 1);
                row.remove();
                if (periods.length === 0) {
                    periodsTable.style.display = 'none';
                }
            }
        });
    });

    // Lógica para Aportes Variáveis
    document.getElementById('variableForm').addEventListener('submit', e => {
        e.preventDefault();

        const initialValue = parseInput(document.getElementById('variableInitialValue').value);
        const startDate = document.getElementById('variableStartDate').value;

        // Validações
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(startDate)) {
            alert('A data inicial deve estar no formato dd/mm/aaaa.');
            return;
        }

        if (periods.length === 0) {
            alert('Adicione pelo menos um período antes de calcular.');
            return;
        }

        const { montante, totalMonths, periodResults } = calculateCompoundInterestVariable(initialValue, periods);
        const totalInvestido = initialValue + periods.reduce((sum, p, i) => sum + (p.contribution * periodResults[i].months), 0);
        const jurosGanhos = montante - totalInvestido;
        const rendaMensal = calculateMonthlyRetirementIncome(montante);
        const totalYears = Math.ceil(totalMonths / 12);

        // Exibir resultados
        document.getElementById('result').style.display = 'flex';
        document.getElementById('totalFinal').textContent = `R$ ${formatNumber(montante)}`;
        document.getElementById('totalInvestido').textContent = `R$ ${formatNumber(totalInvestido)}`;
        document.getElementById('totalJuros').textContent = `R$ ${formatNumber(jurosGanhos)}`;
        document.getElementById('rendaMensal').textContent = `R$ ${formatNumber(rendaMensal)}`;

        // Preencher tabela de detalhamento
        const detailsTableBody = document.getElementById('detailsTableBody');
        detailsTableBody.innerHTML = '';
        let accumulated = initialValue;
        periods.forEach((period, i) => {
            const months = periodResults[i].months;
            const montante = periodResults[i].montante;
            const investido = period.contribution * months;
            const juros = montante - (accumulated + investido);
            accumulated = montante;
            const years = calculateYearsBetweenDates(period.startDate, period.endDate);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Recorrente: ${period.startDate} (por ${years} anos)</td>
                <td>R$ ${formatNumber(montante)}</td>
                <td>R$ ${formatNumber(investido)}</td>
                <td>R$ ${formatNumber(juros)}</td>
            `;
            detailsTableBody.appendChild(row);
        });
        document.getElementById('detailsTable').style.display = 'table';

        // Gerar dados para o gráfico (corrigido)
        const labels = [];
        const investedData = [];
        const interestData = [];

        for (let year = 0; year <= totalYears; year++) {
            labels.push(year.toString());
            const monthsInYear = Math.min(year * 12, totalMonths); // Número de meses até o final do ano atual

            // Calcular o montante e o valor investido até o final do ano atual
            let yearMontante = initialValue;
            let yearInvested = initialValue;
            let monthsSoFar = 0;

            for (let i = 0; i < periods.length; i++) {
                const periodMonths = periodResults[i].months;
                const monthlyRate = periods[i].interestRate / 100 / 12;
                const contribution = periods[i].contribution;

                // Determinar quantos meses do período atual estão dentro deste ano
                let monthsToCalculate = 0;
                if (monthsSoFar < monthsInYear) {
                    monthsToCalculate = Math.min(periodMonths, monthsInYear - monthsSoFar);
                }

                // Calcular o montante e o investido para os meses dentro deste ano
                for (let month = 0; month < monthsToCalculate; month++) {
                    yearMontante += contribution;
                    yearMontante *= (1 + monthlyRate);
                    yearInvested += contribution;
                }

                monthsSoFar += periodMonths;
                if (monthsSoFar >= monthsInYear) break;
            }

            investedData.push(yearInvested);
            interestData.push(yearMontante - yearInvested);
        }

        document.getElementById('chartContainer').style.display = 'block';
        createChart(labels, investedData, interestData);

        document.getElementById('exportBtn').style.display = 'block';
        document.getElementById('exportBtn').onclick = () => {
            const exportData = {
                resumo: [
                    { label: "Valor Final (R$)", value: formatNumber(montante) },
                    { label: "Total Investido (R$)", value: formatNumber(totalInvestido) },
                    { label: "Juros Ganhos (R$)", value: formatNumber(jurosGanhos) },
                    { label: "Renda Mensal Aposentadoria (R$)", value: formatNumber(rendaMensal) }
                ],
                detalhamentoPorAno: labels.map((label, index) => ({
                    ano: label,
                    investido: formatNumber(investedData[index]),
                    montante: formatNumber(investedData[index] + interestData[index])
                }))
            };
            exportToFile(exportData);
        };

        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #34d399; color: white; padding: 10px 20px; border-radius: 8px; z-index: 1000;';
        notification.textContent = 'Cálculo realizado com sucesso!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    });

    // Função placeholder para Importar Aportes
    document.querySelector('.import-btn').addEventListener('click', () => {
        alert('Funcionalidade de importar aportes ainda não implementada.');
    });
});

// Calcular diferença de tempo em meses
function calculateTimeDiffInMonths(years) {
    return years * 12;
}

// Calcular juros compostos (simulação iterativa, mês a mês) - Modo Clássico
function calculateCompoundInterestClassic(initial, contribution, rate, months) {
    const monthlyRate = rate / 100 / 12;
    let montante = initial;
    for (let month = 0; month < months; month++) {
        montante += contribution; // Aporte no início do período
        montante *= (1 + monthlyRate); // Aplica os juros depois do aporte
    }
    return montante;
}

// Calcular juros compostos com aportes variáveis e taxas variáveis (ajustado para maior precisão)
function calculateCompoundInterestVariable(initial, periods) {
    let montante = initial;
    let totalMonths = 0;

    const periodResults = periods.map(period => {
        const months = calculateMonthsBetweenDates(period.startDate, period.endDate);
        const monthlyRate = period.interestRate / 100 / 12;
        for (let month = 0; month < months; month++) {
            montante += period.contribution; // Aporte no início do período
            montante *= (1 + monthlyRate); // Aplica os juros depois do aporte
        }
        totalMonths += months;
        return { months, montante: montante };
    });

    return { montante, totalMonths, periodResults };
}

// Calcular renda mensal para aposentadoria
function calculateMonthlyRetirementIncome(finalAmount) {
    const monthlyFactor = 0.010976; // Ajustado para corresponder à planilha
    return finalAmount * monthlyFactor;
}

// Abreviar valores grandes para o gráfico
function abbreviateNumber(value) {
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toFixed(0);
}

// Criar gráfico
function createChart(labels, investedData, interestData) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Total em Juros', data: interestData, borderColor: '#c0392b', fill: false, tension: 0.1 },
                { label: 'Valor Investido', data: investedData, borderColor: '#2c3e50', fill: false, tension: 0.1 }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `R$ ${formatNumber(context.parsed.y)}`
                    }
                },
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: value => abbreviateNumber(value) } },
                x: { ticks: { callback: (value, index) => labels[index] } }
            }
        }
    });
}

// Exportar resultados em TXT
function exportToFile(data) {
    const text = `[Resumo]\n${data.resumo.map(item => `${item.label}: ${item.value}`).join('\n')}\n\n[Detalhamento por Ano]\nAno;Valor Investido (R$);Montante Total (R$)\n${data.detalhamentoPorAno.map(item => `${item.ano};${item.investido};${item.montante}`).join('\n')}`;
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'resultados_calculadora.txt';
    link.click();
}

// Lógica para Simulação Clássica
document.getElementById('classicForm').addEventListener('submit', e => {
    e.preventDefault();

    const initialValue = parseInput(document.getElementById('classicInitialValue').value);
    const monthlyContribution = parseInput(document.getElementById('classicMonthlyContribution').value);
    const interestRate = parseInput(document.getElementById('classicInterestRate').value);
    const period = parseInt(document.getElementById('classicPeriod').value);

    if (isNaN(interestRate) || interestRate < 0) {
        alert('A taxa de juros deve ser um número válido e não negativa.');
        return;
    }
    if (isNaN(period) || period <= 0) {
        alert('O período deve ser maior que 0.');
        return;
    }

    const totalMonths = calculateTimeDiffInMonths(period);
    const montante = calculateCompoundInterestClassic(initialValue, monthlyContribution, interestRate, totalMonths);
    const totalInvestido = initialValue + (monthlyContribution * totalMonths);
    const jurosGanhos = montante - totalInvestido;
    const rendaMensal = calculateMonthlyRetirementIncome(montante);

    document.getElementById('result').style.display = 'flex';
    document.getElementById('totalFinal').textContent = `R$ ${formatNumber(montante)}`;
    document.getElementById('totalInvestido').textContent = `R$ ${formatNumber(totalInvestido)}`;
    document.getElementById('totalJuros').textContent = `R$ ${formatNumber(jurosGanhos)}`;
    document.getElementById('rendaMensal').textContent = `R$ ${formatNumber(rendaMensal)}`;

    const detailsTableBody = document.getElementById('detailsTableBody');
    detailsTableBody.innerHTML = '';
    document.getElementById('detailsTable').style.display = 'none';

    const labels = [];
    const investedData = [];
    const interestData = [];
    let currentMontante = initialValue;
    let currentInvested = initialValue;

    for (let year = 0; year <= period; year++) {
        labels.push(year.toString());
        const yearMonths = year * 12;
        const monthlyRate = interestRate / 100 / 12;

        for (let month = (year - 1) * 12; month < yearMonths; month++) {
            currentMontante += monthlyContribution;
            currentMontante *= (1 + monthlyRate);
            if (month >= 0) currentInvested += monthlyContribution;
        }

        investedData.push(currentInvested);
        interestData.push(currentMontante - currentInvested);
    }

    document.getElementById('chartContainer').style.display = 'block';
    createChart(labels, investedData, interestData);

    document.getElementById('exportBtn').style.display = 'block';
    document.getElementById('exportBtn').onclick = () => {
        const exportData = {
            resumo: [
                { label: "Valor Final (R$)", value: formatNumber(montante) },
                { label: "Total Investido (R$)", value: formatNumber(totalInvestido) },
                { label: "Juros Ganhos (R$)", value: formatNumber(jurosGanhos) },
                { label: "Renda Mensal Aposentadoria (R$)", value: formatNumber(rendaMensal) }
            ],
            detalhamentoPorAno: labels.map((label, index) => ({
                ano: label,
                investido: formatNumber(investedData[index]),
                montante: formatNumber(investedData[index] + interestData[index])
            }))
        };
        exportToFile(exportData);
    };

    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #34d399; color: white; padding: 10px 20px; border-radius: 8px; z-index: 1000;';
    notification.textContent = 'Cálculo realizado com sucesso!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});
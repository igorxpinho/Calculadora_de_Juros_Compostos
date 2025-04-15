document.addEventListener('DOMContentLoaded', () => {
    // Botão para voltar à calculadora
    document.getElementById('backToCalculatorBtn').addEventListener('click', () => {
        window.location.href = 'Inicio.html'; // Redireciona para a página da calculadora
    });

    // Botão para calcular o exemplo prático
    document.getElementById('calculateExampleBtn').addEventListener('click', () => {
        const principal = 1000;
        const rate = 0.10;
        const periods = 5;

        const montante = principal * Math.pow(1 + rate, periods);
        document.getElementById('exampleResult').textContent = `R$ ${montante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });
});
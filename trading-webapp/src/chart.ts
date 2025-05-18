// chart.ts
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    CategoryScale,
    Filler,
    } from 'chart.js';

    Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        CategoryScale,
        Tooltip,
        Filler,
    );

export function renderBondChart(canvasId: string, label: string, data: number[]) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        console.warn(`Canvas with ID "${canvasId}" not found.`);
        return;
    }

    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (data.length - 1 - i));
                return date.toLocaleDateString('de-DE');
            }),
            datasets: [
            {
                label,
                data,
                borderColor: 'blue',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                fill: true,
                segment: {
                    borderColor: (ctx) => {
                        const { p0, p1 } = ctx;
                        return p1.y > p0.y ? 'red' : 'green'; // up = green, down = red
                    }
                },
                tension: 0.0,
                pointRadius: 2,
                pointHoverRadius: 4
            },
            {
                label: 'Durchschnitt',
                data: new Array(data.length).fill(avg),
                borderColor: 'blue',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            }
            ]
        },
        options: {
            responsive: true,
            plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                label: context => {
                    if (context.dataset.label === 'Durchschnitt') {
                        return ''; // hide this line
                    }
                    const value = context.parsed.y.toFixed(2);
                    return `Preis: ${value} €`;
                },
                footer: (tooltipItems) => {
                    const avgValue = avg.toFixed(2);
                    return `Durchschnitt: ${avgValue} €`;
                }
                }
            },
            },
            interaction: {
            mode: 'index',
            intersect: false
            },
            scales: {
            x: {
                display: true,
                title: {
                display: true,
                text: 'Datum'
                }
            },
            y: {
                display: true,
                title: {
                display: true,
                text: 'Preis (€)'
                }
            }
            }
        }
        });
}
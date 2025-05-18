// chart.ts
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale
    } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export function renderBondChart(canvasId: string, label: string, data: number[]) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        console.warn(`Canvas with ID "${canvasId}" not found.`);
        return;
    }


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
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            enabled: true, // Ensure tooltips are on
            mode: 'index',
            intersect: false,
            callbacks: {
              // Optional: customize tooltip content
              label: context => {
                const value = context.parsed.y.toFixed(2);
                return `Preis: ${value} €`;
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
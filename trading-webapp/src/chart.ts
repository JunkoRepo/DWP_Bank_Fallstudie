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
        labels: data.map((_, i) => `T-${data.length - i}`),
        datasets: [
          {
            label,
            data,
            borderColor: 'blue',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true
      }
    });
  }
  
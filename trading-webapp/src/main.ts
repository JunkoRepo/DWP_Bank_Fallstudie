import './style.css';

interface Bond {
  wkn: string;
  isin: string;
  name: string;
  typ: string;
  kurs: number;
  anlagerisiko: string;
  datum_naechste_hauptversammlung: string;
  emittent: string;
}

let currentSort: {
  col: keyof Bond | null;
  direction: 'asc' | 'desc';
} = {
  col: null,
  direction: 'asc'
};

let savedValues: Bond[] = [];

// Daten aus localStorage oder von JSON laden
// TODO: Favoriten hier speichern
async function loadBonds(): Promise<Bond[]> {
  const savedData = localStorage.getItem("bonds");

  if (savedData) {
    return JSON.parse(savedData);
  } else {
    const res = await fetch("/data.json");
    const data = await res.json();
    localStorage.setItem("bonds", JSON.stringify(data));
    return data;
  }
}

function sortData(data: Bond[], col: keyof Bond): Bond[] {
  const neueRichtung =
    currentSort.col === col && currentSort.direction === 'asc'
      ? 'desc'
      : 'asc';

  currentSort = { col, direction: neueRichtung };

  return [...data].sort((a, b) => {
    const aWert = a[col];
    const bWert = b[col];

    if (typeof aWert === 'number' && typeof bWert === 'number') {
      return neueRichtung === 'asc' ? aWert - bWert : bWert - aWert;
    } else {
      return neueRichtung === 'asc'
        ? String(aWert).localeCompare(String(bWert))
        : String(bWert).localeCompare(String(aWert));
    }
  });
}

// Anzeige im HTML
function displayBonds(bonds: Bond[]) {
  const container = document.getElementById("app");
  if (!container) return;

  const header = (cell: keyof Bond, title: string) => {
    const symbol =
      currentSort.col === cell
        ? currentSort.direction === 'asc'
          ? ' ▼'
          : ' ▲'
        : '';
    return `<th data-col="${cell}">${title}${symbol}</th>`;
  };

  container.innerHTML = `
    <h1>Wertpapiere</h1>
    <table>
      <thead>
        <tr>
          ${header("name", "Name")}
          ${header("typ", "Typ")}
          ${header("kurs", "Kurs")}
          ${header("anlagerisiko", "Risiko")}
          ${header("emittent", "Emittent")}
        </tr>
      </thead>
      <tbody>
        ${bonds.map(w => `
          <tr>
            <td>${w.name}</td>
            <td>${w.typ}</td>
            <td>${w.kurs} €</td>
            <td>${w.anlagerisiko}</td>
            <td>${w.emittent}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Event Listener für Header
  container.querySelectorAll("th[data-col]").forEach(th => {
    th.addEventListener("click", () => {
      const col = (th as HTMLElement).dataset.col as keyof Bond;
      const sorted = sortData(savedValues, col);
      displayBonds(sorted);
    });
  });
}

loadBonds().then(data => {
  savedValues = data;
  displayBonds(data);
});
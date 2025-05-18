import './style.css';
import { renderBondChart } from './chart';


interface Bond {
  wkn: string;
  isin: string;
  name: string;
  typ: string;
  kurs: number;
  anlagerisiko: string;
  datum_naechste_hauptversammlung: string;
  emittent: string;
  history?: number[]; // simulated proce history
  favorit?: boolean;
}

let currentSort: {
  col: keyof Bond | null;
  direction: 'asc' | 'desc';
} = {
  col: 'name',
  direction: 'desc'
};

let savedValues: Bond[] = [];

function generatePriceHistory(currentPrice: number, days: number = 30): number[] {
  const history: number[] = [];

  let price = currentPrice;

  for (let i = 0; i < days; i++) {
    // simulate daily price change between -2% and +2%
    const changePercent = (Math.random() * 4 - 2) / 100;
    price = +(price * (1 + changePercent)).toFixed(2); // round to 2 decimals
    history.unshift(price); // prepend so most recent is last
  }

  return history;
}


// Daten aus localStorage oder von JSON laden
// TODO: Favoriten hier speichern
async function loadBonds(): Promise<Bond[]> {
  const savedData = localStorage.getItem("bonds");

  if (savedData) {
    const parsed: Bond[] = JSON.parse(savedData);
    parsed.forEach((bond) => {
      if (!bond.history) {
        bond.history = generatePriceHistory(bond.kurs);
      }
    });
    return parsed;
  } else {
    const res = await fetch("/data.json");
    const data: Bond[] = await res.json();

    // Generate history before saving to localStorage
    data.forEach((bond) => {
      bond.history = generatePriceHistory(bond.kurs);
    });

    localStorage.setItem("bonds", JSON.stringify(data));
    return data;
  }
}


function sortData(data: Bond[], col: keyof Bond, preserveDirection: boolean = false): Bond[] {
  let neueRichtung: "asc" | "desc";

  if (preserveDirection && currentSort.col === col) {
    neueRichtung = currentSort.direction;
  } else {
    neueRichtung =
      currentSort.col === col && currentSort.direction === "asc" ? "desc" : "asc";
    currentSort = { col, direction: neueRichtung };
  }

  return [...data].sort((a, b) => {
    const aWert = a[col];
    const bWert = b[col];

    if (typeof aWert === "number" && typeof bWert === "number") {
      return neueRichtung === "asc" ? aWert - bWert : bWert - aWert;
    } else {
      return neueRichtung === "asc"
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
  <h1>TRADING Inc.</h1>
  <table>
    <thead>
      <tr>
        ${header("name", "Name")}
        ${header("typ", "Typ")}
        ${header("kurs", "Kurs")}
        ${header("anlagerisiko", "Risiko")}
        ${header("emittent", "Emittent")}
        ${header("favorit", "Favorit")}
      </tr>
    </thead>
    <tbody>
      ${bonds
        .map(
          (bond, i) => `
        <tr class="bond-row pointer" data-wkn="${bond.wkn}">
          <td>${bond.name}</td>
          <td>${bond.typ}</td>
          <td>
            ${bond.kurs.toFixed(2)} €
            ${bond.history && bond.history.length >= 2
              ? (() => {
                  const prev = bond.history[bond.history.length - 2];
                  const curr = bond.history[bond.history.length - 1];
                  const diff = +(curr - prev).toFixed(2);
                  const color = diff >= 0 ? 'green' : 'red';
                  const sign = diff >= 0 ? '+' : '';
                  return `<span style="color:${color}; margin-left:6px;">${sign}${diff} €</span>`;
                })()
              : ''}
          </td>

          <td>${bond.anlagerisiko}</td>
          <td>${bond.emittent}</td>
          <td class="favorite-toggle" data-wkn="${bond.wkn}">${
            bond.favorit ? "svg anzeigen" : "svg nicht anzeigen"
          }</td> 
        </tr>
        <tr class="chart-row hidden" data-wkn="${bond.wkn}">
            <td  colspan="5">
              <canvas id="chart-${i}" height="200"></canvas>
            </td>
        </tr>
      `
        )
        .join('')}
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

  // Event Listener for Favorite
  container.querySelectorAll(".favorite-toggle").forEach((td) => {
    td.addEventListener("click", () => {
      const wkn = (td as HTMLElement).dataset.wkn;
      const bond = savedValues.find((b) => b.wkn === wkn);
      if (bond) {
        updateFavorite(bond);

        // Update the content of this cell only
        td.innerHTML = bond.favorit ? "svg anzeigen" : "svg nicht anzeigen";
      }
    });
  });

  // Event Listener for Drop-Down
  container.querySelectorAll(".bond-row").forEach((row) => {
    row.addEventListener("click", () => {
      console.log("Clicked bond row", row);
      const wkn = (row as HTMLElement).dataset.wkn;
      const chartRow = container.querySelector(`.chart-row[data-wkn="${wkn}"]`);
      const bond = savedValues.find((b) => b.wkn === wkn);
      const canvas = chartRow?.querySelector("canvas");

      if (!chartRow || !canvas || !bond?.history) return;

      const isHidden = chartRow.classList.contains("hidden");
      chartRow.classList.toggle("hidden");

      if (isHidden) {
        renderBondChart(canvas.id, bond.name, bond.history);
      }
    });
  });

  
  // Render charts for each bond
  bonds.forEach((bond, i) => {
    console.log(`Rendering chart for ${bond.name}`, bond.history);
    if (bond.history) {
      renderBondChart(`chart-${i}`, bond.name, bond.history);
    }
  });
}

export function updateFavorite(bond: Bond) {
  const index = savedValues.findIndex((b) => b.wkn === bond.wkn);
  if (index !== -1) {
    savedValues[index].favorit = !savedValues[index].favorit;
    localStorage.setItem("bonds", JSON.stringify(savedValues));
  }
  if (currentSort.col === "favorit") {
    savedValues = sortData(savedValues, currentSort.col, true);
    displayBonds(savedValues); // re-render all to show updated position
  }
}

loadBonds().then(data => {
  // savedValues = data;
  savedValues = sortData(data, currentSort.col!);  // Force sort on default column
  displayBonds(data);
});
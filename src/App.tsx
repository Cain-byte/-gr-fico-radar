import { useRef, useState, useEffect } from "react";
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import "./App.css";

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface DataPoint {
  category: string;
  value: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [points, setPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "radar",
      data: {
        labels: [],
        datasets: [{
          label: "Meu Radar",
          data: [],
          backgroundColor: "rgba(134, 239, 172, 0.3)",
          borderColor: "#22c55e",
          borderWidth: 2,
          pointBackgroundColor: "#16a34a",
        }],
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
          },
        },
        responsive: true,
        plugins: {
          legend: { position: "top" },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const values = points.map((p) => p.value);
    const maxValue = Math.max(...values, 10);

    chartRef.current.data.labels = points.map((p) => p.category);
    chartRef.current.data.datasets[0].data = values;
    chartRef.current.options.scales!.r = {
      beginAtZero: true,
      max: maxValue + maxValue * 0.1,
    };
    chartRef.current.update();
  }, [points]);

  const addData = () => {
    const num = parseInt(value);
    if (!category || isNaN(num)) return;
    setPoints((prev) => [...prev, { category, value: num }]);
    setCategory("");
    setValue("");
  };

  const downloadChart = async () => {
    if (!canvasRef.current) return;

    const path = await save({
      filters: [{ name: "Imagem PNG", extensions: ["png"] }],
      defaultPath: "seu_gráfico.png",
    });
    if (!path) return;

    const dataUrl = canvasRef.current.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    await writeFile(path, bytes);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>📈</h2>
        <div className="controls">
          <input
            type="text"
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addData()}
          />
          <input
            type="number"
            placeholder="Valor"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addData()}
          />
          <button onClick={addData}>Adicionar</button>
          <button onClick={downloadChart}>Baixar PNG</button>
        </div>
        <canvas ref={canvasRef} width={400} height={400} />
      </div>
    </div>
  );
}
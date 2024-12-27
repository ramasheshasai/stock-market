import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const App = () => {
  const defaultStocks = [
    { id: 1, name: "Amazon", ticker: "AMZN" },
    { id: 2, name: "Apple", ticker: "AAPL" },
    { id: 3, name: "Tesla", ticker: "TSLA" },
    { id: 4, name: "Microsoft", ticker: "MSFT" },
    { id: 5, name: "Google", ticker: "GOOGL" },
    { id: 6, name: "Nike", ticker: "NKE" },
    { id: 7, name: "Disney", ticker: "DIS" },
    { id: 8, name: "NVIDIA", ticker: "NVDA" },
  ];

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [form, setForm] = useState({ id: null, name: "", quantity: 1 });
  const [metrics, setMetrics] = useState({
    topStock: null,
    distribution: {},
  });

  // Function to fetch stock prices
  const fetchStockPrices = async (tickers) => {
    try {
      const responses = await Promise.all(
        tickers.map((ticker) =>
          fetch(
            `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=ctmmlc9r01qjlgiqg2o0ctmmlc9r01qjlgiqg2og`
          ).then((res) => res.json())
        )
      );

      const updatedPortfolio = portfolio.map((stock, index) => ({
        ...stock,
        currentPrice: responses[index]?.c || 0, // 'c' is the current price
      }));

      setPortfolio(updatedPortfolio);
      calculateMetrics(updatedPortfolio);
      calculatePortfolioValue(updatedPortfolio);
    } catch (error) {
      console.error("Error fetching stock prices:", error);
    }
  };

  // Function to calculate portfolio value
  const calculatePortfolioValue = (portfolio) => {
    const totalValue = portfolio.reduce(
      (sum, stock) => sum + (stock.quantity || 0) * (stock.currentPrice || 0),
      0
    );
    setPortfolioValue(totalValue);
  };

  // Function to calculate metrics
  const calculateMetrics = (portfolio) => {
    if (portfolio.length === 0) return;

    // Top-performing stock
    const topStock = portfolio.reduce(
      (top, stock) =>
        (stock.currentPrice || 0) > (top.currentPrice || 0) ? stock : top,
      portfolio[0]
    );

    // Portfolio distribution
    const distribution = portfolio.reduce((acc, stock) => {
      acc[stock.name] =
        ((stock.quantity * stock.currentPrice) / portfolioValue) * 100 || 0;
      return acc;
    }, {});

    setMetrics({ topStock, distribution });
  };

  // Initialize portfolio with 5 random stocks
  const initializePortfolio = () => {
    const selectedStocks = [...defaultStocks]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((stock) => ({ ...stock, quantity: 1 }));
    setPortfolio(selectedStocks);
  };

  // Add/Edit stock
  const handleAddEditStock = () => {
    const selectedStock = defaultStocks.find(
      (stock) => stock.name === form.name
    );
    if (!selectedStock) {
      alert("Invalid stock selected.");
      return;
    }
    const updatedPortfolio = form.id
      ? portfolio.map((stock) =>
          stock.id === form.id
            ? { ...form, ticker: selectedStock.ticker }
            : stock
        )
      : [
          ...portfolio,
          {
            id: Date.now(),
            name: form.name,
            ticker: selectedStock.ticker,
            quantity: form.quantity,
          },
        ];
    setPortfolio(updatedPortfolio);
    setForm({ id: null, name: "", quantity: 1 });
  };

  // Delete stock
  const handleDeleteStock = (id) => {
    const updatedPortfolio = portfolio.filter((stock) => stock.id !== id);
    setPortfolio(updatedPortfolio);
  };

  // Generate chart data
  const generateChartData = () =>
    portfolio.map((stock) => ({
      name: stock.name,
      value: (stock.quantity || 0) * (stock.currentPrice || 0),
    }));

  // Fetch prices when portfolio changes
  useEffect(() => {
    const tickers = portfolio.map((stock) => stock.ticker);
    if (tickers.length > 0) {
      fetchStockPrices(tickers);
    }
  }, [portfolio.length]); // Trigger only when portfolio length changes

  // Recalculate metrics and value only when portfolio updates
  useEffect(() => {
    if (portfolio.length > 0) {
      calculatePortfolioValue(portfolio);
      calculateMetrics(portfolio);
    }
  }, [portfolio]);

  // Initialize portfolio on first render
  useEffect(() => {
    initializePortfolio();
  }, []);

  return (
    <div className="app container my-4">
      <header className="text-center">
        <h1 className="mb-4">Portfolio Tracker</h1>
      </header>

      {/* Add/Edit Stock */}
      <section className="form-section mb-5">
        <h2>Add/Edit Stock</h2>
        <div className="mb-3">
          <label className="form-label">Stock Name</label>
          <select
            name="name"
            className="form-select"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          >
            <option value="">Select a stock</option>
            {defaultStocks.map((stock) => (
              <option key={stock.id} value={stock.name}>
                {stock.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Quantity</label>
          <input
            type="number"
            className="form-control"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAddEditStock}>
          {form.id ? "Update Stock" : "Add Stock"}
        </button>
      </section>

      {/* Stock Holdings */}
      <section className="table-section mb-5">
        <h2>Stock Holdings</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Ticker</th>
              <th>Quantity</th>
              <th>Current Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((stock) => (
              <tr key={stock.id}>
                <td>{stock.name}</td>
                <td>{stock.ticker}</td>
                <td>{stock.quantity}</td>
                <td>
                  {stock.currentPrice
                    ? `$${stock.currentPrice.toFixed(2)}`
                    : "Loading..."}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => setForm(stock)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteStock(stock.id)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Portfolio Metrics */}
      <section className="metrics-section mb-5">
        <h2>Portfolio Metrics</h2>
        <p>
          <strong>Total Value:</strong> ${portfolioValue.toFixed(2)}
        </p>
        <p>
          <strong>Top Stock:</strong> {metrics.topStock?.name || "N/A"} (
          {metrics.topStock?.currentPrice?.toFixed(2) || 0})
        </p>
        <div>
          <strong>Distribution:</strong>
          <ul>
            {Object.entries(metrics.distribution).map(([name, percentage]) => (
              <li key={name}>
                {name}: {percentage.toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Chart */}
      <section className="chart-section mb-5">
        <h2>Portfolio Value Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={generateChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default App;

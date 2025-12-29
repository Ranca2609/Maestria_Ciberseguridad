import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { CreateOrder, OrderList, OrderDetail, ReceiptView, CurrencyConverter } from './components';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>QuetzalShip</h1>
          <p>Sistema de Gestión de Envíos</p>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Nueva Orden
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
              Mis Órdenes
            </NavLink>
            <NavLink to="/currency" className={({ isActive }) => isActive ? 'active' : ''}>
              Conversión FX
            </NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<CreateOrder />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/orders/:orderId/receipt" element={<ReceiptView />} />
            <Route path="/currency" element={<CurrencyConverter />} />
          </Routes>
        </main>

        <footer style={{ textAlign: 'center', padding: 20, color: '#666', marginTop: 40 }}>
          <p>QuetzalShip © 2024 - Práctica 2 Software Avanzado</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

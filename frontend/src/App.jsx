import { useState } from 'react'
import OrderList from './components/OrderList'
import CreateOrder from './components/CreateOrder'
import OrderDetail from './components/OrderDetail'

function App() {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('list')
  }

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId)
    setActiveTab('detail')
  }

  const handleBackToList = () => {
    setSelectedOrderId(null)
    setActiveTab('list')
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="app">
      <header>
        <h1>QuetzalShip</h1>
        <p>Sistema de Envíos - Guatemala</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => { setActiveTab('list'); setSelectedOrderId(null); }}
        >
          Mis Órdenes
        </button>
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Nueva Orden
        </button>
        {activeTab === 'detail' && selectedOrderId && (
          <button className="tab-btn active">
            Detalle de Orden
          </button>
        )}
      </div>

      <main>
        {activeTab === 'list' && (
          <OrderList
            key={refreshKey}
            onViewOrder={handleViewOrder}
          />
        )}
        {activeTab === 'create' && (
          <CreateOrder onOrderCreated={handleOrderCreated} />
        )}
        {activeTab === 'detail' && selectedOrderId && (
          <OrderDetail
            orderId={selectedOrderId}
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  )
}

export default App

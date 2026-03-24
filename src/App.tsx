import ProductListDashboard from "./components/product-list-dashboard/ProductListDashboard";
import PriceSimulatorWidget from "./components/price-simulator-widget/PriceSimulatorWidget";

function App() {
    return (
        <div className="app-container">
            <ProductListDashboard />
            <PriceSimulatorWidget />
        </div>
    );
}

export default App;

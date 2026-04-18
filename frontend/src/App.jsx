import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Accounts from "./pages/Accounts";

export default function App() {
	return (
		<BrowserRouter>
			<div className="flex min-h-screen bg-slate-50">
				<Sidebar />
				<main className="flex-1 overflow-auto">
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/customers" element={<Customers />} />
						<Route path="/menu" element={<Menu />} />
						<Route path="/orders" element={<Orders />} />
						<Route path="/kitchen" element={<Kitchen />} />
						<Route path="/accounts" element={<Accounts />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}

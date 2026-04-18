import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
	const [summary, setSummary] = useState(null);
	const [recentOrders, setRecentOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filterPeriod, setFilterPeriod] = useState("all"); // 'today', 'month', 'all'

	useEffect(() => {
		fetchData();
	}, [filterPeriod]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [summaryRes, ordersRes] = await Promise.all([
				axios.get("/api/accounts/summary", {
					params: { period: filterPeriod },
				}),
				axios.get("/api/orders"),
			]);
			setSummary(summaryRes.data);
			setRecentOrders(ordersRes.data.slice(0, 6));
		} catch {
			setError(
				"Could not connect to server. Make sure the backend is running.",
			);
		} finally {
			setLoading(false);
		}
	};

	const statusColor = (status) => {
		const map = {
			Completed: "bg-green-100 text-green-700",
			Confirmed: "bg-blue-100 text-blue-700",
			"In-Progress": "bg-yellow-100 text-yellow-700",
			Cancelled: "bg-red-100 text-red-700",
			Enquiry: "bg-gray-100 text-gray-700",
		};
		return map[status] || "bg-gray-100 text-gray-700";
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-400 text-sm">Loading dashboard…</p>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-7xl">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
				<p className="text-gray-500 text-sm mt-1">
					Welcome to your catering management system
				</p>
			</div>

			{/* Filter Buttons */}
			<div className="flex gap-3 mb-6">
				<button
					onClick={() => setFilterPeriod("today")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
						filterPeriod === "today"
							? "bg-orange-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					📅 Today
				</button>
				<button
					onClick={() => setFilterPeriod("month")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
						filterPeriod === "month"
							? "bg-orange-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					📆 This Month
				</button>
				<button
					onClick={() => setFilterPeriod("all")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
						filterPeriod === "all"
							? "bg-orange-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					📊 All Time
				</button>
			</div>

			{error && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
					⚠️ {error}
				</div>
			)}

			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{[
					{
						label: "Total Customers",
						value: summary?.totalCustomers ?? 0,
						color: "bg-blue-500",
						icon: "👥",
					},
					{
						label: "Total Orders",
						value: summary?.totalOrders ?? 0,
						color: "bg-indigo-500",
						icon: "📋",
					},
					{
						label: "Total Revenue",
						value: `₹${(summary?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
						color: "bg-orange-500",
						icon: "💰",
					},
					{
						label: "Pending Amount",
						value: `₹${(summary?.totalPending ?? 0).toLocaleString("en-IN")}`,
						color: "bg-rose-500",
						icon: "⏳",
					},
				].map((card) => (
					<div
						key={card.label}
						className={`${card.color} rounded-xl p-5 text-white shadow-md`}
					>
						<div className="flex justify-between items-start">
							<div>
								<p className="text-xs opacity-80 font-medium">{card.label}</p>
								<p className="text-2xl font-bold mt-1">{card.value}</p>
							</div>
							<span className="text-3xl opacity-80">{card.icon}</span>
						</div>
					</div>
				))}
			</div>

			{/* Secondary stats */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				{[
					{
						label: "Paid Orders",
						value: summary?.paidOrders ?? 0,
						color: "text-green-600",
						bg: "bg-green-50",
					},
					{
						label: "Partial Payment",
						value: summary?.partialOrders ?? 0,
						color: "text-yellow-600",
						bg: "bg-yellow-50",
					},
					{
						label: "Completed Events",
						value: summary?.completedOrders ?? 0,
						color: "text-blue-600",
						bg: "bg-blue-50",
					},
				].map((s) => (
					<div
						key={s.label}
						className={`${s.bg} rounded-xl p-4 border border-opacity-20`}
					>
						<p className="text-xs text-gray-500 font-medium">{s.label}</p>
						<p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
					</div>
				))}
			</div>

			{/* Recent Orders */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-base font-semibold text-gray-800">
						Recent Orders
					</h2>
					<Link
						to="/orders"
						className="text-orange-600 hover:text-orange-700 text-sm font-medium"
					>
						View All →
					</Link>
				</div>

				{recentOrders.length === 0 ? (
					<div className="text-center py-10 text-gray-400">
						<p className="text-3xl mb-2">📋</p>
						<p className="text-sm">No orders yet.</p>
						<Link
							to="/orders"
							className="text-orange-600 text-sm hover:underline"
						>
							Create your first order →
						</Link>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-100">
									{[
										"Order #",
										"Customer",
										"Event",
										"Date",
										"Guests",
										"Amount",
										"Status",
									].map((h) => (
										<th
											key={h}
											className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{recentOrders.map((order) => (
									<tr
										key={order._id}
										className="border-b border-gray-50 hover:bg-gray-50"
									>
										<td className="py-3 px-2 font-semibold text-orange-600 text-xs">
											{order.orderNumber}
										</td>
										<td className="py-3 px-2 font-medium text-gray-800">
											{order.customer?.name || "N/A"}
										</td>
										<td className="py-3 px-2 text-gray-600">
											{order.eventType}
										</td>
										<td className="py-3 px-2 text-gray-600">
											{new Date(order.eventDate).toLocaleDateString("en-IN")}
										</td>
										<td className="py-3 px-2 text-gray-600">
											{order.numberOfGuests}
										</td>
										<td className="py-3 px-2 font-semibold text-gray-800">
											₹{(order.totalAmount || 0).toLocaleString("en-IN")}
										</td>
										<td className="py-3 px-2">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.orderStatus)}`}
											>
												{order.orderStatus}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

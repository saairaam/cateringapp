import { useState, useEffect } from "react";
import axios from "axios";

export default function Kitchen() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterMealType, setFilterMealType] = useState("all");

	useEffect(() => {
		fetchOrders();
	}, []);

	const fetchOrders = async () => {
		setLoading(true);
		try {
			const res = await axios.get("/api/orders");
			// Filter to show only pending or processing orders (not completed/delivered)
			const activeOrders = res.data.filter(
				(o) => o.orderStatus !== "Completed" && o.orderStatus !== "Delivered",
			);
			setOrders(activeOrders);
		} catch (err) {
			console.error("Failed to fetch orders", err);
		} finally {
			setLoading(false);
		}
	};

	// Aggregate items by name and count total quantities
	const getItemsSummary = () => {
		const itemsMap = {};

		orders.forEach((order) => {
			if (filterMealType !== "all" && order.mealType !== filterMealType) return;

			(order.items || []).forEach((item) => {
				if (!itemsMap[item.name]) {
					itemsMap[item.name] = {
						name: item.name,
						totalQty: 0,
						orders: [],
					};
				}
				itemsMap[item.name].totalQty += item.quantity;
				itemsMap[item.name].orders.push({
					orderNumber: order.orderNumber,
					qty: item.quantity,
					customerName: order.customer?.name,
				});
			});
		});

		return Object.values(itemsMap).sort((a, b) => a.name.localeCompare(b.name));
	};

	const itemsSummary = getItemsSummary();

	// Filter orders for display
	const filteredOrders = orders.filter(
		(o) => filterMealType === "all" || o.mealType === filterMealType,
	);

	const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-400 text-sm">Loading kitchen orders…</p>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-7xl">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				🍳 Kitchen Dashboard
			</h1>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				<div className="bg-orange-500 rounded-xl p-5 text-white shadow-md">
					<p className="text-xs opacity-80 font-medium">Active Orders</p>
					<p className="text-4xl font-bold mt-2">{filteredOrders.length}</p>
					<p className="text-xs opacity-60 mt-1">
						{itemsSummary.reduce((sum, item) => sum + item.totalQty, 0)} items
						to prepare
					</p>
				</div>

				<div className="bg-blue-500 rounded-xl p-5 text-white shadow-md">
					<p className="text-xs opacity-80 font-medium">Total Items</p>
					<p className="text-4xl font-bold mt-2">{itemsSummary.length}</p>
					<p className="text-xs opacity-60 mt-1">unique item types</p>
				</div>

				<div className="bg-green-500 rounded-xl p-5 text-white shadow-md">
					<p className="text-xs opacity-80 font-medium">Items to Prep</p>
					<p className="text-4xl font-bold mt-2">
						{itemsSummary.reduce((sum, item) => sum + item.totalQty, 0)}
					</p>
					<p className="text-xs opacity-60 mt-1">total quantities</p>
				</div>
			</div>

			{/* Meal Type Filter */}
			<div className="mb-6 flex gap-3">
				{["all", "breakfast", "lunch", "dinner"].map((type) => (
					<button
						key={type}
						onClick={() => setFilterMealType(type)}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
							filterMealType === type
								? "bg-orange-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						{type === "all" ? "All Orders" : mealEmojis[type] + " " + type}
					</button>
				))}
			</div>

			{/* Items to Prepare */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-6">
					📋 Items to Prepare
				</h2>

				{itemsSummary.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-400 text-lg">
							✨ All set! No pending items to prepare.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{itemsSummary.map((item) => (
							<div
								key={item.name}
								className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4"
							>
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-lg font-bold text-gray-800">
										{item.name}
									</h3>
									<div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
										{item.totalQty}
									</div>
								</div>
								<div className="space-y-2">
									{item.orders.map((order, idx) => (
										<div
											key={idx}
											className="bg-white rounded-md p-2 text-sm border-l-4 border-orange-400"
										>
											<p className="font-semibold text-gray-700">
												{order.orderNumber}
											</p>
											<p className="text-gray-600">
												{order.customerName} - Qty: {order.qty}
											</p>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Active Orders Detail */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-6">
					📦 Active Orders
				</h2>

				{filteredOrders.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-400">No active orders</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredOrders.map((order) => (
							<div
								key={order._id}
								className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<span className="text-2xl">
											{mealEmojis[order.mealType]}
										</span>
										<div>
											<p className="font-bold text-lg text-orange-600">
												{order.orderNumber}
											</p>
											<p className="text-gray-600 text-sm">
												{order.customer?.name}
											</p>
										</div>
									</div>
									<div>
										<span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 capitalize">
											{order.orderStatus || "Pending"}
										</span>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-3">
									<p className="text-xs font-semibold text-gray-500 uppercase mb-2">
										Items ({order.items?.length || 0})
									</p>
									<div className="space-y-1">
										{(order.items || []).map((item, idx) => (
											<div
												key={idx}
												className="flex justify-between text-sm text-gray-700"
											>
												<span>{item.name}</span>
												<span className="font-semibold bg-orange-200 px-2 py-0.5 rounded">
													Qty: {item.quantity}
												</span>
											</div>
										))}
									</div>
								</div>

								<div className="mt-3 flex gap-2">
									<span className="text-xs text-gray-500">
										Order Date:{" "}
										{new Date(order.createdAt).toLocaleDateString("en-IN")}
									</span>
									{order.mealType && (
										<span className="text-xs text-gray-500 capitalize">
											• {order.mealType}
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

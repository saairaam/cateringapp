import { useState, useEffect } from "react";
import axios from "axios";

const payColor = (s) =>
	({
		Paid: "bg-green-100 text-green-700",
		Partial: "bg-yellow-100 text-yellow-700",
		Pending: "bg-red-100 text-red-700",
	})[s] || "bg-red-100 text-red-700";

// Individual row with local advance-paid input and click to view details
function PaymentRow({ order, onUpdate, onViewDetails }) {
	const [advance, setAdvance] = useState(order.advancePaid || 0);
	const [saving, setSaving] = useState(false);

	// Sync local advance state with order data whenever order changes
	useEffect(() => {
		setAdvance(order.advancePaid || 0);
	}, [order.advancePaid]);

	const balanceDue = Math.max(0, (order.totalAmount || 0) - advance);

	const handleUpdate = async () => {
		setSaving(true);
		await onUpdate(order._id, parseFloat(advance) || 0);
		setSaving(false);
	};

	return (
		<tr
			className="border-b border-gray-50 hover:bg-orange-50/30 cursor-pointer"
			onClick={() => onViewDetails(order)}
		>
			<td className="py-3 px-2 font-bold text-orange-600 text-xs whitespace-nowrap">
				{order.orderNumber}
			</td>
			<td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">
				{order.customer?.name || "N/A"}
			</td>
			<td className="py-3 px-2 text-gray-600 whitespace-nowrap">
				{new Date(order.createdAt).toLocaleDateString("en-IN")}
			</td>
			<td className="py-3 px-2 text-gray-600 capitalize">{order.mealType}</td>
			<td className="py-3 px-2 font-semibold text-gray-800 whitespace-nowrap">
				₹{(order.totalAmount || 0).toLocaleString("en-IN")}
			</td>
			<td className="py-3 px-2">
				<input
					type="number"
					value={advance}
					onChange={(e) => setAdvance(e.target.value)}
					min="0"
					max={order.totalAmount}
					step="0.01"
					className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
				/>
			</td>
			<td className="py-3 px-2 font-semibold text-red-600 whitespace-nowrap">
				₹{balanceDue.toLocaleString("en-IN")}
			</td>
			<td className="py-3 px-2">
				<span
					className={`px-2 py-1 rounded-full text-xs font-semibold ${payColor(order.paymentStatus)}`}
				>
					{order.paymentStatus}
				</span>
			</td>
			<td className="py-3 px-2">
				<button
					onClick={handleUpdate}
					disabled={saving}
					className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
				>
					{saving ? "…" : "Save"}
				</button>
			</td>
		</tr>
	);
}

export default function Accounts() {
	const [summary, setSummary] = useState(null);
	const [orders, setOrders] = useState([]);
	const [filter, setFilter] = useState("all");
	const [filterPeriod, setFilterPeriod] = useState("all");
	const [loading, setLoading] = useState(true);
	const [showExpenseModal, setShowExpenseModal] = useState(false);
	const [expenses, setExpenses] = useState([]);
	const [expenseName, setExpenseName] = useState("");
	const [expenseAmount, setExpenseAmount] = useState("");
	const [expenseDate, setExpenseDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [selectedOrder, setSelectedOrder] = useState(null);

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
				axios.get("/api/orders", {
					params: { period: filterPeriod },
				}),
			]);
			setSummary(summaryRes.data);
			setOrders(ordersRes.data);
		} catch {
			// handled silently; UI shows empty state
		} finally {
			setLoading(false);
		}
	};

	const addExpense = () => {
		if (!expenseName.trim() || !expenseAmount) return;
		const newExpense = {
			id: Date.now(),
			name: expenseName,
			amount: parseFloat(expenseAmount),
			date: expenseDate,
		};
		setExpenses([...expenses, newExpense]);
		setExpenseName("");
		setExpenseAmount("");
	};

	const removeExpense = (id) => {
		setExpenses(expenses.filter((e) => e.id !== id));
	};

	const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
	const updatePayment = async (orderId, newAdvance) => {
		const order = orders.find((o) => o._id === orderId);
		if (!order) return;

		const balanceDue = Math.max(0, (order.totalAmount || 0) - newAdvance);
		let paymentStatus = "Pending";
		if (newAdvance >= (order.totalAmount || 0) && order.totalAmount > 0)
			paymentStatus = "Paid";
		else if (newAdvance > 0) paymentStatus = "Partial";

		try {
			await axios.put(`/api/orders/${orderId}`, {
				advancePaid: newAdvance,
				balanceDue,
				paymentStatus,
			});
			fetchData();
		} catch {
			// silent
		}
	};

	const filtered = orders.filter((o) => {
		if (filter === "all") return true;
		return (o.paymentStatus || "").toLowerCase() === filter;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-400 text-sm">Loading accounts…</p>
			</div>
		);
	}

	const s = summary || {};

	return (
		<div className="p-6 max-w-7xl">
			<h1 className="text-2xl font-bold text-gray-800 mb-6">
				Accounts & Sales
			</h1>
			{/* Summary Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{[
					{
						label: "Total Revenue",
						value: `₹${(s.totalRevenue || 0).toLocaleString("en-IN")}`,
						sub: `${s.totalOrders || 0} total orders`,
						color: "bg-orange-500",
					},
					{
						label: "Amount Received",
						value: `₹${(s.totalReceived || 0).toLocaleString("en-IN")}`,
						sub: `${s.paidOrders || 0} fully paid`,
						color: "bg-green-500",
					},
					{
						label: "Amount Pending",
						value: `₹${(s.totalPending || 0).toLocaleString("en-IN")}`,
						sub: `${(s.pendingOrders || 0) + (s.partialOrders || 0)} orders pending`,
						color: "bg-rose-500",
					},
				].map((card) => (
					<div
						key={card.label}
						className={`${card.color} rounded-xl p-5 text-white shadow-md`}
					>
						<p className="text-xs opacity-80 font-medium">{card.label}</p>
						<p className="text-2xl font-bold mt-1">{card.value}</p>
						<p className="text-xs opacity-60 mt-1">{card.sub}</p>
					</div>
				))}
			</div>
			{/* Date Filter Buttons */}
			<div className="flex gap-3 mb-6 justify-between items-center">
				<div className="flex gap-3">
					{[
						{ value: "today", label: "📅 Today" },
						{ value: "month", label: "📆 This Month" },
						{ value: "all", label: "📊 All Time" },
					].map((btn) => (
						<button
							key={btn.value}
							onClick={() => setFilterPeriod(btn.value)}
							className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
								filterPeriod === btn.value
									? "bg-orange-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							{btn.label}
						</button>
					))}
				</div>
				<button
					onClick={() => setShowExpenseModal(true)}
					className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
				>
					💰 Add Expense
				</button>
			</div>
			{/* Payment Tracker */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
					<h2 className="text-base font-semibold text-gray-800">
						Payment Tracker
					</h2>
					<div className="flex gap-2">
						{["all", "pending", "partial", "paid"].map((f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize ${
									filter === f
										? "bg-orange-600 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								{f}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-100">
								{[
									"Order #",
									"Customer",
									"Order Date",
									"Meal",
									"Total",
									"Advance Paid (₹)",
									"Balance Due",
									"Status",
									"Action",
								].map((h) => (
									<th
										key={h}
										className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td
										colSpan={9}
										className="text-center py-10 text-gray-400 text-sm"
									>
										No orders found.
									</td>
								</tr>
							) : (
								filtered.map((order) => (
									<PaymentRow
										key={order._id}
										order={order}
										onUpdate={updatePayment}
										onViewDetails={setSelectedOrder}
									/>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Revenue breakdown */}
				{orders.length > 0 && (
					<div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
						{[
							{
								label: "Fully Paid",
								count: s.paidOrders || 0,
								color: "text-green-600",
							},
							{
								label: "Partial Payment",
								count: s.partialOrders || 0,
								color: "text-yellow-600",
							},
							{
								label: "Unpaid",
								count: s.pendingOrders || 0,
								color: "text-red-600",
							},
							{
								label: "Completed Events",
								count: s.completedOrders || 0,
								color: "text-blue-600",
							},
						].map((item) => (
							<div key={item.label} className="bg-gray-50 rounded-lg p-3">
								<p className={`text-xl font-bold ${item.color}`}>
									{item.count}
								</p>
								<p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
							</div>
						))}
					</div>
				)}
			</div>
			{/* Expenses Section */}
			{expenses.length > 0 && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
					<h2 className="text-base font-semibold text-gray-800 mb-4">
						Daily Expenses
					</h2>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-100">
									<th className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase">
										Date
									</th>
									<th className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase">
										Expense
									</th>
									<th className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase">
										Amount
									</th>
									<th className="text-left py-2 px-2 text-xs text-gray-400 font-semibold uppercase">
										Action
									</th>
								</tr>
							</thead>
							<tbody>
								{expenses.map((exp) => (
									<tr
										key={exp.id}
										className="border-b border-gray-50 hover:bg-purple-50/30"
									>
										<td className="py-3 px-2 text-gray-600 whitespace-nowrap">
											{new Date(exp.date).toLocaleDateString("en-IN")}
										</td>
										<td className="py-3 px-2 font-medium text-gray-800">
											{exp.name}
										</td>
										<td className="py-3 px-2 font-semibold text-purple-600 whitespace-nowrap">
											₹{exp.amount.toLocaleString("en-IN")}
										</td>
										<td className="py-3 px-2">
											<button
												onClick={() => removeExpense(exp.id)}
												className="text-red-600 hover:text-red-700 text-xs font-semibold"
											>
												✕ Remove
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
						<p className="text-base font-semibold text-purple-600">
							Total Expenses: ₹{totalExpenses.toLocaleString("en-IN")}
						</p>
					</div>
				</div>
			)}
			{/* Expense Modal */}
			{showExpenseModal && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 50,
					}}
					onClick={() => setShowExpenseModal(false)}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "12px",
							padding: "24px",
							boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
							width: "90%",
							maxWidth: "400px",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<h2
							style={{
								fontSize: "18px",
								fontWeight: "600",
								marginBottom: "16px",
							}}
						>
							💰 Add Daily Expense
						</h2>

						<div style={{ marginBottom: "16px" }}>
							<label
								style={{
									display: "block",
									fontSize: "13px",
									fontWeight: "500",
									marginBottom: "6px",
									color: "#374151",
								}}
							>
								Date
							</label>
							<input
								type="date"
								value={expenseDate}
								onChange={(e) => setExpenseDate(e.target.value)}
								style={{
									width: "100%",
									padding: "8px 12px",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
								}}
							/>
						</div>

						<div style={{ marginBottom: "16px" }}>
							<label
								style={{
									display: "block",
									fontSize: "13px",
									fontWeight: "500",
									marginBottom: "6px",
									color: "#374151",
								}}
							>
								Expense Description (e.g., Groceries, Transport)
							</label>
							<input
								type="text"
								value={expenseName}
								onChange={(e) => setExpenseName(e.target.value)}
								placeholder="Enter expense name"
								style={{
									width: "100%",
									padding: "8px 12px",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
								}}
							/>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "13px",
									fontWeight: "500",
									marginBottom: "6px",
									color: "#374151",
								}}
							>
								Amount (₹)
							</label>
							<input
								type="number"
								value={expenseAmount}
								onChange={(e) => setExpenseAmount(e.target.value)}
								min="0"
								step="0.01"
								placeholder="0.00"
								style={{
									width: "100%",
									padding: "8px 12px",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
								}}
							/>
						</div>

						<div
							style={{
								display: "flex",
								gap: "12px",
							}}
						>
							<button
								onClick={() => {
									addExpense();
									setShowExpenseModal(false);
								}}
								style={{
									flex: 1,
									padding: "10px 16px",
									backgroundColor: "#9333ea",
									color: "white",
									borderRadius: "8px",
									fontWeight: "600",
									border: "none",
									cursor: "pointer",
								}}
							>
								Add Expense
							</button>
							<button
								onClick={() => setShowExpenseModal(false)}
								style={{
									flex: 1,
									padding: "10px 16px",
									backgroundColor: "#e5e7eb",
									color: "#374151",
									borderRadius: "8px",
									fontWeight: "600",
									border: "none",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}{" "}
			{/* Order Details Modal */}
			{selectedOrder && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 50,
					}}
					onClick={() => setSelectedOrder(null)}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "12px",
							padding: "24px",
							maxWidth: "600px",
							width: "90%",
							maxHeight: "80vh",
							overflowY: "auto",
							boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "20px",
								paddingBottom: "12px",
								borderBottom: "1px solid #e5e7eb",
							}}
						>
							<h2 style={{ fontSize: "18px", fontWeight: "600" }}>
								Order Details
							</h2>
							<button
								onClick={() => setSelectedOrder(null)}
								style={{
									background: "none",
									border: "none",
									fontSize: "24px",
									cursor: "pointer",
									color: "#6b7280",
								}}
							>
								✕
							</button>
						</div>

						{/* Order Info */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "16px",
								marginBottom: "20px",
							}}
						>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Order Number
								</p>
								<p style={{ fontSize: "16px", fontWeight: "600" }}>
									{selectedOrder.orderNumber}
								</p>
							</div>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Order Date
								</p>
								<p style={{ fontSize: "16px", fontWeight: "600" }}>
									{new Date(selectedOrder.createdAt).toLocaleDateString(
										"en-IN",
									)}
								</p>
							</div>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Meal Type
								</p>
								<p
									style={{
										fontSize: "16px",
										fontWeight: "600",
										textTransform: "capitalize",
									}}
								>
									{selectedOrder.mealType}
								</p>
							</div>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Customer
								</p>
								<p style={{ fontSize: "16px", fontWeight: "600" }}>
									{selectedOrder.customer?.name || "N/A"}
								</p>
							</div>
						</div>

						{/* Items List */}
						<div style={{ marginBottom: "20px" }}>
							<p
								style={{
									fontSize: "13px",
									fontWeight: "600",
									color: "#1f2937",
									marginBottom: "10px",
									textTransform: "uppercase",
								}}
							>
								Items
							</p>
							<div
								style={{
									backgroundColor: "#f9fafb",
									borderRadius: "8px",
									padding: "12px",
								}}
							>
								{(selectedOrder.items || []).map((item, idx) => (
									<div
										key={idx}
										style={{
											display: "flex",
											justifyContent: "space-between",
											paddingBottom: "8px",
											borderBottom:
												idx < selectedOrder.items.length - 1
													? "1px solid #e5e7eb"
													: "none",
											marginBottom:
												idx < selectedOrder.items.length - 1 ? "8px" : "0",
										}}
									>
										<div>
											<p style={{ fontSize: "14px", fontWeight: "500" }}>
												{item.name}
											</p>
											<p style={{ fontSize: "12px", color: "#6b7280" }}>
												Qty: {item.quantity} × ₹{item.pricePerPerson}
											</p>
										</div>
										<p
											style={{
												fontSize: "14px",
												fontWeight: "600",
												color: "#1f2937",
											}}
										>
											₹
											{(item.quantity * item.pricePerPerson).toLocaleString(
												"en-IN",
											)}
										</p>
									</div>
								))}
							</div>
						</div>

						{/* Amount Details */}
						<div
							style={{
								backgroundColor: "#f3f4f6",
								borderRadius: "8px",
								padding: "16px",
								marginBottom: "20px",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "8px",
								}}
							>
								<p style={{ color: "#6b7280" }}>Total Amount:</p>
								<p style={{ fontWeight: "600" }}>
									₹{(selectedOrder.totalAmount || 0).toLocaleString("en-IN")}
								</p>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "8px",
								}}
							>
								<p style={{ color: "#6b7280" }}>Advance Paid:</p>
								<p style={{ fontWeight: "600", color: "#059669" }}>
									₹{(selectedOrder.advancePaid || 0).toLocaleString("en-IN")}
								</p>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									paddingTop: "8px",
									borderTop: "1px solid #d1d5db",
								}}
							>
								<p style={{ fontWeight: "600" }}>Balance Due:</p>
								<p
									style={{
										fontWeight: "600",
										color:
											Math.max(
												0,
												(selectedOrder.totalAmount || 0) -
													(selectedOrder.advancePaid || 0),
											) > 0
												? "#dc2626"
												: "#059669",
									}}
								>
									₹
									{Math.max(
										0,
										(selectedOrder.totalAmount || 0) -
											(selectedOrder.advancePaid || 0),
									).toLocaleString("en-IN")}
								</p>
							</div>
						</div>

						{/* Status Info */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "12px",
								marginBottom: "20px",
							}}
						>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Payment Status
								</p>
								<div
									style={{
										display: "inline-block",
										padding: "4px 12px",
										borderRadius: "9999px",
										fontSize: "12px",
										fontWeight: "600",
										backgroundColor:
											selectedOrder.paymentStatus === "Paid"
												? "#d1fae5"
												: selectedOrder.paymentStatus === "Partial"
													? "#fef3c7"
													: "#fee2e2",
										color:
											selectedOrder.paymentStatus === "Paid"
												? "#059669"
												: selectedOrder.paymentStatus === "Partial"
													? "#b45309"
													: "#dc2626",
									}}
								>
									{selectedOrder.paymentStatus}
								</div>
							</div>
							<div>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										fontWeight: "500",
										marginBottom: "4px",
										textTransform: "uppercase",
									}}
								>
									Order Status
								</p>
								<div
									style={{
										display: "inline-block",
										padding: "4px 12px",
										borderRadius: "9999px",
										fontSize: "12px",
										fontWeight: "600",
										backgroundColor:
											selectedOrder.orderStatus === "Completed"
												? "#d1fae5"
												: selectedOrder.orderStatus === "Delivered"
													? "#bfdbfe"
													: "#fef3c7",
										color:
											selectedOrder.orderStatus === "Completed"
												? "#059669"
												: selectedOrder.orderStatus === "Delivered"
													? "#1e40af"
													: "#b45309",
									}}
								>
									{selectedOrder.orderStatus || "Pending"}
								</div>
							</div>
						</div>

						{/* Close Button */}
						<button
							onClick={() => setSelectedOrder(null)}
							style={{
								width: "100%",
								padding: "10px 16px",
								backgroundColor: "#ea580c",
								color: "white",
								border: "none",
								borderRadius: "8px",
								fontSize: "14px",
								fontWeight: "600",
								cursor: "pointer",
							}}
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

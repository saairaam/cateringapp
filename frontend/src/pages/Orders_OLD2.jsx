import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const GST_RATE = 5;

const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
const mealLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

const defaultOrderConfig = (mealType) => ({
	mealType,
	notes: "",
	selectedItems: [],
});

function computeTotals(config, menuItems) {
	const items = menuItems.filter((m) => config.selectedItems.includes(m._id));
	const subtotal = items.reduce((s, m) => s + m.pricePerPerson, 0);
	const gstAmount = +(subtotal * (GST_RATE / 100)).toFixed(2);
	const totalAmount = +(subtotal + gstAmount).toFixed(2);
	return { subtotal, gstAmount, totalAmount, items };
}

function OrderModal({
	mealType,
	isOpen,
	onClose,
	customers,
	menuItems,
	onSubmit,
	submitting,
}) {
	const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
	const [orderConfigs, setOrderConfigs] = useState({});
	const [customerSearch, setCustomerSearch] = useState("");

	useEffect(() => {
		if (isOpen) {
			setSelectedCustomerIds([]);
			setOrderConfigs({});
			setCustomerSearch("");
		}
	}, [isOpen, mealType]);

	if (!isOpen) return null;

	// SUPER SIMPLE - just show a list
	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 9999,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "white",
					borderRadius: "12px",
					width: "90%",
					maxWidth: "700px",
					maxHeight: "80vh",
					overflow: "auto",
					padding: "20px",
					boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
					}}
				>
					<h2>
						{mealEmojis[mealType]} {mealLabels[mealType]} Orders
					</h2>
					<button
						onClick={onClose}
						style={{
							border: "none",
							background: "none",
							fontSize: "24px",
							cursor: "pointer",
						}}
					>
						×
					</button>
				</div>

				<p style={{ marginBottom: "10px" }}>Customers: {customers.length}</p>
				<p style={{ marginBottom: "20px" }}>
					Menu items: {menuItems.filter((m) => m.type === mealType).length}
				</p>

				<div
					style={{
						marginBottom: "20px",
						maxHeight: "300px",
						overflow: "auto",
						border: "1px solid #ccc",
						padding: "10px",
						borderRadius: "6px",
					}}
				>
					<h4>Customers:</h4>
					{customers.length === 0 ? (
						<p style={{ color: "#999" }}>No customers</p>
					) : (
						customers.map((c) => (
							<div
								key={c._id}
								style={{
									padding: "8px",
									borderBottom: "1px solid #eee",
									cursor: "pointer",
									background: selectedCustomerIds.includes(c._id)
										? "#fef3c7"
										: "white",
								}}
								onClick={() => {
									if (selectedCustomerIds.includes(c._id)) {
										setSelectedCustomerIds((prev) =>
											prev.filter((id) => id !== c._id),
										);
									} else {
										setSelectedCustomerIds((prev) => [...prev, c._id]);
										setOrderConfigs((prev) => ({
											...prev,
											[c._id]: defaultOrderConfig(mealType),
										}));
									}
								}}
							>
								{c.name} {c.phone && `(${c.phone})`}
							</div>
						))
					)}
				</div>

				<div
					style={{
						marginBottom: "20px",
						maxHeight: "300px",
						overflow: "auto",
						border: "1px solid #ccc",
						padding: "10px",
						borderRadius: "6px",
					}}
				>
					<h4>Menu Items:</h4>
					{menuItems
						.filter((m) => m.type === mealType && m.available)
						.map((item) => (
							<div
								key={item._id}
								style={{ padding: "8px", borderBottom: "1px solid #eee" }}
							>
								{item.name} - ₹{item.pricePerPerson}
							</div>
						))}
				</div>

				<div
					style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
				>
					<button
						onClick={onClose}
						style={{
							padding: "8px 16px",
							border: "1px solid #ccc",
							borderRadius: "6px",
							background: "white",
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						onClick={() => {
							if (selectedCustomerIds.length > 0) {
								onSubmit(mealType, selectedCustomerIds, orderConfigs);
							}
						}}
						disabled={selectedCustomerIds.length === 0 || submitting}
						style={{
							padding: "8px 16px",
							border: "none",
							borderRadius: "6px",
							background: selectedCustomerIds.length === 0 ? "#ccc" : "#0066cc",
							color: "white",
							cursor:
								selectedCustomerIds.length === 0 ? "not-allowed" : "pointer",
						}}
					>
						{submitting
							? "Creating..."
							: `Create Order (${selectedCustomerIds.length})`}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [menuItems, setMenuItems] = useState([]);
	const [activeModal, setActiveModal] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState({ text: "", type: "" });

	useEffect(() => {
		fetchAll();
	}, []);

	const fetchAll = async () => {
		try {
			const [ordersRes, custRes, menuRes] = await Promise.all([
				axios.get("/api/orders"),
				axios.get("/api/customers"),
				axios.get("/api/menu"),
			]);
			setOrders(ordersRes.data);
			setCustomers(custRes.data);
			setMenuItems(menuRes.data);
		} catch {
			showMsg("Failed to load data", "error");
		}
	};

	const showMsg = (text, type = "success") => {
		setMessage({ text, type });
		setTimeout(() => setMessage({ text: "", type: "" }), 4000);
	};

	const handleSubmitOrders = async (mealType, customerIds, configs) => {
		setSubmitting(true);
		try {
			await Promise.all(
				customerIds.map((cid) => {
					const cfg = configs[cid];
					const { subtotal, gstAmount, totalAmount } = computeTotals(
						cfg,
						menuItems,
					);
					const orderItems = menuItems
						.filter((m) => cfg.selectedItems.includes(m._id))
						.map((m) => ({
							menuItem: m._id,
							name: m.name,
							pricePerPerson: m.pricePerPerson,
						}));
					return axios.post("/api/orders", {
						customer: cid,
						mealType,
						items: orderItems,
						subtotal,
						gstRate: GST_RATE,
						gstAmount,
						totalAmount,
						notes: cfg.notes,
					});
				}),
			);
			showMsg(
				`${customerIds.length} ${mealLabels[mealType]} order(s) created!`,
			);
			setActiveModal(null);
			fetchAll();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error", "error");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Delete this order?")) return;
		try {
			await axios.delete("/api/orders/" + id);
			fetchAll();
		} catch {
			showMsg("Error deleting", "error");
		}
	};

	return (
		<div style={{ padding: "24px", maxWidth: "1280px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "24px",
				}}
			>
				<h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Orders</h1>
				<div style={{ display: "flex", gap: "8px" }}>
					{["breakfast", "lunch", "dinner"].map((meal) => (
						<button
							key={meal}
							onClick={() => setActiveModal(meal)}
							style={{
								background:
									meal === "breakfast"
										? "#2563eb"
										: meal === "lunch"
											? "#ea580c"
											: "#a855f7",
								color: "white",
								padding: "8px 16px",
								borderRadius: "6px",
								border: "none",
								cursor: "pointer",
								fontSize: "14px",
								fontWeight: "600",
							}}
						>
							{mealEmojis[meal]} {mealLabels[meal]}
						</button>
					))}
				</div>
			</div>

			{message.text && (
				<div
					style={{
						marginBottom: "16px",
						padding: "12px",
						borderRadius: "6px",
						background: message.type === "error" ? "#fee2e2" : "#dcfce7",
						color: message.type === "error" ? "#7f1d1d" : "#166534",
						border: `1px solid ${message.type === "error" ? "#fecaca" : "#86efac"}`,
					}}
				>
					{message.text}
				</div>
			)}

			<OrderModal
				mealType="breakfast"
				isOpen={activeModal === "breakfast"}
				onClose={() => setActiveModal(null)}
				customers={customers}
				menuItems={menuItems}
				onSubmit={handleSubmitOrders}
				submitting={submitting}
			/>
			<OrderModal
				mealType="lunch"
				isOpen={activeModal === "lunch"}
				onClose={() => setActiveModal(null)}
				customers={customers}
				menuItems={menuItems}
				onSubmit={handleSubmitOrders}
				submitting={submitting}
			/>
			<OrderModal
				mealType="dinner"
				isOpen={activeModal === "dinner"}
				onClose={() => setActiveModal(null)}
				customers={customers}
				menuItems={menuItems}
				onSubmit={handleSubmitOrders}
				submitting={submitting}
			/>

			<div
				style={{
					background: "white",
					borderRadius: "8px",
					boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
					padding: "24px",
				}}
			>
				<h2
					style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}
				>
					All Orders ({orders.length})
				</h2>

				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "1px solid #f3f4f6" }}>
							{[
								"Order #",
								"Customer",
								"Meal Type",
								"Total",
								"Payment",
								"Status",
							].map((h) => (
								<th
									key={h}
									style={{
										textAlign: "left",
										padding: "8px",
										fontSize: "12px",
										fontWeight: "600",
										color: "#6b7280",
										textTransform: "uppercase",
									}}
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{orders.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									style={{
										textAlign: "center",
										padding: "32px",
										color: "#999",
									}}
								>
									No orders yet
								</td>
							</tr>
						) : (
							orders.map((order) => (
								<tr
									key={order._id}
									style={{ borderBottom: "1px solid #f3f4f6" }}
								>
									<td
										style={{
											padding: "12px",
											fontWeight: "bold",
											color: "#ea580c",
										}}
									>
										{order.orderNumber}
									</td>
									<td style={{ padding: "12px" }}>
										{order.customer?.name || "N/A"}
									</td>
									<td style={{ padding: "12px", textTransform: "capitalize" }}>
										{order.mealType}
									</td>
									<td style={{ padding: "12px", fontWeight: "600" }}>
										₹{order.totalAmount?.toLocaleString("en-IN") || 0}
									</td>
									<td style={{ padding: "12px" }}>
										<span
											style={{
												padding: "2px 8px",
												borderRadius: "4px",
												fontSize: "12px",
												background:
													order.paymentStatus === "Paid"
														? "#dcfce7"
														: order.paymentStatus === "Partial"
															? "#fef3c7"
															: "#fee2e2",
												color:
													order.paymentStatus === "Paid"
														? "#166534"
														: order.paymentStatus === "Partial"
															? "#92400e"
															: "#7f1d1d",
											}}
										>
											{order.paymentStatus}
										</span>
									</td>
									<td style={{ padding: "12px" }}>
										<span
											style={{
												padding: "2px 8px",
												borderRadius: "4px",
												fontSize: "12px",
												background: "#e0e7ff",
												color: "#3730a3",
											}}
										>
											{order.orderStatus}
										</span>
									</td>
									<td style={{ padding: "12px", textAlign: "right" }}>
										<button
											onClick={() => handleDelete(order._id)}
											style={{
												background: "#fee2e2",
												color: "#7f1d1d",
												border: "none",
												padding: "4px 8px",
												borderRadius: "4px",
												cursor: "pointer",
												fontSize: "12px",
											}}
										>
											Delete
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

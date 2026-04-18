import { useState, useEffect } from "react";
import axios from "axios";

const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
const mealLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

const defaultOrderConfig = (mealType) => ({
	mealType,
	notes: "",
	selectedItems: [],
});

function computeTotals(config, menuItems) {
	let subtotal = 0;
	const itemsData = [];

	Object.entries(config.selectedItems).forEach(([itemId, quantity]) => {
		const item = menuItems.find((m) => m._id === itemId);
		if (item) {
			const itemTotal = item.pricePerPerson * quantity;
			subtotal += itemTotal;
			itemsData.push({
				...item,
				quantity,
				itemTotal,
			});
		}
	});

	const totalAmount = +subtotal.toFixed(2);
	return { subtotal, totalAmount, items: itemsData };
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
	const [selectedCustomer, setSelectedCustomer] = useState("");
	const [selectedItems, setSelectedItems] = useState({});
	const [customerSearch, setCustomerSearch] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setSelectedCustomer("");
			setSelectedItems({});
			setCustomerSearch("");
			setShowDropdown(false);
		}
	}, [isOpen, mealType]);

	if (!isOpen) return null;

	const mealTypeItems = menuItems.filter(
		(m) => m.type === mealType && m.available,
	);

	const filteredCustomers = customers.filter(
		(c) =>
			c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
			(c.phone || "").includes(customerSearch),
	);

	const selectedCustomerObj = customers.find((c) => c._id === selectedCustomer);

	const handleSelectItem = (itemId) => {
		setSelectedItems((prev) => {
			if (prev[itemId]) {
				const newItems = { ...prev };
				delete newItems[itemId];
				return newItems;
			} else {
				return { ...prev, [itemId]: 1 };
			}
		});
	};

	const handleSetQuantity = (itemId, quantity) => {
		if (quantity <= 0) {
			setSelectedItems((prev) => {
				const newItems = { ...prev };
				delete newItems[itemId];
				return newItems;
			});
		} else {
			setSelectedItems((prev) => ({ ...prev, [itemId]: quantity }));
		}
	};

	const totalPrice = Object.entries(selectedItems).reduce(
		(sum, [itemId, qty]) => {
			const item = menuItems.find((m) => m._id === itemId);
			return sum + (item?.pricePerPerson || 0) * qty;
		},
		0,
	);

	const selectedItemsArray = Object.keys(selectedItems);

	const handleSubmit = () => {
		if (!selectedCustomer || selectedItemsArray.length === 0) {
			alert("Please select a customer and at least one menu item");
			return;
		}

		const orderConfig = {
			mealType,
			notes: "",
			selectedItems,
		};

		onSubmit(mealType, [selectedCustomer], { [selectedCustomer]: orderConfig });

		// Reset
		setSelectedCustomer("");
		setSelectedItems({});
		setCustomerSearch("");
	};

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
					maxWidth: "800px",
					maxHeight: "85vh",
					overflow: "auto",
					padding: "24px",
					boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "24px",
					}}
				>
					<h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
						{mealEmojis[mealType]} Create {mealLabels[mealType]} Order
					</h2>
					<button
						onClick={onClose}
						style={{
							border: "none",
							background: "none",
							fontSize: "28px",
							cursor: "pointer",
							color: "#666",
						}}
					>
						×
					</button>
				</div>

				{/* Customer Dropdown */}
				<div style={{ marginBottom: "24px" }}>
					<label
						style={{
							display: "block",
							fontSize: "14px",
							fontWeight: "600",
							marginBottom: "8px",
							color: "#333",
						}}
					>
						Select Customer <span style={{ color: "red" }}>*</span>
					</label>
					<div style={{ position: "relative" }}>
						<div
							onClick={() => setShowDropdown(!showDropdown)}
							style={{
								padding: "10px 12px",
								border: "1px solid #d1d5db",
								borderRadius: "8px",
								background: "white",
								cursor: "pointer",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								fontSize: "14px",
							}}
						>
							<span>
								{selectedCustomerObj
									? selectedCustomerObj.name
									: "Choose a customer..."}
							</span>
							<span style={{ color: "#666" }}>▼</span>
						</div>

						{showDropdown && (
							<div
								style={{
									position: "absolute",
									top: "100%",
									left: 0,
									right: 0,
									background: "white",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									marginTop: "4px",
									boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
									zIndex: 10,
									overflow: "hidden",
								}}
							>
								<input
									type="text"
									placeholder="Search customers..."
									value={customerSearch}
									onChange={(e) => setCustomerSearch(e.target.value)}
									style={{
										width: "100%",
										padding: "10px 12px",
										border: "none",
										borderBottom: "1px solid #e5e7eb",
										fontSize: "14px",
										boxSizing: "border-box",
									}}
								/>
								<div style={{ maxHeight: "250px", overflowY: "auto" }}>
									{filteredCustomers.length === 0 ? (
										<div
											style={{
												padding: "12px",
												color: "#999",
												textAlign: "center",
												fontSize: "13px",
											}}
										>
											No customers found
										</div>
									) : (
										filteredCustomers.map((c) => (
											<div
												key={c._id}
												onClick={() => {
													setSelectedCustomer(c._id);
													setShowDropdown(false);
													setCustomerSearch("");
												}}
												style={{
													padding: "12px",
													borderBottom: "1px solid #f3f4f6",
													cursor: "pointer",
													background:
														selectedCustomer === c._id ? "#fef3c7" : "white",
													fontSize: "14px",
												}}
												onMouseEnter={(e) => {
													if (selectedCustomer !== c._id) {
														e.target.style.background = "#f9fafb";
													}
												}}
												onMouseLeave={(e) => {
													if (selectedCustomer !== c._id) {
														e.target.style.background = "white";
													}
												}}
											>
												<div style={{ fontWeight: "600" }}>{c.name}</div>
												{c.phone && (
													<div style={{ fontSize: "12px", color: "#666" }}>
														{c.phone}
													</div>
												)}
											</div>
										))
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Menu Items */}
				<div style={{ marginBottom: "24px" }}>
					<label
						style={{
							display: "block",
							fontSize: "14px",
							fontWeight: "600",
							marginBottom: "8px",
							color: "#333",
						}}
					>
						Select Menu Items <span style={{ color: "red" }}>*</span>
					</label>
					<div
						style={{
							border: "1px solid #d1d5db",
							borderRadius: "8px",
							padding: "12px",
							minHeight: "250px",
							maxHeight: "300px",
							overflowY: "auto",
							background: "#fafafa",
						}}
					>
						{mealTypeItems.length === 0 ? (
							<div
								style={{
									textAlign: "center",
									color: "#999",
									paddingTop: "40px",
								}}
							>
								No menu items available for {mealLabels[mealType]}
							</div>
						) : (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr",
									gap: "8px",
								}}
							>
								{mealTypeItems.map((item) => {
									const isSelected = !!selectedItems[item._id];
									const quantity = selectedItems[item._id] || 0;
									return (
										<div
											key={item._id}
											style={{
												padding: "12px",
												background: isSelected ? "#fef3c7" : "white",
												border: isSelected
													? "2px solid #fb923c"
													: "1px solid #e5e7eb",
												borderRadius: "6px",
												cursor: "pointer",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												transition: "all 0.2s",
											}}
											onMouseEnter={(e) => {
												if (!isSelected) {
													e.currentTarget.style.borderColor = "#fb923c";
													e.currentTarget.style.background = "#fffbeb";
												}
											}}
											onMouseLeave={(e) => {
												if (!isSelected) {
													e.currentTarget.style.borderColor = "#e5e7eb";
													e.currentTarget.style.background = "white";
												}
											}}
										>
											<div
												onClick={() => handleSelectItem(item._id)}
												style={{ flex: 1, cursor: "pointer" }}
											>
												<div
													style={{
														fontWeight: "600",
														fontSize: "14px",
														color: "#1f2937",
													}}
												>
													{item.name}
												</div>
												{item.description && (
													<div
														style={{
															fontSize: "12px",
															color: "#666",
															marginTop: "2px",
														}}
													>
														{item.description}
													</div>
												)}
											</div>
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "flex-end",
													marginLeft: "12px",
													whiteSpace: "nowrap",
												}}
											>
												<div
													style={{
														fontWeight: "bold",
														color: "#ea580c",
														fontSize: "15px",
														marginBottom: "6px",
													}}
												>
													₹{item.pricePerPerson}
												</div>
												{isSelected && (
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: "6px",
														}}
													>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSetQuantity(item._id, quantity - 1);
															}}
															style={{
																width: "24px",
																height: "24px",
																padding: 0,
																border: "1px solid #fb923c",
																background: "#fff",
																color: "#fb923c",
																borderRadius: "4px",
																cursor: "pointer",
																fontWeight: "bold",
																fontSize: "12px",
															}}
														>
															−
														</button>
														<span
															style={{
																width: "30px",
																textAlign: "center",
																fontWeight: "bold",
																color: "#fb923c",
																fontSize: "14px",
															}}
														>
															{quantity}
														</span>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSetQuantity(item._id, quantity + 1);
															}}
															style={{
																width: "24px",
																height: "24px",
																padding: 0,
																border: "1px solid #fb923c",
																background: "#fb923c",
																color: "#fff",
																borderRadius: "4px",
																cursor: "pointer",
																fontWeight: "bold",
																fontSize: "12px",
															}}
														>
															+
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Selected Summary */}
					{Object.keys(selectedItems).length > 0 && (
						<div
							style={{
								marginBottom: "24px",
								padding: "12px",
								background: "#f0fdf4",
								border: "1px solid #86efac",
								borderRadius: "8px",
							}}
						>
							<div
								style={{
									fontSize: "13px",
									color: "#166534",
									fontWeight: "600",
									marginBottom: "8px",
								}}
							>
								📋 Selected Items
							</div>
							<div
								style={{
									fontSize: "12px",
									color: "#166534",
									marginBottom: "8px",
								}}
							>
								{Object.entries(selectedItems).map(([itemId, qty]) => {
									const item = menuItems.find((m) => m._id === itemId);
									return (
										<div key={itemId} style={{ marginBottom: "4px" }}>
											{item?.name} × {qty}
										</div>
									);
								})}
							</div>
							<div
								style={{
									fontSize: "13px",
									color: "#166534",
									fontWeight: "600",
									paddingTop: "8px",
									borderTop: "1px solid #86efac",
								}}
							>
								Total: ₹{totalPrice.toLocaleString("en-IN")}
							</div>
						</div>
					)}

					{/* Buttons */}
					<div
						style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
					>
						<button
							onClick={onClose}
							style={{
								padding: "10px 20px",
								border: "1px solid #d1d5db",
								borderRadius: "8px",
								background: "white",
								color: "#374151",
								cursor: "pointer",
								fontSize: "14px",
								fontWeight: "600",
							}}
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={
								!selectedCustomer ||
								Object.keys(selectedItems).length === 0 ||
								submitting
							}
							style={{
								padding: "10px 20px",
								border: "none",
								borderRadius: "8px",
								background:
									!selectedCustomer || Object.keys(selectedItems).length === 0
										? "#d1d5db"
										: "#ea580c",
								color: "white",
								cursor:
									!selectedCustomer || Object.keys(selectedItems).length === 0
										? "not-allowed"
										: "pointer",
								fontSize: "14px",
								fontWeight: "600",
								opacity:
									!selectedCustomer || Object.keys(selectedItems).length === 0
										? 0.5
										: 1,
							}}
						>
							{submitting ? "Creating..." : "Create Order"}
						</button>
					</div>
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
	const [exportDate, setExportDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [editingOrder, setEditingOrder] = useState(null);
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0],
	);

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
					const { subtotal, totalAmount } = computeTotals(cfg, menuItems);
					const customer = customers.find((c) => c._id === cid);
					const advancePaid = Math.min(customer?.advance || 0, totalAmount);
					const balanceDue = totalAmount - advancePaid;
					const paymentStatus =
						balanceDue === 0 ? "Paid" : advancePaid > 0 ? "Partial" : "Pending";

					const orderItems = Object.entries(cfg.selectedItems).map(
						([itemId, quantity]) => {
							const item = menuItems.find((m) => m._id === itemId);
							return {
								menuItem: itemId,
								name: item?.name || "",
								pricePerPerson: item?.pricePerPerson || 0,
								quantity,
							};
						},
					);

					return axios.post("/api/orders", {
						customer: cid,
						mealType,
						items: orderItems,
						subtotal,
						totalAmount,
						advancePaid,
						balanceDue,
						paymentStatus,
						notes: cfg.notes,
					});
				}),
			);
			// Update customer advances
			await Promise.all(
				customerIds.map((cid) => {
					const cfg = configs[cid];
					const { totalAmount } = computeTotals(cfg, menuItems);
					const customer = customers.find((c) => c._id === cid);
					const advancePaid = Math.min(customer?.advance || 0, totalAmount);
					const newAdvance = Math.max(
						0,
						(customer?.advance || 0) - advancePaid,
					);
					return axios.put(`/api/customers/${cid}`, {
						...customer,
						advance: newAdvance,
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

	const handleExportPDF = async () => {
		try {
			const response = await axios.get(
				`/api/orders/export/pdf?date=${exportDate}`,
				{
					responseType: "arraybuffer",
				},
			);
			const pdfBlob = new Blob([response.data], { type: "application/pdf" });
			const url = window.URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `Orders_${exportDate}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);
			showMsg("PDF exported successfully!");
		} catch (err) {
			showMsg(err.response?.data?.message || "Error exporting PDF", "error");
		}
	};

	const handleEditOrder = (order) => {
		setEditingOrder({
			...order,
			paymentStatus: order.paymentStatus || "Pending",
			orderStatus: order.orderStatus || "Confirmed",
		});
	};

	const handleUpdateOrder = async () => {
		if (!editingOrder) return;
		setSubmitting(true);
		try {
			await axios.put(`/api/orders/${editingOrder._id}`, {
				paymentStatus: editingOrder.paymentStatus,
				orderStatus: editingOrder.orderStatus,
				notes: editingOrder.notes,
			});
			showMsg("Order updated successfully!");
			setEditingOrder(null);
			fetchAll();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error updating order", "error");
		} finally {
			setSubmitting(false);
		}
	};

	const handleComplete = async (order) => {
		setSubmitting(true);
		try {
			// Update order status to Paid & Completed
			// Also set advancePaid = totalAmount so balance due becomes 0
			await axios.put(`/api/orders/${order._id}`, {
				paymentStatus: "Paid",
				orderStatus: "Completed",
				advancePaid: order.totalAmount,
				balanceDue: 0,
			});

			// Update customer account if there was a balance due
			if (order.balanceDue > 0) {
				const customer = customers.find((c) => c._id === order.customer._id);
				if (customer) {
					const newAdvance = Math.max(
						0,
						(customer.advance || 0) - order.balanceDue,
					);
					await axios.put(`/api/customers/${customer._id}`, {
						...customer,
						advance: newAdvance,
					});
				}
			}

			showMsg("Order marked as Complete & Paid! Customer account updated.");
			fetchAll();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error updating order", "error");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelivered = async (order) => {
		setSubmitting(true);
		try {
			await axios.put(`/api/orders/${order._id}`, {
				orderStatus: "Completed",
			});
			showMsg("Order marked as Delivered!");
			fetchAll();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error updating order", "error");
		} finally {
			setSubmitting(false);
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
				<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

			{/* Export Section */}
			<div
				style={{
					marginBottom: "24px",
					padding: "16px",
					background: "#f0fdf4",
					border: "1px solid #86efac",
					borderRadius: "8px",
					display: "flex",
					gap: "12px",
					alignItems: "center",
				}}
			>
				<label
					style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}
				>
					Export Orders as PDF:
				</label>
				<input
					type="date"
					value={exportDate}
					onChange={(e) => setExportDate(e.target.value)}
					style={{
						padding: "8px 12px",
						border: "1px solid #86efac",
						borderRadius: "6px",
						fontSize: "14px",
					}}
				/>
				<button
					onClick={handleExportPDF}
					style={{
						background: "#22c55e",
						color: "white",
						padding: "8px 16px",
						borderRadius: "6px",
						border: "none",
						cursor: "pointer",
						fontSize: "14px",
						fontWeight: "600",
					}}
				>
					📥 Export to PDF
				</button>
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
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "16px",
						gap: "12px",
						flexWrap: "wrap",
					}}
				>
					<h2
						style={{ fontSize: "18px", fontWeight: "600", marginBottom: "0" }}
					>
						Orders for {new Date(selectedDate).toLocaleDateString("en-IN")} (
						{
							orders.filter(
								(o) =>
									new Date(o.createdAt).toLocaleDateString("en-IN") ===
									new Date(selectedDate).toLocaleDateString("en-IN"),
							).length
						}{" "}
						total)
					</h2>
					<input
						type="date"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						style={{
							padding: "8px 12px",
							border: "1px solid #e5e7eb",
							borderRadius: "6px",
							fontSize: "14px",
						}}
					/>
				</div>

				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "1px solid #f3f4f6" }}>
							{[
								"Order #",
								"Customer",
								"Meal Type",
								"Total",
								"Advance Paid",
								"Balance",
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
						{orders.filter(
							(o) =>
								new Date(o.createdAt).toLocaleDateString("en-IN") ===
								new Date(selectedDate).toLocaleDateString("en-IN"),
						).length === 0 ? (
							<tr>
								<td
									colSpan={8}
									style={{
										textAlign: "center",
										padding: "32px",
										color: "#999",
									}}
								>
									No orders for this date
								</td>
							</tr>
						) : (
							orders
								.filter(
									(o) =>
										new Date(o.createdAt).toLocaleDateString("en-IN") ===
										new Date(selectedDate).toLocaleDateString("en-IN"),
								)
								.map((order) => {
									const calculatedBalance = Math.max(
										0,
										(order.totalAmount || 0) - (order.advancePaid || 0),
									);
									return (
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
											<td
												style={{ padding: "12px", textTransform: "capitalize" }}
											>
												{order.mealType}
											</td>
											<td style={{ padding: "12px", fontWeight: "600" }}>
												₹{order.totalAmount?.toLocaleString("en-IN") || 0}
											</td>
											<td
												style={{
													padding: "12px",
													color: "#059669",
													fontWeight: "600",
												}}
											>
												₹{(order.advancePaid || 0).toLocaleString("en-IN")}
											</td>
											<td
												style={{
													padding: "12px",
													color: calculatedBalance > 0 ? "#dc2626" : "#059669",
													fontWeight: "600",
												}}
											>
												₹{calculatedBalance.toLocaleString("en-IN")}
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
													onClick={() => handleComplete(order)}
													style={{
														background: "#dcfce7",
														color: "#166534",
														border: "none",
														padding: "4px 8px",
														borderRadius: "4px",
														cursor: "pointer",
														fontSize: "12px",
														marginRight: "4px",
														fontWeight: "600",
													}}
												>
													✓ Complete
												</button>
												<button
													onClick={() => handleDelivered(order)}
													style={{
														background: "#fef3c7",
														color: "#92400e",
														border: "none",
														padding: "4px 8px",
														borderRadius: "4px",
														cursor: "pointer",
														fontSize: "12px",
														marginRight: "4px",
														fontWeight: "600",
													}}
												>
													📦 Delivered
												</button>
												<button
													onClick={() => handleEditOrder(order)}
													style={{
														background: "#dbeafe",
														color: "#1e40af",
														border: "none",
														padding: "4px 8px",
														borderRadius: "4px",
														cursor: "pointer",
														fontSize: "12px",
														marginRight: "4px",
													}}
												>
													Edit
												</button>
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
									);
								})
						)}
					</tbody>
				</table>
			</div>

			{/* Order Modals */}
			{["breakfast", "lunch", "dinner"].map((meal) => (
				<OrderModal
					key={meal}
					mealType={meal}
					isOpen={activeModal === meal}
					onClose={() => setActiveModal(null)}
					customers={customers}
					menuItems={menuItems}
					onSubmit={handleSubmitOrders}
					submitting={submitting}
				/>
			))}

			{/* Edit Order Modal */}
			{editingOrder && (
				<div
					onClick={() => setEditingOrder(null)}
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
							maxHeight: "85vh",
							overflow: "auto",
							padding: "24px",
							boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "24px",
							}}
						>
							<h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
								📋 Order #{editingOrder.orderNumber}
							</h2>
							<button
								onClick={() => setEditingOrder(null)}
								style={{
									border: "none",
									background: "none",
									fontSize: "28px",
									cursor: "pointer",
									color: "#666",
								}}
							>
								×
							</button>
						</div>

						{/* Customer Info */}
						<div
							style={{
								marginBottom: "20px",
								padding: "16px",
								background: "#f0fdf4",
								border: "1px solid #86efac",
								borderRadius: "8px",
							}}
						>
							<h3
								style={{
									margin: "0 0 12px 0",
									fontSize: "14px",
									fontWeight: "600",
									color: "#166534",
								}}
							>
								👤 Customer Details
							</h3>
							<div style={{ fontSize: "14px", color: "#333" }}>
								<div style={{ marginBottom: "6px" }}>
									<strong>Name:</strong> {editingOrder.customer?.name || "N/A"}
								</div>
								{editingOrder.customer?.phone && (
									<div style={{ marginBottom: "6px" }}>
										<strong>Phone:</strong> {editingOrder.customer.phone}
									</div>
								)}
								{editingOrder.customer?.address && (
									<div style={{ marginBottom: "6px" }}>
										<strong>Address:</strong> {editingOrder.customer.address}
										{editingOrder.customer.city &&
											`, ${editingOrder.customer.city}`}
									</div>
								)}
							</div>
						</div>

						{/* Order Items */}
						<div
							style={{
								marginBottom: "20px",
								padding: "16px",
								background: "#fef3c7",
								border: "1px solid #fcd34d",
								borderRadius: "8px",
							}}
						>
							<h3
								style={{
									margin: "0 0 12px 0",
									fontSize: "14px",
									fontWeight: "600",
									color: "#92400e",
								}}
							>
								🍽️ Order Items
							</h3>
							<div style={{ overflowX: "auto" }}>
								<table
									style={{
										width: "100%",
										fontSize: "13px",
										borderCollapse: "collapse",
									}}
								>
									<thead>
										<tr style={{ borderBottom: "2px solid #fcd34d" }}>
											<th
												style={{
													textAlign: "left",
													padding: "8px",
													color: "#92400e",
													fontWeight: "600",
												}}
											>
												Item
											</th>
											<th
												style={{
													textAlign: "center",
													padding: "8px",
													color: "#92400e",
													fontWeight: "600",
												}}
											>
												Qty
											</th>
											<th
												style={{
													textAlign: "right",
													padding: "8px",
													color: "#92400e",
													fontWeight: "600",
												}}
											>
												Price
											</th>
										</tr>
									</thead>
									<tbody>
										{editingOrder.items && editingOrder.items.length > 0 ? (
											editingOrder.items.map((item, idx) => {
												const itemName = item.menuItem?.name || item.name;
												const itemPrice = item.pricePerPerson || 0;
												return (
													<tr
														key={idx}
														style={{ borderBottom: "1px solid #fef08a" }}
													>
														<td style={{ padding: "8px", color: "#333" }}>
															{itemName}
														</td>
														<td
															style={{
																padding: "8px",
																textAlign: "center",
																color: "#333",
															}}
														>
															1
														</td>
														<td
															style={{
																padding: "8px",
																textAlign: "right",
																color: "#333",
																fontWeight: "600",
															}}
														>
															₹{itemPrice.toLocaleString("en-IN")}
														</td>
													</tr>
												);
											})
										) : (
											<tr>
												<td
													colSpan="3"
													style={{
														padding: "12px",
														textAlign: "center",
														color: "#999",
													}}
												>
													No items in this order
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* Order Summary */}
						<div
							style={{
								marginBottom: "20px",
								padding: "16px",
								background: "#ede9fe",
								border: "1px solid #ddd6fe",
								borderRadius: "8px",
							}}
						>
							<h3
								style={{
									margin: "0 0 12px 0",
									fontSize: "14px",
									fontWeight: "600",
									color: "#5b21b6",
								}}
							>
								💰 Order Summary
							</h3>
							<div style={{ fontSize: "13px", color: "#333" }}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: "6px",
									}}
								>
									<span>Subtotal:</span>
									<span style={{ fontWeight: "600" }}>
										₹{(editingOrder.subtotal || 0).toLocaleString("en-IN")}
									</span>
								</div>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: "6px",
									}}
								>
									<span>Advance Paid:</span>
									<span style={{ fontWeight: "600", color: "#059669" }}>
										-₹{(editingOrder.advancePaid || 0).toLocaleString("en-IN")}
									</span>
								</div>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: "6px",
										paddingTop: "6px",
										borderTop: "1px solid #ddd6fe",
									}}
								>
									<span style={{ fontWeight: "600" }}>Balance Due:</span>
									<span
										style={{
											fontWeight: "600",
											color:
												editingOrder.balanceDue > 0 ? "#dc2626" : "#059669",
										}}
									>
										₹{(editingOrder.balanceDue || 0).toLocaleString("en-IN")}
									</span>
								</div>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginTop: "8px",
										paddingTop: "8px",
										borderTop: "2px solid #ddd6fe",
										fontSize: "14px",
									}}
								>
									<span style={{ fontWeight: "bold" }}>Total:</span>
									<span
										style={{
											fontWeight: "bold",
											color: "#ea580c",
											fontSize: "15px",
										}}
									>
										₹{(editingOrder.totalAmount || 0).toLocaleString("en-IN")}
									</span>
								</div>
							</div>
						</div>

						{/* Editable Fields */}
						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "14px",
									fontWeight: "600",
									marginBottom: "8px",
									color: "#333",
								}}
							>
								Payment Status
							</label>
							<select
								value={editingOrder.paymentStatus}
								onChange={(e) =>
									setEditingOrder({
										...editingOrder,
										paymentStatus: e.target.value,
									})
								}
								style={{
									width: "100%",
									padding: "10px 12px",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
								}}
							>
								<option value="Pending">Pending</option>
								<option value="Partial">Partial</option>
								<option value="Paid">Paid</option>
							</select>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "14px",
									fontWeight: "600",
									marginBottom: "8px",
									color: "#333",
								}}
							>
								Order Status
							</label>
							<select
								value={editingOrder.orderStatus}
								onChange={(e) =>
									setEditingOrder({
										...editingOrder,
										orderStatus: e.target.value,
									})
								}
								style={{
									width: "100%",
									padding: "10px 12px",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
								}}
							>
								<option value="Confirmed">Confirmed</option>
								<option value="In-Progress">In-Progress</option>
								<option value="Completed">Completed</option>
								<option value="Cancelled">Cancelled</option>
							</select>
						</div>

						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "14px",
									fontWeight: "600",
									marginBottom: "8px",
									color: "#333",
								}}
							>
								Notes
							</label>
							<textarea
								value={editingOrder.notes || ""}
								onChange={(e) =>
									setEditingOrder({
										...editingOrder,
										notes: e.target.value,
									})
								}
								style={{
									width: "100%",
									padding: "10px 12px",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									fontSize: "14px",
									boxSizing: "border-box",
									fontFamily: "inherit",
									minHeight: "80px",
									resize: "vertical",
								}}
								placeholder="Add any notes..."
							/>
						</div>

						<div
							style={{
								display: "flex",
								gap: "12px",
								justifyContent: "flex-end",
							}}
						>
							<button
								onClick={() => setEditingOrder(null)}
								style={{
									padding: "10px 20px",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									background: "white",
									color: "#374151",
									cursor: "pointer",
									fontSize: "14px",
									fontWeight: "600",
								}}
							>
								Close
							</button>
							<button
								onClick={handleUpdateOrder}
								disabled={submitting}
								style={{
									padding: "10px 20px",
									border: "none",
									borderRadius: "8px",
									background: "#ea580c",
									color: "white",
									cursor: submitting ? "not-allowed" : "pointer",
									fontSize: "14px",
									fontWeight: "600",
									opacity: submitting ? 0.5 : 1,
								}}
							>
								{submitting ? "Updating..." : "Update Order"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

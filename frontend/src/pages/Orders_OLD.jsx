import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const GST_RATE = 5;

const inputCls =
	"w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

const payColor = (s) =>
	({
		Paid: "bg-green-100 text-green-700",
		Partial: "bg-yellow-100 text-yellow-700",
		Pending: "bg-red-100 text-red-700",
	})[s] || "bg-red-100 text-red-700";

// Default order config per customer slot
const defaultOrderConfig = (mealType) => ({
	mealType,
	notes: "",
	selectedItems: [],
});

// Compute totals for one order config
function computeTotals(config, menuItems) {
	const items = menuItems.filter((m) => config.selectedItems.includes(m._id));
	const subtotal = items.reduce((s, m) => s + m.pricePerPerson, 0);
	const gstAmount = +(subtotal * (GST_RATE / 100)).toFixed(2);
	const totalAmount = +(subtotal + gstAmount).toFixed(2);
	return { subtotal, gstAmount, totalAmount, items };
}

const mealEmojis = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
const mealLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

// ─── Single customer order panel inside the modal ──────────────────────────
function CustomerOrderPanel({
	customer,
	config,
	menuItems,
	mealType,
	onChange,
	onRemove,
}) {
	const filteredMenu = menuItems.filter(
		(m) => m.type === mealType && m.available,
	);
	const { subtotal, gstAmount, totalAmount, items } = computeTotals(
		config,
		menuItems,
	);

	const set = (field) => (e) =>
		onChange({ ...config, [field]: e.target.value });

	const toggleItem = (id) => {
		const next = config.selectedItems.includes(id)
			? config.selectedItems.filter((i) => i !== id)
			: [...config.selectedItems, id];
		onChange({ ...config, selectedItems: next });
	};

	return (
		<div className="border border-orange-200 rounded-xl overflow-hidden mb-4">
			{/* Header */}
			<div className="flex items-center justify-between bg-orange-50 px-4 py-3 border-b border-orange-200">
				<div className="flex items-center gap-2">
					<span className="w-7 h-7 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
						{customer.name.charAt(0).toUpperCase()}
					</span>
					<div>
						<p className="text-sm font-semibold text-gray-800">
							{customer.name}
						</p>
						{customer.phone && (
							<p className="text-xs text-gray-500">{customer.phone}</p>
						)}
					</div>
				</div>
				<button
					onClick={onRemove}
					className="text-red-400 hover:text-red-600 text-lg font-bold leading-none"
				>
					×
				</button>
			</div>

			{/* Order fields */}
			<div className="p-4">
				<div className="mb-4">
					<label className="block text-xs font-semibold text-gray-500 mb-1">
						Notes
					</label>
					<input
						type="text"
						value={config.notes}
						onChange={set("notes")}
						placeholder="Special requirements…"
						className={inputCls}
					/>
				</div>

				{/* Menu item picker */}
				<p className="text-xs font-semibold text-gray-600 mb-2 capitalize">
					Select {mealLabels[mealType]} items *
				</p>
				{filteredMenu.length === 0 ? (
					<p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2">
						No {mealLabels[mealType]} items available. Add them in the Menu page
						first.
					</p>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
						{filteredMenu.map((item) => {
							const selected = config.selectedItems.includes(item._id);
							return (
								<div
									key={item._id}
									onClick={() => toggleItem(item._id)}
									className={
										"border-2 rounded-lg p-2 cursor-pointer select-none transition-all " +
										(selected
											? "border-orange-500 bg-orange-50"
											: "border-gray-200 hover:border-orange-300 bg-white")
									}
								>
									<div className="flex justify-between items-center">
										<span className="text-xs font-semibold text-gray-800 truncate">
											{item.name}
										</span>
										{selected && (
											<span className="text-orange-500 text-xs ml-1 shrink-0">
												✓
											</span>
										)}
									</div>
									<span className="text-xs text-green-700 font-bold">
										₹{item.pricePerPerson.toLocaleString("en-IN")}
									</span>
								</div>
							);
						})}
					</div>
				)}

				{/* Mini summary */}
				{config.selectedItems.length > 0 && (
					<div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs space-y-1">
						<div className="flex justify-between text-gray-600">
							<span>Subtotal</span>
							<span>₹{subtotal.toLocaleString("en-IN")}</span>
						</div>
						<div className="flex justify-between text-gray-600">
							<span>GST (5%)</span>
							<span>₹{gstAmount.toLocaleString("en-IN")}</span>
						</div>
						<div className="flex justify-between font-bold text-gray-900">
							<span>Total</span>
							<span>₹{totalAmount.toLocaleString("en-IN")}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Modal Component ──────────────────────────────────────────────────────
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

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setSelectedCustomerIds([]);
			setOrderConfigs({});
			setCustomerSearch("");
		}
	}, [isOpen, mealType]);

	if (!isOpen) return null;

	if (customers.length === 0) {
		return (
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0, 0, 0, 0.7)",
					zIndex: 9999,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				onClick={onClose}
			>
				<div
					style={{
						backgroundColor: "white",
						padding: "40px",
						borderRadius: "8px",
						textAlign: "center",
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<p>No customers. Please add customers first.</p>
					<button onClick={onClose}>Close</button>
				</div>
			</div>
		);
	}

	const addCustomer = (cid) => {
		if (selectedCustomerIds.includes(cid)) return;
		setSelectedCustomerIds((prev) => [...prev, cid]);
		setOrderConfigs((prev) => ({
			...prev,
			[cid]: defaultOrderConfig(mealType),
		}));
	};

	const removeCustomer = (cid) => {
		setSelectedCustomerIds((prev) => prev.filter((id) => id !== cid));
		setOrderConfigs((prev) => {
			const n = { ...prev };
			delete n[cid];
			return n;
		});
	};

	const updateConfig = useCallback((cid, config) => {
		setOrderConfigs((prev) => ({ ...prev, [cid]: config }));
	}, []);

	const filteredCustomers = customers.filter(
		(c) =>
			!selectedCustomerIds.includes(c._id) &&
			(c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
				(c.phone || "").includes(customerSearch)),
	);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (selectedCustomerIds.length === 0) {
			alert("Select at least one customer.");
			return;
		}

		for (const cid of selectedCustomerIds) {
			const cfg = orderConfigs[cid];
			if (cfg.selectedItems.length === 0) {
				const cust = customers.find((c) => c._id === cid);
				alert(`Select at least one menu item for ${cust?.name}.`);
				return;
			}
		}

		await onSubmit(mealType, selectedCustomerIds, orderConfigs);
		setSelectedCustomerIds([]);
		setOrderConfigs({});
		setCustomerSearch("");
	};

	return (
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
				zIndex: 9999,
			}}
			onClick={onClose}
		>
			<div
				style={{
					backgroundColor: "white",
					borderRadius: "12px",
					boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
					maxWidth: "900px",
					width: "90%",
					maxHeight: "90vh",
					overflow: "auto",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "20px 24px",
						borderBottom: "1px solid #e5e7eb",
					}}
				>
					<h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
						{mealEmojis[mealType]} Create {mealLabels[mealType]} Orders
					</h2>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: "28px",
							cursor: "pointer",
							color: "#666",
							padding: 0,
						}}
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: 0,
							minHeight: "400px",
						}}
					>
						{/* Left: Customer picker */}
						<div
							style={{
								flex: "0 0 300px",
								padding: "20px",
								borderRight: "1px solid #e5e7eb",
								overflowY: "auto",
							}}
						>
							<p
								style={{
									fontSize: "14px",
									fontWeight: "600",
									color: "#374151",
									marginBottom: "12px",
									margin: "0 0 12px 0",
								}}
							>
								1. Pick Customers
								{selectedCustomerIds.length > 0 && (
									<span
										style={{
											marginLeft: "10px",
											fontSize: "12px",
											backgroundColor: "#fed7aa",
											color: "#b45309",
											padding: "2px 8px",
											borderRadius: "12px",
										}}
									>
										{selectedCustomerIds.length} selected
									</span>
								)}
							</p>
							<input
								type="text"
								placeholder="🔍 Search…"
								value={customerSearch}
								onChange={(e) => setCustomerSearch(e.target.value)}
								style={{
									width: "100%",
									border: "1px solid #d1d5db",
									borderRadius: "8px",
									padding: "10px 12px",
									fontSize: "14px",
									marginBottom: "12px",
									boxSizing: "border-box",
									outlineColor: "#fb923c",
								}}
							/>

							<div
								style={{ display: "flex", flexDirection: "column", gap: "6px" }}
							>
								{filteredCustomers.length === 0 ? (
									<p
										style={{
											fontSize: "13px",
											color: "#999",
											textAlign: "center",
											paddingTop: "16px",
										}}
									>
										{customers.length === 0
											? "No customers yet. Add them first."
											: "All customers selected or no match."}
									</p>
								) : (
									filteredCustomers.map((c) => (
										<button
											key={c._id}
											type="button"
											onClick={() => addCustomer(c._id)}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "10px",
												padding: "10px 12px",
												borderRadius: "8px",
												border: "1px solid transparent",
												backgroundColor: "#f9fafb",
												cursor: "pointer",
												textAlign: "left",
												transition: "all 0.2s",
											}}
											onMouseEnter={(e) => {
												e.target.style.backgroundColor = "#fef3c7";
												e.target.style.borderColor = "#fcd34d";
											}}
											onMouseLeave={(e) => {
												e.target.style.backgroundColor = "#f9fafb";
												e.target.style.borderColor = "transparent";
											}}
										>
											<span
												style={{
													width: "32px",
													height: "32px",
													backgroundColor: "#f3f4f6",
													color: "#666",
													fontSize: "12px",
													fontWeight: "bold",
													borderRadius: "50%",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													flexShrink: 0,
												}}
											>
												{c.name.charAt(0).toUpperCase()}
											</span>
											<div style={{ overflow: "hidden", flex: 1 }}>
												<p
													style={{
														fontSize: "14px",
														fontWeight: "500",
														color: "#1f2937",
														margin: "0 0 2px 0",
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
												>
													{c.name}
												</p>
												{c.phone && (
													<p
														style={{
															fontSize: "12px",
															color: "#999",
															margin: 0,
														}}
													>
														{c.phone}
													</p>
												)}
											</div>
											<span
												style={{
													color: "#fb923c",
													fontWeight: "bold",
													flexShrink: 0,
												}}
											>
												+
											</span>
										</button>
									))
								)}
							</div>
						</div>

						{/* Right: Menu items and config */}
						<div
							style={{
								flex: 1,
								padding: "20px",
								overflowY: "auto",
							}}
						>
							<p
								style={{
									fontSize: "14px",
									fontWeight: "600",
									color: "#374151",
									marginBottom: "16px",
									margin: "0 0 16px 0",
								}}
							>
								2. {mealLabels[mealType]} Menu Items
							</p>

							{selectedCustomerIds.length === 0 ? (
								<div
									style={{
										textAlign: "center",
										paddingTop: "60px",
										color: "#999",
									}}
								>
									<p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>👈</p>
									<p style={{ fontSize: "14px", margin: 0 }}>
										Select customers from the left to configure their orders
									</p>
								</div>
							) : (
								<div>
									{selectedCustomerIds.map((cid) => {
										const customer = customers.find((c) => c._id === cid);
										const config =
											orderConfigs[cid] || defaultOrderConfig(mealType);
										const mealTypeItems = menuItems.filter(
											(m) => m.type === mealType && m.available,
										);
										const totals = computeTotals(config, mealTypeItems);

										return (
											<div
												key={cid}
												style={{
													marginBottom: "20px",
													padding: "16px",
													border: "1px solid #e5e7eb",
													borderRadius: "8px",
													backgroundColor: "#fafafa",
												}}
											>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														marginBottom: "12px",
													}}
												>
													<p
														style={{
															fontSize: "14px",
															fontWeight: "600",
															color: "#1f2937",
															margin: 0,
														}}
													>
														{customer?.name}
													</p>
													<button
														type="button"
														onClick={() => removeCustomer(cid)}
														style={{
															background: "none",
															border: "1px solid #ef4444",
															color: "#ef4444",
															padding: "4px 12px",
															borderRadius: "4px",
															cursor: "pointer",
															fontSize: "12px",
															fontWeight: "600",
														}}
													>
														Remove
													</button>
												</div>

												<div
													style={{
														marginBottom: "12px",
														display: "flex",
														flexWrap: "wrap",
														gap: "8px",
													}}
												>
													{mealTypeItems.map((item) => {
														const isSelected = config.selectedItems.some(
															(si) => si.menuItemId === item._id,
														);
														return (
															<button
																key={item._id}
																type="button"
																onClick={() => {
																	const newItems = isSelected
																		? config.selectedItems.filter(
																				(si) => si.menuItemId !== item._id,
																			)
																		: [
																				...config.selectedItems,
																				{
																					menuItemId: item._id,
																					name: item.name,
																					pricePerPerson: item.pricePerPerson,
																				},
																			];
																	updateConfig(cid, {
																		...config,
																		selectedItems: newItems,
																	});
																}}
																style={{
																	padding: "8px 12px",
																	borderRadius: "6px",
																	border: isSelected
																		? "2px solid #fb923c"
																		: "1px solid #d1d5db",
																	backgroundColor: isSelected
																		? "#fef3c7"
																		: "white",
																	color: isSelected ? "#b45309" : "#374151",
																	cursor: "pointer",
																	fontSize: "13px",
																	fontWeight: isSelected ? "600" : "500",
																	transition: "all 0.2s",
																}}
															>
																{item.name} (₹{item.pricePerPerson})
															</button>
														);
													})}
												</div>

												{config.selectedItems.length > 0 && (
													<div
														style={{
															fontSize: "12px",
															color: "#666",
															paddingTop: "8px",
															borderTop: "1px solid #e5e7eb",
														}}
													>
														<p style={{ margin: "4px 0" }}>
															<strong>Subtotal:</strong> ₹{totals.subtotal}
														</p>
														<p style={{ margin: "4px 0" }}>
															<strong>GST (5%):</strong> ₹{totals.gstAmount}
														</p>
														<p
															style={{
																margin: "4px 0",
																fontSize: "13px",
																fontWeight: "600",
																color: "#1f2937",
															}}
														>
															<strong>Total:</strong> ₹{totals.totalAmount}
														</p>
													</div>
												)}

												<textarea
													value={config.notes || ""}
													onChange={(e) =>
														updateConfig(cid, {
															...config,
															notes: e.target.value,
														})
													}
													placeholder="Notes (optional)..."
													style={{
														width: "100%",
														marginTop: "8px",
														padding: "8px",
														border: "1px solid #d1d5db",
														borderRadius: "4px",
														fontSize: "12px",
														fontFamily: "inherit",
														boxSizing: "border-box",
														minHeight: "40px",
													}}
												/>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* Footer */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "16px 24px",
							borderTop: "1px solid #e5e7eb",
							backgroundColor: "#f9fafb",
							borderBottomLeftRadius: "12px",
							borderBottomRightRadius: "12px",
						}}
					>
						<p
							style={{
								fontSize: "13px",
								color: "#666",
								margin: 0,
							}}
						>
							{selectedCustomerIds.length === 0
								? "No customers selected"
								: `Creating ${selectedCustomerIds.length} order(s)`}
						</p>
						<div style={{ display: "flex", gap: "12px" }}>
							<button
								type="button"
								onClick={onClose}
								style={{
									backgroundColor: "white",
									border: "1px solid #d1d5db",
									color: "#374151",
									padding: "8px 20px",
									borderRadius: "6px",
									fontSize: "14px",
									fontWeight: "600",
									cursor: "pointer",
									transition: "all 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.target.style.backgroundColor = "#f3f4f6")
								}
								onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={submitting || selectedCustomerIds.length === 0}
								style={{
									backgroundColor:
										submitting || selectedCustomerIds.length === 0
											? "#d1d5db"
											: "#fb923c",
									color: "white",
									padding: "8px 20px",
									borderRadius: "6px",
									fontSize: "14px",
									fontWeight: "600",
									border: "none",
									cursor:
										submitting || selectedCustomerIds.length === 0
											? "not-allowed"
											: "pointer",
									transition: "all 0.2s",
									opacity:
										submitting || selectedCustomerIds.length === 0 ? 0.6 : 1,
								}}
								onMouseEnter={(e) => {
									if (!(submitting || selectedCustomerIds.length === 0)) {
										e.target.style.backgroundColor = "#ea580c";
									}
								}}
								onMouseLeave={(e) => {
									if (!(submitting || selectedCustomerIds.length === 0)) {
										e.target.style.backgroundColor = "#fb923c";
									}
								}}
							>
								{submitting
									? "Creating…"
									: `Create ${selectedCustomerIds.length > 1 ? selectedCustomerIds.length + " Orders" : "Order"}`}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

// ─── Main Orders page ──────────────────────────────────────────────────────
export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [menuItems, setMenuItems] = useState([]);

	const [activeModal, setActiveModal] = useState(null); // "breakfast", "lunch", "dinner", or null
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
			showMsg("Failed to load data from server", "error");
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
					const { subtotal, gstAmount, totalAmount, items } = computeTotals(
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
				`${customerIds.length} ${mealLabels[mealType]} order(s) created successfully!`,
			);
			setActiveModal(null);
			fetchAll();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error creating orders", "error");
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
			showMsg("Error deleting order", "error");
		}
	};

	return (
		<div className="p-6 max-w-7xl">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Orders</h1>
				<div className="flex gap-2">
					<button
						onClick={() => setActiveModal("breakfast")}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
					>
						🌅 Breakfast
					</button>
					<button
						onClick={() => setActiveModal("lunch")}
						className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
					>
						☀️ Lunch
					</button>
					<button
						onClick={() => setActiveModal("dinner")}
						className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
					>
						🌙 Dinner
					</button>
				</div>
			</div>

			{message.text && (
				<div
					className={
						"mb-4 p-3 rounded-lg text-sm border " +
						(message.type === "error"
							? "bg-red-50 text-red-700 border-red-200"
							: "bg-green-50 text-green-700 border-green-200")
					}
				>
					{message.text}
				</div>
			)}

			{/* Modals */}
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

			{/* ── Orders table ── */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h2 className="text-base font-semibold text-gray-800 mb-4">
					All Orders
					<span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
						{orders.length}
					</span>
				</h2>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-100">
								{[
									"Order #",
									"Customer",
									"Meal Type",
									"Total",
									"Payment",
									"Status",
									"",
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
							{orders.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="text-center py-12 text-gray-400 text-sm"
									>
										No orders yet. Click a meal type button to create one.
									</td>
								</tr>
							) : (
								orders.map((order) => (
									<tr
										key={order._id}
										className="border-b border-gray-50 hover:bg-orange-50/30"
									>
										<td className="py-3 px-2 font-bold text-orange-600 text-xs whitespace-nowrap">
											{order.orderNumber}
										</td>
										<td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">
											{order.customer?.name || "N/A"}
										</td>
										<td className="py-3 px-2 capitalize text-gray-600">
											{mealEmojis[order.mealType]} {mealLabels[order.mealType]}
										</td>
										<td className="py-3 px-2 font-semibold text-gray-800 whitespace-nowrap">
											₹{(order.totalAmount || 0).toLocaleString("en-IN")}
										</td>
										<td className="py-3 px-2">
											<span
												className={
													"px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap " +
													payColor(order.paymentStatus)
												}
											>
												{order.paymentStatus}
											</span>
										</td>
										<td className="py-3 px-2 text-xs font-semibold text-blue-700">
											{order.orderStatus}
										</td>
										<td className="py-3 px-2">
											<button
												onClick={() => handleDelete(order._id)}
												className="text-red-400 hover:text-red-600 text-xs font-semibold"
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
		</div>
	);
}

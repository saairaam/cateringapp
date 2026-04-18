import { useState, useEffect } from "react";
import axios from "axios";

const EMPTY_FORM = {
	name: "",
	type: "breakfast",
	category: "",
	description: "",
	pricePerPerson: "",
	available: true,
};

const inputCls =
	"w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

const MEAL_ICONS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

function buildWhatsAppMessage(items, mealType) {
	const now = new Date();
	const dateStr = now.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
	const dayStr = now.toLocaleDateString("en-IN", { weekday: "long" });

	const mealLabels = {
		breakfast: "Breakfast Delights",
		lunch: "Lunch Delights",
		dinner: "Dinner Delights",
	};

	let msg = `🌼 Amrutham Homely Foods! 🌼\n`;
	msg += `* 100% Pure Veg 🥦\n`;
	msg += `* Home-cooked with care 👩‍🍳\n\n`;
	msg += `Date: ${dateStr}\n`;
	msg += `           ${dayStr}\n\n`;

	const typesToShow = mealType ? [mealType] : ["breakfast", "lunch", "dinner"];

	for (const type of typesToShow) {
		const mealItems = items.filter((i) => i.type === type && i.available);
		if (mealItems.length === 0) continue;
		msg += `${mealLabels[type]}\n\n`;
		for (const item of mealItems) {
			msg += `*${item.name} Rs. ${item.pricePerPerson}/-`;
			if (item.description) msg += `\n(${item.description})`;
			msg += `\n\n`;
		}
	}

	msg += `Delivery starts at 12.30pm\n`;
	msg += `✨ How to Order?\n\n`;
	msg += `WhatsApp your order to: +91 73580 92720\n\n`;
	msg += `Please place your orders before 10 am\n\n`;
	msg += `GPay no.9444992161\n\n`;
	msg += `🙏 Thank you for making us a part of your family's table. Enjoy the homely difference with every bite!🙏`;
	return msg;
}

export default function Menu() {
	const [items, setItems] = useState([]);
	const [form, setForm] = useState(EMPTY_FORM);
	const [editId, setEditId] = useState(null);
	const [activeTab, setActiveTab] = useState("breakfast");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState({ text: "", type: "" });
	const [menuText, setMenuText] = useState(null);
	const [copied, setCopied] = useState(false);
	const [mainTab, setMainTab] = useState("items");
	const [categories, setCategories] = useState([]);
	const [catName, setCatName] = useState("");
	const [catSaving, setCatSaving] = useState(false);

	useEffect(() => {
		fetchItems();
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			const { data } = await axios.get("/api/categories");
			setCategories(data);
		} catch {
			// silent
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		if (!catName.trim()) return;
		setCatSaving(true);
		try {
			await axios.post("/api/categories", { name: catName.trim() });
			setCatName("");
			fetchCategories();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error adding category", "error");
		} finally {
			setCatSaving(false);
		}
	};

	const handleDeleteCategory = async (id) => {
		if (!window.confirm("Delete this category?")) return;
		try {
			await axios.delete(`/api/categories/${id}`);
			fetchCategories();
		} catch {
			showMsg("Error deleting category", "error");
		}
	};

	const fetchItems = async () => {
		try {
			const { data } = await axios.get("/api/menu");
			setItems(data);
		} catch {
			showMsg("Failed to load menu items", "error");
		}
	};

	const showMsg = (text, type = "success") => {
		setMessage({ text, type });
		setTimeout(() => setMessage({ text: "", type: "" }), 3500);
	};

	const set = (field) => (e) =>
		setForm((f) => ({
			...f,
			[field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
		}));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const payload = {
				...form,
				pricePerPerson: parseFloat(form.pricePerPerson),
			};
			if (editId) {
				await axios.put(`/api/menu/${editId}`, payload);
				showMsg("Menu item updated!");
			} else {
				await axios.post("/api/menu", payload);
				showMsg("Menu item added!");
			}
			setForm({ ...EMPTY_FORM, type: activeTab });
			setEditId(null);
			fetchItems();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error saving item", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (item) => {
		setForm({
			name: item.name,
			type: item.type,
			category: item.category || "",
			description: item.description || "",
			pricePerPerson: item.pricePerPerson,
			available: item.available,
		});
		setEditId(item._id);
		setActiveTab(item.type);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Delete this menu item?")) return;
		try {
			await axios.delete(`/api/menu/${id}`);
			fetchItems();
		} catch {
			showMsg("Error deleting item", "error");
		}
	};

	const toggleAvailable = async (item) => {
		try {
			await axios.put(`/api/menu/${item._id}`, {
				...item,
				available: !item.available,
			});
			fetchItems();
		} catch {
			showMsg("Error updating item", "error");
		}
	};

	const tabItems = items.filter((i) => i.type === activeTab);

	// Group tabItems by category
	const grouped = tabItems.reduce((acc, item) => {
		const cat = item.category?.trim() || "Uncategorized";
		if (!acc[cat]) acc[cat] = [];
		acc[cat].push(item);
		return acc;
	}, {});

	return (
		<div className="p-6 max-w-7xl">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
				<div className="flex gap-2">
					{[
						{
							type: "breakfast",
							label: "🌅 Breakfast",
							color: "bg-amber-500 hover:bg-amber-600",
						},
						{
							type: "lunch",
							label: "☀️ Lunch",
							color: "bg-orange-500 hover:bg-orange-600",
						},
						{
							type: "dinner",
							label: "🌙 Dinner",
							color: "bg-indigo-500 hover:bg-indigo-600",
						},
					].map(({ type, label, color }) => (
						<button
							key={type}
							onClick={() => {
								setMenuText(buildWhatsAppMessage(items, type));
								setCopied(false);
							}}
							className={`px-3 py-2 ${color} text-white rounded-lg text-sm font-semibold transition-colors`}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			{/* Main Tabs */}
			<div className="flex gap-1 mb-6 border-b border-gray-200">
				{[
					{ key: "items", label: "🍽️ Menu Items" },
					{ key: "categories", label: "🏷️ Categories" },
				].map((t) => (
					<button
						key={t.key}
						onClick={() => setMainTab(t.key)}
						className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
							mainTab === t.key
								? "bg-white border border-b-white border-gray-200 text-orange-700 -mb-px"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Categories Tab */}
			{mainTab === "categories" && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<h2 className="text-base font-semibold text-gray-800 mb-4">
						Manage Categories
					</h2>
					{message.text && (
						<div
							className={`mb-4 p-3 rounded-lg text-sm ${
								message.type === "error"
									? "bg-red-50 text-red-700 border border-red-200"
									: "bg-green-50 text-green-700 border border-green-200"
							}`}
						>
							{message.text}
						</div>
					)}
					<form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
						<input
							type="text"
							value={catName}
							onChange={(e) => setCatName(e.target.value)}
							placeholder="e.g. Rice Dishes, Curries, Snacks"
							required
							className={inputCls}
						/>
						<button
							type="submit"
							disabled={catSaving}
							className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap disabled:opacity-50"
						>
							{catSaving ? "Adding…" : "+ Add Category"}
						</button>
					</form>
					{categories.length === 0 ? (
						<p className="text-gray-400 text-sm">
							No categories yet. Add one above.
						</p>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{categories.map((cat) => (
								<div
									key={cat._id}
									className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-4 py-2"
								>
									<span className="text-sm font-medium text-gray-800">
										{cat.name}
									</span>
									<button
										onClick={() => handleDeleteCategory(cat._id)}
										className="text-red-400 hover:text-red-600 ml-2 text-xs font-semibold"
									>
										✕
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Menu Items Tab */}
			{mainTab === "items" && (
				<>
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
						<h2 className="text-base font-semibold text-gray-800 mb-4">
							{editId ? "✏️ Edit Menu Item" : "➕ Add Menu Item"}
						</h2>

						{message.text && (
							<div
								className={`mb-4 p-3 rounded-lg text-sm ${
									message.type === "error"
										? "bg-red-50 text-red-700 border border-red-200"
										: "bg-green-50 text-green-700 border border-green-200"
								}`}
							>
								{message.text}
							</div>
						)}

						<form onSubmit={handleSubmit}>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div>
									<label className="block text-xs font-semibold text-gray-600 mb-1">
										Item Name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={form.name}
										onChange={set("name")}
										required
										placeholder="e.g. Masala Dosa, Chicken Biryani"
										className={inputCls}
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-gray-600 mb-1">
										Meal Type <span className="text-red-500">*</span>
									</label>
									<select
										value={form.type}
										onChange={set("type")}
										className={inputCls}
									>
										<option value="breakfast">🌅 Breakfast</option>
										<option value="lunch">☀️ Lunch</option>
										<option value="dinner">🌙 Dinner</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-gray-600 mb-1">
										Price per Person (₹) <span className="text-red-500">*</span>
									</label>
									<input
										type="number"
										value={form.pricePerPerson}
										onChange={set("pricePerPerson")}
										required
										min="0"
										step="0.01"
										placeholder="e.g. 250"
										className={inputCls}
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-gray-600 mb-1">
										Category
									</label>
									<select
										value={form.category}
										onChange={set("category")}
										className={inputCls}
									>
										<option value="">— No Category —</option>
										{categories.map((c) => (
											<option key={c._id} value={c.name}>
												{c.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-gray-600 mb-1">
										Description
									</label>
									<input
										type="text"
										value={form.description}
										onChange={set("description")}
										placeholder="Brief description of the dish"
										className={inputCls}
									/>
								</div>

								<div className="flex items-end pb-1">
									<label className="flex items-center gap-2 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={form.available}
											onChange={set("available")}
											className="w-4 h-4 accent-orange-600"
										/>
										<span className="text-sm font-medium text-gray-700">
											Mark as Available
										</span>
									</label>
								</div>
							</div>

							<div className="flex gap-3 mt-5">
								<button
									type="submit"
									disabled={loading}
									className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
								>
									{loading ? "Saving…" : editId ? "Update Item" : "Add Item"}
								</button>
								{editId && (
									<button
										type="button"
										onClick={() => {
											setForm({ ...EMPTY_FORM, type: activeTab });
											setEditId(null);
										}}
										className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-semibold"
									>
										Cancel
									</button>
								)}
							</div>
						</form>
					</div>

					{/* Menu List with Tabs */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						{/* Tab Bar */}
						<div className="flex border-b border-gray-200 bg-gray-50">
							{["breakfast", "lunch", "dinner"].map((tab) => {
								const count = items.filter((i) => i.type === tab).length;
								return (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`flex-1 py-3 text-sm font-semibold transition-colors ${
											activeTab === tab
												? "bg-white text-orange-700 border-b-2 border-orange-600"
												: "text-gray-500 hover:text-gray-700"
										}`}
									>
										{MEAL_ICONS[tab]}{" "}
										{tab.charAt(0).toUpperCase() + tab.slice(1)}
										<span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
											{count}
										</span>
									</button>
								);
							})}
						</div>

						<div className="p-6">
							{tabItems.length === 0 ? (
								<p className="text-gray-400 text-sm text-center py-10">
									No {activeTab} items yet. Add your first {activeTab} dish
									above.
								</p>
							) : (
								Object.entries(grouped).map(([cat, catItems]) => (
									<div key={cat} className="mb-6">
										<h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2 px-2 border-b border-orange-100 pb-1">
											🏷️ {cat}
										</h3>
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="border-b border-gray-100">
														{[
															"#",
															"Dish Name",
															"Description",
															"Price/Person",
															"Available",
															"Actions",
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
													{catItems.map((item, i) => (
														<tr
															key={item._id}
															className="border-b border-gray-50 hover:bg-orange-50/30"
														>
															<td className="py-3 px-2 text-gray-400 text-xs">
																{i + 1}
															</td>
															<td className="py-3 px-2 font-semibold text-gray-800">
																{item.name}
															</td>
															<td className="py-3 px-2 text-gray-500 max-w-xs truncate">
																{item.description || "—"}
															</td>
															<td className="py-3 px-2 font-bold text-green-700">
																₹
																{(item.pricePerPerson || 0).toLocaleString(
																	"en-IN",
																)}
															</td>
															<td className="py-3 px-2">
																<button
																	onClick={() => toggleAvailable(item)}
																	className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
																		item.available
																			? "bg-green-100 text-green-700 hover:bg-green-200"
																			: "bg-gray-100 text-gray-500 hover:bg-gray-200"
																	}`}
																>
																	{item.available ? "✓ Yes" : "✗ No"}
																</button>
															</td>
															<td className="py-3 px-2 space-x-3">
																<button
																	onClick={() => handleEdit(item)}
																	className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
																>
																	Edit
																</button>
																<button
																	onClick={() => handleDelete(item._id)}
																	className="text-red-500 hover:text-red-600 font-semibold text-xs"
																>
																	Delete
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</>
			)}

			{/* Menu Text Modal */}
			{menuText && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 50,
					}}
					onClick={() => setMenuText(null)}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "12px",
							padding: "24px",
							width: "90%",
							maxWidth: "520px",
							maxHeight: "80vh",
							display: "flex",
							flexDirection: "column",
							boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "12px",
							}}
						>
							<h2 style={{ fontSize: "16px", fontWeight: "600" }}>
								📋 Today's Menu Message
							</h2>
							<button
								onClick={() => setMenuText(null)}
								style={{
									background: "none",
									border: "none",
									fontSize: "18px",
									cursor: "pointer",
									color: "#6b7280",
								}}
							>
								✕
							</button>
						</div>
						<textarea
							readOnly
							value={menuText}
							style={{
								flex: 1,
								minHeight: "320px",
								border: "1px solid #e5e7eb",
								borderRadius: "8px",
								padding: "12px",
								fontSize: "13px",
								fontFamily: "monospace",
								resize: "none",
								outline: "none",
								whiteSpace: "pre-wrap",
							}}
						/>
						<div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
							<button
								onClick={() => {
									navigator.clipboard.writeText(menuText);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								}}
								style={{
									flex: 1,
									padding: "10px",
									backgroundColor: copied ? "#16a34a" : "#22c55e",
									color: "white",
									border: "none",
									borderRadius: "8px",
									fontWeight: "600",
									cursor: "pointer",
									fontSize: "14px",
								}}
							>
								{copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
							</button>
							<button
								onClick={() => setMenuText(null)}
								style={{
									flex: 1,
									padding: "10px",
									backgroundColor: "#e5e7eb",
									color: "#374151",
									border: "none",
									borderRadius: "8px",
									fontWeight: "600",
									cursor: "pointer",
									fontSize: "14px",
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

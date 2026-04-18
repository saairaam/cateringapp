import { useState, useEffect } from "react";
import axios from "axios";

const EMPTY_FORM = {
	name: "",
	phone: "",
	address: "",
	city: "",
	advance: "",
	notes: "",
};

const inputCls =
	"w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

function Field({ label, required, children }) {
	return (
		<div>
			<label className="block text-xs font-semibold text-gray-600 mb-1">
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			{children}
		</div>
	);
}

export default function Customers() {
	const [customers, setCustomers] = useState([]);
	const [form, setForm] = useState(EMPTY_FORM);
	const [editId, setEditId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [message, setMessage] = useState({ text: "", type: "" });

	useEffect(() => {
		fetchCustomers();
	}, []);

	const fetchCustomers = async () => {
		try {
			const { data } = await axios.get("/api/customers");
			setCustomers(data);
		} catch {
			showMsg("Failed to load customers", "error");
		}
	};

	const showMsg = (text, type = "success") => {
		setMessage({ text, type });
		setTimeout(() => setMessage({ text: "", type: "" }), 3500);
	};

	const set = (field) => (e) =>
		setForm((f) => ({ ...f, [field]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (editId) {
				await axios.put("/api/customers/" + editId, form);
				showMsg("Customer updated successfully!");
			} else {
				await axios.post("/api/customers", form);
				showMsg("Customer added successfully!");
			}
			setForm(EMPTY_FORM);
			setEditId(null);
			fetchCustomers();
		} catch (err) {
			showMsg(err.response?.data?.message || "Error saving customer", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (c) => {
		setForm({
			name: c.name,
			phone: c.phone,
			address: c.address || "",
			city: c.city || "",
			advance: c.advance ?? "",
			notes: c.notes || "",
		});
		setEditId(c._id);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Delete this customer? This cannot be undone.")) return;
		try {
			await axios.delete("/api/customers/" + id);
			fetchCustomers();
		} catch {
			showMsg("Error deleting customer", "error");
		}
	};

	const filtered = customers.filter(
		(c) =>
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			(c.phone || "").includes(search) ||
			(c.city || "").toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="p-6 max-w-7xl">
			<h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
				<h2 className="text-base font-semibold text-gray-800 mb-4">
					{editId ? "✏️ Edit Customer" : "➕ Add New Customer"}
				</h2>

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

				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<Field label="Full Name" required>
							<input
								type="text"
								value={form.name}
								onChange={set("name")}
								required
								placeholder="e.g. Ramesh Kumar"
								className={inputCls}
							/>
						</Field>
						<Field label="Phone Number">
							<input
								type="tel"
								value={form.phone}
								onChange={set("phone")}
								placeholder="+91 98765 43210"
								className={inputCls}
							/>
						</Field>
						<Field label="City">
							<input
								type="text"
								value={form.city}
								onChange={set("city")}
								placeholder="e.g. Mumbai"
								className={inputCls}
							/>
						</Field>
						<Field label="Full Address">
							<input
								type="text"
								value={form.address}
								onChange={set("address")}
								placeholder="House/Plot No., Street, Area"
								className={inputCls}
							/>
						</Field>
						<Field label="Notes">
							<input
								type="text"
								value={form.notes}
								onChange={set("notes")}
								placeholder="Additional notes or preferences"
								className={inputCls}
							/>
						</Field>
						<Field label="Advance Payment (₹)">
							<input
								type="number"
								value={form.advance}
								onChange={set("advance")}
								min="0"
								step="0.01"
								placeholder="e.g. 5000"
								className={inputCls}
							/>
						</Field>
					</div>

					<div className="flex gap-3 mt-5">
						<button
							type="submit"
							disabled={loading}
							className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
						>
							{loading
								? "Saving…"
								: editId
									? "Update Customer"
									: "Add Customer"}
						</button>
						{editId && (
							<button
								type="button"
								onClick={() => {
									setForm(EMPTY_FORM);
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

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
					<h2 className="text-base font-semibold text-gray-800">
						All Customers
						<span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
							{customers.length}
						</span>
					</h2>
					<input
						type="text"
						placeholder="🔍  Search by name, phone or city…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-orange-400"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-100">
								{[
									"#",
									"Name",
									"Phone",
									"City",
									"Advance",
									"Address",
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
							{filtered.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="text-center py-10 text-gray-400 text-sm"
									>
										{search
											? "No customers match your search."
											: "No customers yet. Add your first customer above."}
									</td>
								</tr>
							) : (
								filtered.map((c, i) => (
									<tr
										key={c._id}
										className="border-b border-gray-50 hover:bg-orange-50/40"
									>
										<td className="py-3 px-2 text-gray-400 text-xs">{i + 1}</td>
										<td className="py-3 px-2 font-semibold text-gray-800">
											{c.name}
										</td>
										<td className="py-3 px-2 text-gray-600">{c.phone}</td>
										<td className="py-3 px-2 text-gray-600">
											{c.city || "—"}
										</td>{" "}
										<td className="py-3 px-2 font-semibold text-green-700">
											{c.advance
												? "₹" + Number(c.advance).toLocaleString("en-IN")
												: "—"}
										</td>{" "}
										<td className="py-3 px-2 text-gray-500 max-w-xs truncate">
											{c.address || "—"}
										</td>
										<td className="py-3 px-2 space-x-3">
											<button
												onClick={() => handleEdit(c)}
												className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
											>
												Edit
											</button>
											<button
												onClick={() => handleDelete(c._id)}
												className="text-red-500 hover:text-red-600 font-semibold text-xs"
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

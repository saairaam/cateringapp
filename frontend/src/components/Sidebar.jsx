import { Link, useLocation } from "react-router-dom";

const navItems = [
	{ path: "/", label: "Dashboard", icon: "📊" },
	{ path: "/customers", label: "Customers", icon: "👥" },
	{ path: "/menu", label: "Menu", icon: "🍽️" },
	{ path: "/orders", label: "Orders", icon: "📋" },
	{ path: "/kitchen", label: "Kitchen", icon: "🍳" },
	{ path: "/accounts", label: "Accounts", icon: "💰" },
];

export default function Sidebar() {
	const location = useLocation();

	return (
		<div className="w-60 min-h-screen bg-orange-700 flex flex-col shadow-xl flex-shrink-0">
			{/* Logo */}
			<div className="p-5 border-b border-orange-600">
				<div className="flex items-center gap-3">
					<span className="text-3xl">🍛</span>
					<div>
						<h1 className="text-white text-base font-bold leading-tight">
							Amrutham
						</h1>
						<p className="text-orange-200 text-xs">Homely Food</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-3 space-y-1">
				{navItems.map((item) => {
					const active = location.pathname === item.path;
					return (
						<Link
							key={item.path}
							to={item.path}
							className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
								active
									? "bg-white text-orange-700 shadow-sm"
									: "text-orange-100 hover:bg-orange-600"
							}`}
						>
							<span className="text-base">{item.icon}</span>
							{item.label}
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="p-4 border-t border-orange-600">
				<p className="text-orange-300 text-xs text-center">🇮🇳 Made for India</p>
			</div>
		</div>
	);
}

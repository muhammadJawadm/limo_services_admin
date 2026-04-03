import { createElement } from "react"

const COLORS = {
  purple: { ring: "bg-[#C4963D]/10 border-[#C4963D]/20", icon: "text-[#C4963D]", bar: "from-[#C4963D] to-[#e6b85c]" },
  green:  { ring: "bg-green-50 border-green-200",   icon: "text-green-600",  bar: "from-green-500 to-green-400" },
  yellow: { ring: "bg-amber-50 border-amber-200",   icon: "text-amber-600",  bar: "from-amber-500 to-amber-400" },
  red:    { ring: "bg-red-50 border-red-200",       icon: "text-red-600",    bar: "from-red-500 to-red-400" },
  blue:   { ring: "bg-[#072030]/10 border-[#072030]/20", icon: "text-[#072030]", bar: "from-[#072030] to-[#1a3a50]" },
}

export default function StatCard({ icon: Icon, label, value, change, changeType = "up", color = "purple", suffix = "" }) {
  const c = COLORS[color] || COLORS.purple
  return (
    <div
      className="relative rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-200 group overflow-hidden bg-white border border-gray-200"
    >
      {/* Hover top accent */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${c.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.ring}`}>
          {createElement(Icon, { size: 20, className: c.icon })}
        </div>
        {change !== undefined && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            changeType === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {changeType === "up" ? "▲" : "▼"} {change}
          </span>
        )}
      </div>
      <div className="text-[28px] font-extrabold text-gray-900 leading-none mb-1.5">
        {value}{suffix}
      </div>
      <div className="text-[13px] text-gray-500 font-medium">{label}</div>
    </div>
  )
}

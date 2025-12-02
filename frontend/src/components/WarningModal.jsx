export default function WarningModal({ isOpen, title, children }) {
  if (!isOpen) return null; // means modal not open

  return (
    <div className="fixed inset-0 bg-zinc-800 bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

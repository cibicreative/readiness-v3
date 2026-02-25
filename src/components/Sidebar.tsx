import { Users } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0F2147] text-white flex flex-col">
      <div className="p-6 border-b border-[#2B3D66]">
        <img
          src="/white_logo.png"
          alt="CiBi Creative"
          className="w-full max-w-[200px] mb-3"
        />
        <h2 className="text-sm font-medium text-gray-300 leading-tight">
          Process, People and Data Support
        </h2>
      </div>

      <nav className="flex-1 p-4">
        <a
          href="#/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#2B3D66] transition-colors"
        >
          <Users size={20} />
          <span>Clients</span>
        </a>
      </nav>

      <div className="p-4 border-t border-[#2B3D66] text-sm text-gray-300">
        CiBi Creative Consultant Portal
      </div>
    </aside>
  );
}

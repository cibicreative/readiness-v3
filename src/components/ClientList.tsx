import { useEffect, useState } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ClientForm from './ClientForm';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientWithStats extends Client {
  process_count?: number;
}

export default function ClientList() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: clientsDataRaw, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      const clientsData = clientsDataRaw as Client[] | null;

      if (fetchError) {
        console.error('Error loading clients:', fetchError);
        setError(`Database error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { count } = await supabase
            .from('processes')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id);

          return {
            ...client,
            process_count: count || 0,
          };
        })
      );

      setClients(clientsWithStats);
      setLoading(false);
    } catch (err) {
      console.error('Error loading clients:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection error: ${errorMessage}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;

    setDeleting(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', deleteClientId);

    if (error) {
      console.error('Error deleting client:', error);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setDeleteClientId(null);
    loadClients();
  };

  const clientToDelete = clients.find(c => c.id === deleteClientId);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F2147]">Clients</h1>
            <p className="text-gray-600 mt-1">Manage client engagements and assessments</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
          >
            <Plus size={20} />
            Add Client
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Unable to load clients</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <button
                  onClick={loadClients}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No clients yet. Add your first client to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F5F6] border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Industry</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Company Size</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Processes</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Contact</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <a
                        href={`#/client/${client.id}`}
                        className="text-[#0F2147] font-medium hover:text-[#D46A3D]"
                      >
                        {client.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{client.industry || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{client.company_size || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{client.process_count}</td>
                    <td className="px-6 py-4 text-gray-700">{client.primary_contact_name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <a
                          href={`#/client/${client.id}`}
                          className="inline-flex items-center gap-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                        >
                          <Eye size={16} />
                          <span className="text-sm">View</span>
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteClientId(client.id);
                          }}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            loadClients();
          }}
        />
      )}

      {deleteClientId && clientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#0F2147] mb-4">Delete Client</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{clientToDelete.name}</strong>? This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>All processes and process steps</li>
              <li>All people and their literacy assessments</li>
              <li>All roles</li>
              <li>All data sources and trust profiles</li>
              <li>Client share links and access tokens</li>
            </ul>
            <p className="text-red-600 font-medium text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteClientId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

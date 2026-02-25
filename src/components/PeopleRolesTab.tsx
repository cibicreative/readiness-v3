import { useEffect, useState } from 'react';
import { Plus, Edit, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import RoleForm from './RoleForm';
import PersonForm from './PersonForm';
import LiteracyAssessmentForm from './LiteracyAssessmentForm';

type Role = Database['public']['Tables']['roles']['Row'];
type Person = Database['public']['Tables']['people']['Row'];
type LiteracyAssessment = Database['public']['Tables']['literacy_assessments']['Row'];

interface PeopleRolesTabProps {
  clientId: string;
  readOnly?: boolean;
}

export default function PeopleRolesTab({ clientId, readOnly = false }: PeopleRolesTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [literacyAssessments, setLiteracyAssessments] = useState<LiteracyAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showLiteracyForm, setShowLiteracyForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [selectedPersonForLiteracy, setSelectedPersonForLiteracy] = useState<Person | undefined>();

  const loadData = async () => {
    setLoading(true);

    const [rolesRes, peopleRes, literacyRes] = await Promise.all([
      supabase.from('roles').select('*').eq('client_id', clientId).order('title'),
      supabase.from('people').select('*').eq('client_id', clientId).order('name'),
      supabase.from('literacy_assessments').select('*').order('assessment_date', { ascending: false }),
    ]);

    setRoles(rolesRes.data || []);
    setPeople(peopleRes.data || []);
    setLiteracyAssessments(literacyRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return '-';
    return roles.find(r => r.id === roleId)?.title || '-';
  };

  const getPeopleCountForRole = (roleId: string) => {
    return people.filter(p => p.role_id === roleId).length;
  };

  const getEffectiveRate = (person: Person) => {
    if (person.hourly_rate_override) return person.hourly_rate_override;
    if (!person.role_id) return null;
    return roles.find(r => r.id === person.role_id)?.hourly_rate || null;
  };

  const getLatestLiteracyLevel = (personId: string) => {
    const personAssessments = literacyAssessments.filter(a => a.person_id === personId);
    if (personAssessments.length === 0) return null;
    return personAssessments[0].overall_level;
  };

  const getLiteracyBadgeColor = (level: string | null) => {
    switch (level) {
      case 'novice': return 'bg-red-100 text-red-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'optimizer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0F2147]">Roles</h3>
            <p className="text-sm text-gray-600">Define job roles and standard rates</p>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowRoleForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
            >
              <Plus size={20} />
              Add Role
            </button>
          )}
        </div>

        {roles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No roles defined yet
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F5F6] border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Department</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Type</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Rate</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">People</th>
                  {!readOnly && <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0F2147]">{role.title}</td>
                    <td className="px-6 py-4 text-gray-700">{role.department || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 capitalize">{role.employment_type || '-'}</td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {role.hourly_rate ? `$${role.hourly_rate}/hr` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {getPeopleCountForRole(role.id)}
                    </td>
                    {!readOnly && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingRole(role);
                            setShowRoleForm(true);
                          }}
                          className="p-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0F2147]">People</h3>
            <p className="text-sm text-gray-600">Manage team members and their skills</p>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowPersonForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
            >
              <Plus size={20} />
              Add Person
            </button>
          )}
        </div>

        {people.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No people added yet
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F5F6] border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Role</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">AI and Data Literacy</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Effective Rate</th>
                  {!readOnly && <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {people.map((person) => {
                  const rate = getEffectiveRate(person);
                  const literacyLevel = getLatestLiteracyLevel(person.id);
                  return (
                    <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0F2147]">{person.name}</td>
                      <td className="px-6 py-4 text-gray-700">{getRoleName(person.role_id)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {literacyLevel ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getLiteracyBadgeColor(literacyLevel)}`}>
                              {literacyLevel}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not assessed</span>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => {
                                setSelectedPersonForLiteracy(person);
                                setShowLiteracyForm(true);
                              }}
                              className="p-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                              title="Manage AI and data literacy assessments"
                            >
                              <BookOpen size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {rate ? `$${rate}/hr` : '-'}
                      </td>
                      {!readOnly && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPerson(person);
                                setShowPersonForm(true);
                              }}
                              className="p-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                              title="Edit person"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRoleForm && (
        <RoleForm
          clientId={clientId}
          role={editingRole}
          onClose={() => {
            setShowRoleForm(false);
            setEditingRole(undefined);
          }}
          onSave={() => {
            setShowRoleForm(false);
            setEditingRole(undefined);
            loadData();
          }}
        />
      )}

      {showPersonForm && (
        <PersonForm
          clientId={clientId}
          roles={roles}
          person={editingPerson}
          onClose={() => {
            setShowPersonForm(false);
            setEditingPerson(undefined);
          }}
          onSave={() => {
            setShowPersonForm(false);
            setEditingPerson(undefined);
            loadData();
          }}
        />
      )}

      {showLiteracyForm && selectedPersonForLiteracy && (
        <LiteracyAssessmentForm
          personId={selectedPersonForLiteracy.id}
          personName={selectedPersonForLiteracy.name}
          onClose={() => {
            setShowLiteracyForm(false);
            setSelectedPersonForLiteracy(undefined);
          }}
          onSave={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { SalesRep } from '../types';
import { Plus, Trash2, User, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { resetToSampleData } from '../services/storageService';

interface SettingsProps {
  salesReps: SalesRep[];
  onAddRep: (rep: SalesRep) => void;
  onDeleteRep: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ salesReps, onAddRep, onDeleteRep }) => {
  const [newRep, setNewRep] = useState<Partial<SalesRep>>({
    name: '', team: '영업 1팀', department: '영업본부', role: 'staff', email: ''
  });

  const handleAdd = () => {
    if (!newRep.name || !newRep.email) {
      alert("이름과 이메일을 입력해주세요.");
      return;
    }
    const rep: SalesRep = {
      id: `s${Date.now()}`,
      name: newRep.name,
      team: newRep.team || '영업 1팀',
      department: newRep.department || '영업본부',
      role: newRep.role || 'staff',
      email: newRep.email
    };
    onAddRep(rep);
    setNewRep({ name: '', team: '영업 1팀', department: '영업본부', role: 'staff', email: '' });
  };

  const handleResetData = async () => {
      if(confirm("모든 데이터를 지우고 초기 샘플 데이터로 되돌리시겠습니까?")) {
          await resetToSampleData();
          window.location.reload();
      }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <SettingsIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">설정 (영업 직원 관리)</h2>
          </div>
          <button 
            onClick={handleResetData}
            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
          >
              <RefreshCw size={16} className="mr-2"/> 샘플 데이터로 초기화
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-700">직원 목록</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {salesReps.map(rep => (
                        <li key={rep.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 group">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                    {rep.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{rep.name} <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">{rep.role}</span></p>
                                    <p className="text-sm text-slate-500">{rep.team} | {rep.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { if(window.confirm('삭제하시겠습니까?')) onDeleteRep(rep.id); }}
                                className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                        </li>
                    ))}
                    {salesReps.length === 0 && (
                        <li className="px-6 py-8 text-center text-slate-400">등록된 직원이 없습니다.</li>
                    )}
                </ul>
            </div>
        </div>

        {/* Add Form Section */}
        <div>
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                    <Plus size={18} className="mr-2 text-indigo-600"/> 새 직원 등록
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이름</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newRep.name}
                            onChange={e => setNewRep({...newRep, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이메일</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newRep.email}
                            onChange={e => setNewRep({...newRep, email: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">팀</label>
                            <select 
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                                value={newRep.team}
                                onChange={e => setNewRep({...newRep, team: e.target.value})}
                            >
                                <option value="영업 1팀">영업 1팀</option>
                                <option value="영업 2팀">영업 2팀</option>
                                <option value="인사팀">인사팀</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">직책</label>
                            <select 
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                                value={newRep.role}
                                onChange={e => setNewRep({...newRep, role: e.target.value as any})}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="director">Director</option>
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                    >
                        추가하기
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

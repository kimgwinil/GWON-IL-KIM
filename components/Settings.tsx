
import React, { useState, useRef } from 'react';
import { SalesRep } from '../types';
import { Plus, Trash2, User, Settings as SettingsIcon, RefreshCw, Camera, Edit, UploadCloud } from 'lucide-react';
import { resetToSampleData } from '../services/storageService';

interface SettingsProps {
  salesReps: SalesRep[];
  onAddRep: (rep: SalesRep) => void;
  onUpdateRep?: (rep: SalesRep) => void; 
  onDeleteRep: (id: string) => void;
  onUploadSamples?: () => void; // New prop for uploading samples
}

const Settings: React.FC<SettingsProps> = ({ salesReps, onAddRep, onUpdateRep, onDeleteRep, onUploadSamples }) => {
  const [newRep, setNewRep] = useState<Partial<SalesRep>>({
    name: '', team: '영업 1팀', department: '영업본부', role: 'staff', email: '', phone: '', profilePicture: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

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
      email: newRep.email,
      phone: newRep.phone,
      profilePicture: newRep.profilePicture
    };
    onAddRep(rep);
    setNewRep({ name: '', team: '영업 1팀', department: '영업본부', role: 'staff', email: '', phone: '', profilePicture: '' });
  };

  const handleResetData = async () => {
      if(confirm("모든 데이터를 지우고 초기 샘플 데이터로 되돌리시겠습니까?")) {
          await resetToSampleData();
          window.location.reload();
      }
  }

  const handleUploadSamplesToSheet = () => {
      if (confirm("현재 화면의 샘플 데이터를 구글 시트에 업로드하시겠습니까?\n주의: 시트의 기존 데이터가 덮어씌워질 수 있습니다.")) {
          if (onUploadSamples) onUploadSamples();
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (isEdit && selectedRepId && onUpdateRep) {
                const rep = salesReps.find(r => r.id === selectedRepId);
                if (rep) {
                    onUpdateRep({ ...rep, profilePicture: base64String });
                }
            } else {
                setNewRep(prev => ({ ...prev, profilePicture: base64String }));
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const triggerEditUpload = (id: string) => {
      setSelectedRepId(id);
      editFileInputRef.current?.click();
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
          <div className="flex space-x-2">
            <button 
                onClick={handleUploadSamplesToSheet}
                className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium border border-emerald-100"
            >
                <UploadCloud size={16} className="mr-2"/> 구글 시트에 샘플 업로드
            </button>
            <button 
                onClick={handleResetData}
                className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
            >
                <RefreshCw size={16} className="mr-2"/> 샘플 데이터로 초기화
            </button>
          </div>
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
                                <div 
                                    className="relative h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => triggerEditUpload(rep.id)}
                                    title="사진 변경"
                                >
                                    {rep.profilePicture ? (
                                        <img src={rep.profilePicture} alt={rep.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span>{rep.name.charAt(0)}</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera size={16} className="text-white"/>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 flex items-center">
                                        {rep.name} 
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">{rep.role}</span>
                                    </p>
                                    <p className="text-sm text-slate-500">{rep.team} | {rep.email}</p>
                                    {rep.phone && <p className="text-xs text-slate-400 mt-0.5">{rep.phone}</p>}
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
                <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, true)} />
            </div>
        </div>

        {/* Add Form Section */}
        <div>
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                    <Plus size={18} className="mr-2 text-indigo-600"/> 새 직원 등록
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div 
                            className="h-20 w-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 overflow-hidden relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                             {newRep.profilePicture ? (
                                <img src={newRep.profilePicture} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <>
                                    <Camera size={24} className="text-slate-400 mb-1"/>
                                    <span className="text-[10px] text-slate-400">사진 업로드</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, false)} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이름 *</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newRep.name}
                            onChange={e => setNewRep({...newRep, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이메일 *</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newRep.email}
                            onChange={e => setNewRep({...newRep, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">전화번호</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newRep.phone || ''}
                            onChange={e => setNewRep({...newRep, phone: e.target.value})}
                            placeholder="010-0000-0000"
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

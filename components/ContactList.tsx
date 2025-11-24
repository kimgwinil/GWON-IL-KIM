
import React, { useState, useEffect, useMemo } from 'react';
import { Contact, AccountGrade, Deal, DealStatus, DealStage, ContactType } from '../types';
import { Search, Plus, Trash2, X, ChevronDown, ChevronUp, MapPin, Edit, ArrowUpDown, Calendar } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  deals: Deal[];
  onSelectContact: (contact: Contact) => void;
  onAddContact: (contact: Contact, initialDeal?: Deal) => void;
  onUpdateContact: (contact: Contact, deal?: Deal) => void;
  onDeleteContact: (contactId: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, deals, onSelectContact, onAddContact, onUpdateContact, onDeleteContact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Form State
  const [formContact, setFormContact] = useState<Partial<Contact>>({
      id: '', name: '', email: '', phone: '', company: '', address: '', role: '', department: '영업 1팀', targetAmount: 0, notes: [], grade: 'Unrated', type: 'Company', owner: '', team: ''
  });

  // Deal Form State
  const [includeDeal, setIncludeDeal] = useState(false);
  const [formDeal, setFormDeal] = useState<Partial<Deal>>({
      id: '', title: '', productAmount: 0, goodsAmount: 0, value: 0, status: '미정', itemDetails: '', expectedCloseDate: new Date().toISOString().split('T')[0], owner: '홍길동', team: '영업 1팀'
  });

  useEffect(() => {
      setFormDeal(prev => ({
          ...prev,
          value: (Number(prev.productAmount) || 0) + (Number(prev.goodsAmount) || 0)
      }));
  }, [formDeal.productAmount, formDeal.goodsAmount]);

  const openAddModal = () => {
      setModalMode('add');
      setFormContact({ name: '', email: '', phone: '', company: '', address: '', role: '', department: '영업 1팀', targetAmount: 0, notes: [], grade: 'Unrated', type: 'Company', owner: '홍길동', team: '영업 1팀' });
      setIncludeDeal(false);
      setFormDeal({ title: '', productAmount: 0, goodsAmount: 0, value: 0, status: '미정', itemDetails: '', expectedCloseDate: new Date().toISOString().split('T')[0], owner: '홍길동', team: '영업 1팀' });
      setIsModalOpen(true);
  }

  const openEditModal = (e: React.MouseEvent, contact: Contact) => {
      e.stopPropagation();
      setModalMode('edit');
      setFormContact({ ...contact });
      
      const contactDeals = deals.filter(d => d.contactId === contact.id);
      if (contactDeals.length > 0) {
          // Load the latest deal for editing
          const latestDeal = contactDeals[contactDeals.length - 1];
          setIncludeDeal(true);
          setFormDeal({ ...latestDeal });
      } else {
          setIncludeDeal(false);
          setFormDeal({ title: '', productAmount: 0, goodsAmount: 0, value: 0, status: '미정', itemDetails: '', expectedCloseDate: new Date().toISOString().split('T')[0], owner: contact.owner || '홍길동', team: contact.team || '영업 1팀' });
      }
      
      setIsModalOpen(true);
  }

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedContacts = useMemo(() => {
      const filtered = contacts.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!sortConfig) return filtered;

      return [...filtered].sort((a, b) => {
          let aVal: any = a[sortConfig.key as keyof Contact];
          let bVal: any = b[sortConfig.key as keyof Contact];

          // Custom sorting for computed fields
          if (sortConfig.key === 'wonTotal') {
               const getWon = (cid: string) => deals.filter(d => d.contactId === cid && (d.status==='매출'||d.status==='확정')).reduce((sum, d) => sum + d.value, 0);
               aVal = getWon(a.id);
               bVal = getWon(b.id);
          } else if (sortConfig.key === 'grade') {
               const gradeOrder: Record<string, number> = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'Unrated': 0 };
               aVal = gradeOrder[a.grade || 'Unrated'] || 0;
               bVal = gradeOrder[b.grade || 'Unrated'] || 0;
          }

          // Handle null/undefined
          if (aVal === undefined || aVal === null) aVal = '';
          if (bVal === undefined || bVal === null) bVal = '';

          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [contacts, deals, searchTerm, sortConfig]);

  const getGradeColor = (grade: AccountGrade) => {
      switch(grade) {
          case 'S': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
          case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'B': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'C': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'D': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  }

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  };

  const handleAddressSearch = () => {
      setShowAddressPopup(true);
  };

  const handleSelectAddress = (address: string) => {
      setFormContact(prev => ({ ...prev, address }));
      setShowAddressPopup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!formContact.name || !formContact.company) {
          alert("이름과 회사는 필수 입력입니다.");
          return;
      }
      
      const isEdit = modalMode === 'edit';
      const contactId = isEdit && formContact.id ? formContact.id : `c${Date.now()}`;
      
      const finalContact: Contact = {
          id: contactId,
          name: formContact.name || '',
          email: formContact.email || '',
          phone: formContact.phone || '',
          company: formContact.company || '',
          address: formContact.address || '',
          type: formContact.type || 'Company',
          role: formContact.role || '',
          department: formContact.department || '영업 1팀',
          lastContacted: formContact.lastContacted || new Date().toISOString().split('T')[0],
          notes: formContact.notes || [],
          grade: formContact.grade || 'Unrated',
          targetAmount: Number(formContact.targetAmount) || 0,
          owner: formContact.owner,
          team: formContact.team
      };

      let finalDeal: Deal | undefined = undefined;
      if (includeDeal) {
          finalDeal = {
              id: isEdit && formDeal.id ? formDeal.id : `d${Date.now()}`,
              contactId: contactId,
              title: formDeal.title || `${finalContact.company} 매출 건`,
              productAmount: Number(formDeal.productAmount) || 0,
              goodsAmount: Number(formDeal.goodsAmount) || 0,
              value: (Number(formDeal.productAmount) || 0) + (Number(formDeal.goodsAmount) || 0),
              status: formDeal.status as DealStatus,
              stage: formDeal.status === '매출' ? DealStage.CLOSED_WON : DealStage.PROPOSAL,
              itemDetails: formDeal.itemDetails || '',
              expectedCloseDate: formDeal.expectedCloseDate || new Date().toISOString().split('T')[0],
              probability: formDeal.status === '매출' ? 100 : (formDeal.status === '확정' ? 90 : (formDeal.status === '예정' ? 60 : 20)),
              owner: formDeal.owner || formContact.owner || '홍길동',
              team: formDeal.team || formContact.team || '영업 1팀',
              department: '영업본부'
          };
      }

      if (isEdit) {
          onUpdateContact(finalContact, finalDeal);
      } else {
          onAddContact(finalContact, finalDeal);
      }
      
      setIsModalOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); 
      if(window.confirm("정말로 이 거래처를 삭제하시겠습니까? 관련 데이터가 모두 사라집니다.")) {
          onDeleteContact(id);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">거래처 및 매출 관리</h2>
        <div className="flex items-center space-x-3">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text"
                placeholder="이름, 회사 검색..."
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <button 
                onClick={openAddModal}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Plus size={20} className="mr-1"/> 등록
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-sm font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-56 cursor-pointer hover:bg-slate-100 transition-colors" onClick={()=>handleSort('company')}>
                    <div className="flex items-center">거래처/유형/지역 <ArrowUpDown size={14} className="ml-1 text-slate-400"/></div>
                </th>
                <th className="px-4 py-4 w-48 cursor-pointer hover:bg-slate-100 transition-colors" onClick={()=>handleSort('name')}>
                    <div className="flex items-center">고객 정보 <ArrowUpDown size={14} className="ml-1 text-slate-400"/></div>
                </th>
                <th className="px-4 py-4 min-w-[500px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={()=>handleSort('wonTotal')}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">매출 상세 현황 (단위: 원) <ArrowUpDown size={14} className="ml-1 text-slate-400"/></div>
                        <span className="text-xs font-normal text-slate-400">제품 / 상품 / 소계</span>
                    </div>
                </th>
                <th className="px-4 py-4 w-24 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={()=>handleSort('grade')}>
                    <div className="flex items-center justify-center">AI 등급 <ArrowUpDown size={14} className="ml-1 text-slate-400"/></div>
                </th>
                <th className="px-4 py-4 w-20 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedContacts.map(contact => {
                 const contactDeals = deals.filter(d => d.contactId === contact.id);
                 const wonDeals = contactDeals.filter(d => d.status === '매출' || d.stage === DealStage.CLOSED_WON);
                 const wonProduct = wonDeals.reduce((sum, d) => sum + (d.productAmount || 0), 0);
                 const wonGoods = wonDeals.reduce((sum, d) => sum + (d.goodsAmount || 0), 0);
                 const wonTotal = wonDeals.reduce((sum, d) => sum + d.value, 0);
                 const confirmed = contactDeals.filter(d => d.status === '확정').reduce((sum, d) => sum + d.value, 0);
                 const expected = contactDeals.filter(d => d.status === '예정').reduce((sum, d) => sum + d.value, 0);
                 const undecided = contactDeals.filter(d => d.status === '미정').reduce((sum, d) => sum + d.value, 0);

                 // Find next expected deal date or last closed date
                 const futureDeals = contactDeals
                    .filter(d => new Date(d.expectedCloseDate) >= new Date())
                    .sort((a,b) => new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime());
                 const pastDeals = contactDeals
                    .filter(d => new Date(d.expectedCloseDate) < new Date())
                    .sort((a,b) => new Date(b.expectedCloseDate).getTime() - new Date(a.expectedCloseDate).getTime());
                 
                 const nextDealDate = futureDeals.length > 0 ? futureDeals[0].expectedCloseDate : (pastDeals.length > 0 ? pastDeals[0].expectedCloseDate : '-');
                 const isFuture = futureDeals.length > 0;

                 return (
                <tr 
                  key={contact.id} 
                  onClick={() => onSelectContact(contact)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group align-top"
                >
                  <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{contact.company}</div>
                      <div className="flex items-center gap-1 mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500">{contact.type || 'Company'}</span>
                      </div>
                      <div className="flex items-start mt-1.5 text-xs text-slate-500">
                          <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0 text-slate-400"/>
                          <span className="truncate max-w-[180px]" title={contact.address}>{contact.address || '-'}</span>
                      </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mt-1">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{contact.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{contact.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{contact.phone}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                      <div className="grid grid-cols-4 gap-2 text-xs border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <div className="bg-emerald-50 p-1.5 text-center font-semibold text-emerald-800 border-r border-b border-emerald-100">매출 실적</div>
                          <div className="bg-blue-50 p-1.5 text-center font-semibold text-blue-800 border-r border-b border-blue-100">확정</div>
                          <div className="bg-amber-50 p-1.5 text-center font-semibold text-amber-800 border-r border-b border-amber-100">예정</div>
                          <div className="bg-slate-100 p-1.5 text-center font-semibold text-slate-600 border-b border-slate-200">미정</div>
                          
                          <div className="p-2 border-r border-slate-100">
                                <div className="flex justify-between mb-1"><span className="text-slate-400">제품</span> <span>{formatCurrency(wonProduct)}</span></div>
                                <div className="flex justify-between mb-1"><span className="text-slate-400">상품</span> <span>{formatCurrency(wonGoods)}</span></div>
                                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-100">
                                    <span>계</span> <span>{formatCurrency(wonTotal)}</span>
                                </div>
                          </div>
                          <div className="p-2 border-r border-slate-100 flex items-center justify-end font-medium text-blue-700">
                              {formatCurrency(confirmed)}
                          </div>
                          <div className="p-2 border-r border-slate-100 flex items-center justify-end font-medium text-amber-700">
                              {formatCurrency(expected)}
                          </div>
                          <div className="p-2 flex items-center justify-end font-medium text-slate-600">
                              {formatCurrency(undecided)}
                          </div>
                      </div>
                      {/* Added Expected Revenue Date Row */}
                      <div className="mt-1 flex items-center justify-end text-xs text-slate-500">
                         <Calendar size={12} className={`mr-1 ${isFuture ? 'text-indigo-500' : 'text-slate-400'}`} />
                         <span>
                             {isFuture ? '예상 매출일: ' : '최근 매출일: '}
                             <span className={`font-medium ${isFuture ? 'text-indigo-600' : 'text-slate-600'}`}>
                                 {nextDealDate}
                             </span>
                         </span>
                      </div>
                  </td>

                  <td className="px-4 py-4 text-center align-middle">
                      <span className={`inline-block px-2.5 py-1 rounded border text-xs font-bold ${getGradeColor(contact.grade)}`}>
                          {contact.grade}등급
                      </span>
                  </td>

                  <td className="px-4 py-4 text-right align-middle whitespace-nowrap">
                    <div className="flex justify-end space-x-1">
                        <button 
                            onClick={(e) => openEditModal(e, contact)}
                            className="text-slate-500 hover:text-indigo-600 p-2 transition-colors rounded-md hover:bg-slate-100"
                            title="수정"
                        >
                        <Edit size={18} />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(e, contact.id)}
                            className="text-slate-400 hover:text-red-600 p-2 transition-colors rounded-md hover:bg-slate-100"
                            title="삭제"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 animate-slide-up relative">
                {/* Simulated Address Popup */}
                {showAddressPopup && (
                    <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center rounded-xl p-6">
                        <div className="bg-white border shadow-xl rounded-lg w-full max-w-md overflow-hidden">
                            <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                                <span className="font-bold">주소 검색 (모의 시스템)</span>
                                <button onClick={() => setShowAddressPopup(false)}><X size={18}/></button>
                            </div>
                            <div className="p-4 space-y-2">
                                <input autoFocus type="text" placeholder="예: 판교역로 123" className="w-full p-2 border rounded mb-2" />
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {['서울 강남구 테헤란로 123', '경기 성남시 분당구 판교역로 230', '대전 유성구 대학로 291', '서울 종로구 세종대로 1'].map(addr => (
                                        <button 
                                            key={addr} 
                                            onClick={() => handleSelectAddress(addr)}
                                            className="w-full text-left p-2 hover:bg-indigo-50 rounded text-sm text-slate-700"
                                        >
                                            {addr}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 rounded-t-xl">
                    <h3 className="font-bold text-lg text-slate-800">{modalMode === 'add' ? '거래처 및 매출 등록' : '거래처 정보 수정'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase border-b pb-2">1. 기본 고객 정보</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
                                <input type="text" required className="w-full p-2 border rounded-lg" value={formContact.name} onChange={e => setFormContact({...formContact, name: e.target.value})} placeholder="담당자 성명" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">회사명 *</label>
                                <input type="text" required className="w-full p-2 border rounded-lg" value={formContact.company} onChange={e => setFormContact({...formContact, company: e.target.value})} placeholder="법인명/상호" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formContact.phone} onChange={e => setFormContact({...formContact, phone: e.target.value})} placeholder="010-0000-0000" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                                <input type="email" className="w-full p-2 border rounded-lg" value={formContact.email} onChange={e => setFormContact({...formContact, email: e.target.value})} placeholder="user@example.com" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">주소</label>
                            <div className="flex space-x-2">
                                <input type="text" className="flex-1 p-2 border rounded-lg" value={formContact.address} onChange={e => setFormContact({...formContact, address: e.target.value})} placeholder="주소 입력" />
                                <button type="button" onClick={handleAddressSearch} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 flex items-center whitespace-nowrap">
                                    <Search size={16} className="mr-1"/> 주소 검색
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">거래처 유형</label>
                                <select className="w-full p-2 border rounded-lg" value={formContact.type} onChange={e => setFormContact({...formContact, type: e.target.value as ContactType})}>
                                    <option value="Company">일반 기업</option>
                                    <option value="University">대학교</option>
                                    <option value="Institute">연구소</option>
                                    <option value="Association">협회/단체</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">직책</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formContact.role} onChange={e => setFormContact({...formContact, role: e.target.value})} placeholder="예: 구매 팀장" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">담당 팀</label>
                                <select className="w-full p-2 border rounded-lg" value={formContact.department} onChange={e => setFormContact({...formContact, department: e.target.value})}>
                                    <option value="영업 1팀">영업 1팀</option>
                                    <option value="영업 2팀">영업 2팀</option>
                                    <option value="영업 3팀">영업 3팀</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Deal Info Toggle */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIncludeDeal(!includeDeal)}>
                             <h4 className="text-sm font-bold text-slate-500 uppercase">2. 매출 상세 정보 (선택)</h4>
                             {includeDeal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        
                        {includeDeal && (
                            <div className="mt-4 space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">매출 건명</label>
                                    <input type="text" placeholder="예: 2024년 하반기 서버 납품" className="w-full p-2 border rounded-lg" value={formDeal.title} onChange={e => setFormDeal({...formDeal, title: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">매출 상태</label>
                                        <select 
                                            className="w-full p-2 border rounded-lg" 
                                            value={formDeal.status} 
                                            onChange={e => setFormDeal({...formDeal, status: e.target.value as DealStatus})}
                                        >
                                            <option value="미정">미정 (Undecided)</option>
                                            <option value="예정">예정 (Expected)</option>
                                            <option value="확정">확정 (Confirmed)</option>
                                            <option value="매출">매출 실적 (Sales)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">예상 매출일</label>
                                        <input 
                                            type="date" 
                                            className="w-full p-2 border rounded-lg" 
                                            value={formDeal.expectedCloseDate} 
                                            onChange={e => setFormDeal({...formDeal, expectedCloseDate: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded border">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-600 mb-1">제품 매출액 (₩)</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-right" value={formDeal.productAmount} onChange={e => setFormDeal({...formDeal, productAmount: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-600 mb-1">상품 매출액 (₩)</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-right" value={formDeal.goodsAmount} onChange={e => setFormDeal({...formDeal, goodsAmount: Number(e.target.value)})} />
                                    </div>
                                    <div className="col-span-2 text-right border-t pt-2">
                                        <span className="text-sm font-medium text-slate-500 mr-2">합계:</span>
                                        <span className="text-lg font-bold text-slate-800">
                                            {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format((formDeal.productAmount||0) + (formDeal.goodsAmount||0))}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">영업 품목 및 세부 내역</label>
                                    <textarea 
                                        placeholder="품목, 수량, 단가 등 세부 정보를 입력하세요."
                                        className="w-full p-2 border rounded-lg h-24"
                                        value={formDeal.itemDetails}
                                        onChange={e => setFormDeal({...formDeal, itemDetails: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-2 border-t">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">취소</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            {modalMode === 'add' ? '등록하기' : '수정하기'}
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;

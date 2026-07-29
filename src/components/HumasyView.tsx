import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Home, Sparkles, AlertTriangle, CheckCircle2, ArrowRight,
  ClipboardCheck, ChevronRight, Activity, Award, Compass, BedDouble
} from 'lucide-react';
import { HumasAgenda, Santri, Kompleks, Kamar } from '../types';
import KamarSub from './humas/KamarSub';
import DataKamarSantriSub from './humas/DataKamarSantriSub';
import { fetchTableData, insertTableRow, updateTableRow, deleteTableRow, subscribeRealtimeChanges, snakeToCamel } from '../lib/api';
import { DEFAULT_ROLES } from '../lib/permissions';

interface HumasyViewProps {
  humasList: HumasAgenda[];
  santriList: Santri[];
  onUpdateSantri: (updatedSantri: Santri) => void;
  setSantriList: React.Dispatch<React.SetStateAction<Santri[]>>;
  activeSubTab: string;
  onChangeSubTab: (tab: string) => void;
  isSelectionMode?: boolean;
  setIsSelectionMode?: (val: boolean) => void;
}

// Initial complexes matching existing student rooms
export const INITIAL_KOMPLEKS: Kompleks[] = [];

export const INITIAL_KAMAR: Kamar[] = [];

export default function HumasyView({ 
  santriList,
  onUpdateSantri,
  setSantriList,
  activeSubTab,
  onChangeSubTab,
  isSelectionMode,
  setIsSelectionMode
}: HumasyViewProps) {

  // Load permissions from localStorage
  let canViewPutra = true;
  let canViewPutri = true;
  let canWritePutra = true;
  let canWritePutri = true;

  try {
    const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
    if (activeRole !== 'superadmin') {
      const permissionsStr = localStorage.getItem('smartsantri_roles_permissions');
      let roleObj;
      if (permissionsStr) {
        try {
          const parsedRoles = JSON.parse(permissionsStr);
          if (Array.isArray(parsedRoles)) {
            roleObj = parsedRoles.find((r: any) => r.id === activeRole);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!roleObj) {
        roleObj = DEFAULT_ROLES.find((r: any) => r.id === activeRole);
      }

      if (roleObj && roleObj.permissions) {
        canViewPutra = !!roleObj.permissions['humasy_putra.view'];
        canViewPutri = !!roleObj.permissions['humasy_putri.view'];
        canWritePutra = !!roleObj.permissions['humasy_putra.write'];
        canWritePutri = !!roleObj.permissions['humasy_putri.write'];
      } else {
        canViewPutra = false;
        canViewPutri = false;
        canWritePutra = false;
        canWritePutri = false;
      }
    }
  } catch (e) {
    console.error('Error parsing permissions in HumasyView:', e);
  }

  const [genderFilter, setGenderFilter] = useState<'Putra' | 'Putri'>(() => {
    let defaultGender: 'Putra' | 'Putri' = 'Putra';
    try {
      if (!canViewPutra && canViewPutri) {
        defaultGender = 'Putri';
      }
    } catch (e) {
      console.error(e);
    }
    return defaultGender;
  });

  // --- PERSISTENT STATE FOR KAMAR & KOMPLEKS ---
  const [kompleksList, setKompleksList] = useState<Kompleks[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_kompleks');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KOMPLEKS;
  });

  const [kamarList, setKamarList] = useState<Kamar[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_kamar');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KAMAR;
  });

  useEffect(() => {
    let isMounted = true;
    const loadHumasData = () => {
      fetchTableData<Kompleks>('kompleks', 'smartsantri_kompleks', INITIAL_KOMPLEKS)
        .then(data => {
          if (!isMounted) return;
          const unique = data.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
          setKompleksList(prev => JSON.stringify(prev) === JSON.stringify(unique) ? prev : unique);
        });
      fetchTableData<Kamar>('kamar', 'smartsantri_kamar', INITIAL_KAMAR)
        .then(data => {
          if (!isMounted) return;
          const unique = data.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
          setKamarList(prev => JSON.stringify(prev) === JSON.stringify(unique) ? prev : unique);
        });
    };

    loadHumasData();

    // Subscribe to WebSocket realtime changes from server
    const unsubscribeWs = subscribeRealtimeChanges((payload: any) => {
      if (payload.event === 'db_change') {
        if (!payload.table || payload.table === 'kompleks' || payload.table === 'kamar' || payload.table === 'santri' || payload.action === 'truncate_all') {
          loadHumasData();
        }
      }
    });

    // Re-fetch immediately when window/tab regains focus or visibility
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadHumasData();
      }
    };
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      isMounted = false;
      unsubscribeWs();
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  // Save to localStorage as a local cache mirror
  useEffect(() => {
    localStorage.setItem('smartsantri_kompleks', JSON.stringify(kompleksList));
  }, [kompleksList]);

  useEffect(() => {
    localStorage.setItem('smartsantri_kamar', JSON.stringify(kamarList));
  }, [kamarList]);

  // --- HANDLERS FOR KOMPLEKS ---
  const handleAddKompleks = async (newKom: Kompleks) => {
    const saved = await insertTableRow('kompleks', 'smartsantri_kompleks', newKom);
    setKompleksList(prev => {
      if (prev.some(k => k.id === saved.id)) return prev;
      return [...prev, saved];
    });
  };

  const handleUpdateKompleks = async (upKom: Kompleks) => {
    setKompleksList(prev => prev.map(k => k.id === upKom.id ? upKom : k));
    await updateTableRow('kompleks', 'smartsantri_kompleks', upKom.id, upKom);
  };

  const handleDeleteKompleks = async (id: string) => {
    const roomsToDelete = kamarList.filter(r => r.kompleksId === id);
    const roomNamesToDelete = roomsToDelete.map(r => r.nama.toLowerCase());

    // Clean up students residing in these rooms
    const studentsToUpdate = santriList.filter(s => 
      s.kamar && roomNamesToDelete.includes(s.kamar.toLowerCase())
    );
    for (const s of studentsToUpdate) {
      onUpdateSantri({
        ...s,
        kamar: "",
        nomorLemari: ""
      });
    }

    // Delete matching rooms in local state and database
    setKamarList(prev => prev.filter(r => r.kompleksId !== id));
    for (const r of roomsToDelete) {
      try {
        await deleteTableRow('kamar', 'smartsantri_kamar', r.id);
      } catch (err) {
        console.error(`Error deleting room ${r.id} on complex delete:`, err);
      }
    }

    setKompleksList(prev => prev.filter(k => k.id !== id));
    await deleteTableRow('kompleks', 'smartsantri_kompleks', id);
  };

  // --- HANDLERS FOR KAMAR ---
  const handleAddKamar = async (newKam: Kamar) => {
    const saved = await insertTableRow('kamar', 'smartsantri_kamar', newKam);
    setKamarList(prev => {
      if (prev.some(r => r.id === saved.id)) return prev;
      return [...prev, saved];
    });
  };

  const handleUpdateKamar = async (upKam: Kamar) => {
    setKamarList(prev => prev.map(r => r.id === upKam.id ? upKam : r));
    await updateTableRow('kamar', 'smartsantri_kamar', upKam.id, upKam);
  };

  const handleDeleteKamar = async (id: string) => {
    const targetRoom = kamarList.find(r => r.id === id);
    if (targetRoom) {
      const roomName = targetRoom.nama.toLowerCase();
      // Unassign students residing in this room
      const studentsToUpdate = santriList.filter(s => 
        s.kamar && s.kamar.toLowerCase() === roomName
      );
      for (const s of studentsToUpdate) {
        onUpdateSantri({
          ...s,
          kamar: "",
          nomorLemari: ""
        });
      }
    }

    setKamarList(prev => prev.filter(r => r.id !== id));
    await deleteTableRow('kamar', 'smartsantri_kamar', id);
  };

  // --- STUDENT ROOM ASSIGNMENT HANDLER ---
  const handleUpdateSantriRoom = (santriId: string, roomText: string, nomorLemari?: string) => {
    const target = santriList.find(s => s.id === santriId);
    if (target) {
      const roomChanged = (target.kamar || '').toLowerCase() !== (roomText || '').toLowerCase();
      const finalNomorLemari = nomorLemari !== undefined 
        ? nomorLemari 
        : (roomChanged ? '' : (target.nomorLemari || ''));
      onUpdateSantri({
        ...target,
        kamar: roomText,
        nomorLemari: finalNomorLemari
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Conditionally Render Subtabs */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'datakamar' ? (
          <motion.div
            key="datakamar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="min-h-[400px]"
          >
            <DataKamarSantriSub
              santriList={santriList}
              kompleksList={kompleksList}
              kamarList={kamarList}
              onUpdateSantriRoom={handleUpdateSantriRoom}
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
              canViewPutra={canViewPutra}
              canViewPutri={canViewPutri}
              canWritePutra={canWritePutra}
              canWritePutri={canWritePutri}
            />
          </motion.div>
        ) : activeSubTab === 'kamar' ? (
          <motion.div
            key="kamar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="min-h-[400px]"
          >
            <KamarSub
              kompleksList={kompleksList}
              kamarList={kamarList}
              santriList={santriList}
              onAddKompleks={handleAddKompleks}
              onUpdateKompleks={handleUpdateKompleks}
              onDeleteKompleks={handleDeleteKompleks}
              onAddKamar={handleAddKamar}
              onUpdateKamar={handleUpdateKamar}
              onDeleteKamar={handleDeleteKamar}
              onUpdateSantriRoom={handleUpdateSantriRoom}
              canViewPutra={canViewPutra}
              canViewPutri={canViewPutri}
              canWritePutra={canWritePutra}
              canWritePutri={canWritePutri}
            />
          </motion.div>
        ) : (
          /* OVERVIEW DASHBOARD - SAMA PERSIS SEPERTI HALAMAN PENDIDIKAN FORMAL */
          (() => {
            const activeSantri = santriList.filter(s => 
              s.gender === genderFilter && 
              s.statusKeanggotaan !== 'Alumni'
            );

            const activeKompleks = kompleksList.filter(k => k.gender === genderFilter);
            const activeKompleksIds = activeKompleks.map(k => k.id);
            const activeKamar = kamarList.filter(r => activeKompleksIds.includes(r.kompleksId));
            const activeRoomNames = activeKamar.map(r => r.nama.toLowerCase());

            // Count placed / unplaced
            const placedCount = activeSantri.filter(s => {
              const kamarName = (s.kamar || '').trim().toLowerCase();
              return kamarName && kamarName !== 'tanpa kamar' && activeRoomNames.includes(kamarName);
            }).length;
            const unplacedCount = activeSantri.length - placedCount;
            const roomFulfillmentRate = activeSantri.length > 0 ? Math.round((placedCount / activeSantri.length) * 100) : 0;

            // Capacity calculation
            const totalCapacity = activeKamar.reduce((sum, r) => sum + (r.kapasitas || 15), 0);
            const capacityOccupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((placedCount / totalCapacity) * 100)) : 0;

            const isPutra = genderFilter === 'Putra';
            const textClass = isPutra ? 'text-purple-600' : 'text-rose-600';
            const bgClass = isPutra ? 'bg-purple-600' : 'bg-rose-600';
            const bgLightClass = isPutra ? 'bg-purple-50/45' : 'bg-rose-50/45';
            const borderClass = isPutra ? 'border-purple-100' : 'border-rose-100';
            const textPrimary950 = isPutra ? 'text-purple-950' : 'text-rose-950';
            const textPrimary500 = isPutra ? 'text-purple-500' : 'text-rose-500';

            return (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Custom Interactive Header with Gender Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isPutra ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'} shadow-sm`}>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        Overview Pengelolaan Kamar {genderFilter}
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Ringkasan real-time integrasi data kompleks asrama, kamar, dan ketersediaan tempat tidur {genderFilter.toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  {/* Gender Switch Toggle */}
                  {canViewPutra && canViewPutri && (
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[11px] font-bold text-slate-500">Pilih Gender:</span>
                      <div className="relative bg-slate-200/80 p-1 rounded-full flex items-center gap-1 w-44">
                        {/* Sliding Background */}
                        <motion.div
                          className={`absolute top-1 bottom-1 rounded-full ${bgClass}`}
                          layoutId="activeGenderBgHumasy"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          style={{
                            left: isPutra ? '4px' : 'calc(50% + 2px)',
                            width: 'calc(50% - 6px)'
                          }}
                        />
                        <button
                          onClick={() => setGenderFilter('Putra')}
                          className={`relative flex-1 text-center py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors z-10 ${
                            isPutra ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Putra
                        </button>
                        <button
                          onClick={() => setGenderFilter('Putri')}
                          className={`relative flex-1 text-center py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors z-10 ${
                            !isPutra ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Putri
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Metrics Cards (Filtered by Selected Gender) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  
                  <div className={`rounded-2xl border ${borderClass} ${bgLightClass} p-4.5 shadow-xs flex items-center gap-4 transition-colors duration-300`}>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgClass} text-white shadow-sm transition-colors duration-300`}>
                      <Building2 className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <p className={`text-[9px] font-extrabold ${textPrimary500} uppercase tracking-widest leading-none`}>Kompleks ({genderFilter})</p>
                      <p className={`text-xl font-display font-extrabold ${textPrimary950} mt-1.5`}>{activeKompleks.length} Unit</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Home className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Kamar Aktif ({genderFilter})</p>
                      <p className="text-xl font-display font-extrabold text-slate-950 mt-1.5">{activeKamar.length} Ruang</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <BedDouble className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Kapasitas Terisi</p>
                      <p className="text-xl font-display font-extrabold text-slate-950 mt-1.5">{capacityOccupancyRate}% ({placedCount}/{totalCapacity})</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Users className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Santri Aktif ({genderFilter})</p>
                      <p className="text-xl font-display font-extrabold text-slate-950 mt-1.5">{activeSantri.length} Santri</p>
                    </div>
                  </div>

                </div>

                {/* Alerts and Quick Complete Cards */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                  
                  {/* Left Side: Bento of Placement Statistics */}
                  <div className="lg:col-span-3 space-y-4">
                    
                    {/* Roomless Students Warning Alert */}
                    {unplacedCount > 0 ? (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 flex items-start gap-3.5 shadow-xs">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-amber-950">
                            Terdapat {unplacedCount} Santri {genderFilter} Belum Terdaftar di Kamar!
                          </h4>
                          <p className="text-[10px] text-amber-800/90 mt-1">
                            Beberapa santri baru atau pindahan dari gender {genderFilter.toLowerCase()} belum memiliki kamar/asrama yang diset. Gunakan modul Data Kamar untuk mengatur penempatan kamar secara massal.
                          </p>
                          <button
                            onClick={() => onChangeSubTab('datakamar')}
                            className="mt-2 text-[10px] font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Atur Kamar Massal</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 flex items-start gap-3.5 shadow-xs">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-emerald-950">
                            Sempurna! Penempatan Kamar {genderFilter} Lengkap
                          </h4>
                          <p className="text-[10px] text-emerald-800/95 mt-1">
                            Hebat, seluruh {activeSantri.length} santri {genderFilter.toLowerCase()} aktif telah berhasil ditempatkan pada masing-masing kamar asrama yang resmi.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Integrated Completeness Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Room placement meter */}
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between h-36">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kerapian Kamar</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            roomFulfillmentRate >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>{roomFulfillmentRate}%</span>
                        </div>
                        <div className="my-2">
                          <p className="text-xs font-extrabold text-slate-700 leading-tight">Penempatan Kamar Santri</p>
                          <p className="text-[9px] text-slate-400 mt-1">{placedCount} dari {activeSantri.length} santri memiliki kamar.</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${bgClass} transition-all duration-500`}
                            style={{ width: `${roomFulfillmentRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Capacity fullness meter */}
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between h-36">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Keterisian Asrama</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            capacityOccupancyRate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>{capacityOccupancyRate}%</span>
                        </div>
                        <div className="my-2">
                          <p className="text-xs font-extrabold text-slate-700 leading-tight">Penggunaan Kasur & Lemari</p>
                          <p className="text-[9px] text-slate-400 mt-1">{placedCount} dari {totalCapacity} tempat tidur terpakai.</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-emerald-500 transition-all duration-500`}
                            style={{ width: `${capacityOccupancyRate}%` }}
                          />
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Right Side: Complex Deck & Room Occupancy Summary */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* Kompleks Card Deck with Rooms Progress bar */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="font-display text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                          Daftar Kompleks Asrama ({genderFilter})
                        </span>
                        <button 
                          onClick={() => onChangeSubTab('kamar')}
                          className={`text-[9px] font-black ${textClass} hover:underline cursor-pointer`}
                        >
                          Kelola Kamar
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {activeKompleks.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Belum ada kompleks asrama terdaftar untuk gender {genderFilter}.
                          </div>
                        ) : (
                          activeKompleks.map(k => {
                            const rooms = activeKamar.filter(r => r.kompleksId === k.id);
                            const roomNames = rooms.map(r => r.nama.toLowerCase());
                            const totalKompleksStudents = activeSantri.filter(s => {
                              const sRoom = (s.kamar || '').trim().toLowerCase();
                              return sRoom && roomNames.includes(sRoom);
                            }).length;
                            
                            const totalKompleksCapacity = rooms.reduce((sum, curr) => sum + (curr.kapasitas || 15), 0);
                            const progressPercentage = totalKompleksCapacity > 0 ? Math.min(100, Math.round((totalKompleksStudents / totalKompleksCapacity) * 100)) : 0;

                            return (
                              <div key={k.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-extrabold text-slate-800 truncate">{k.nama}</h4>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5">{rooms.length} Kamar • Ketua: {k.ketua || '-'}</p>
                                  </div>
                                  <span className="text-[10px] font-mono font-extrabold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 shrink-0">
                                    {totalKompleksStudents} / {totalKompleksCapacity || '-'}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-bold">
                                    <span>Keterisian</span>
                                    <span>{progressPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${bgClass} transition-all duration-300`} 
                                      style={{ width: `${progressPercentage}%` }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                </div>

              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

    </div>
  );
}


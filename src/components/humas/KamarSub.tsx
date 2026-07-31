import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Home, BedDouble, Plus, Trash2, Edit, Users, ChevronRight, ChevronLeft,
  ArrowLeft, Search, Check, CheckCircle2, AlertCircle, X, MoreVertical, Award,
  Folder, FolderOpen, User, ArrowUpDown, Pencil, Settings, UserPlus, ArrowUp, ArrowDown,
  ChevronDown, Printer, Sparkles, UserCheck, ShieldAlert, UserMinus, ArrowLeftRight,
  Download, Eye, Sliders, Hash, FileSpreadsheet, ListOrdered, Shuffle, Crown
} from 'lucide-react';
import { Kompleks, Kamar, Santri } from '../../types';
import SantriDetailModal from '../sekretaris/SantriDetailModal';
import { renderSantriAvatar, calculateRealtimeAge, getPesantrenProfile } from '../SekretarisHelper';

interface KamarSubProps {
  kompleksList: Kompleks[];
  kamarList: Kamar[];
  santriList: Santri[];
  onAddKompleks: (newKom: Kompleks) => void;
  onUpdateKompleks: (upKom: Kompleks) => void;
  onDeleteKompleks: (id: string) => void;
  onAddKamar: (newKam: Kamar) => void;
  onUpdateKamar: (upKam: Kamar) => void;
  onDeleteKamar: (id: string) => void;
  onUpdateSantriRoom: (santriId: string, roomText: string, nomorLemari?: string) => void;
  canViewPutra?: boolean;
  canViewPutri?: boolean;
  canWritePutra?: boolean;
  canWritePutri?: boolean;
}

export default function KamarSub({
  kompleksList,
  kamarList,
  santriList,
  onAddKompleks,
  onUpdateKompleks,
  onDeleteKompleks,
  onAddKamar,
  onUpdateKamar,
  onDeleteKamar,
  onUpdateSantriRoom,
  canViewPutra = true,
  canViewPutri = true,
  canWritePutra = true,
  canWritePutri = true
}: KamarSubProps) {
  // Gender Filter state
  const [selectedGender, setSelectedGender] = useState<'Putra' | 'Putri'>('Putra');

  // Synchronize gender selection with view permissions
  useEffect(() => {
    if (!canViewPutra && canViewPutri) {
      setSelectedGender('Putri');
    } else if (canViewPutra && !canViewPutri) {
      setSelectedGender('Putra');
    }
  }, [canViewPutra, canViewPutri]);

  const canWriteCurrent = selectedGender === 'Putra' ? canWritePutra : canWritePutri;

  // Selected Kompleks & Selected Kamar states (matching Lembaga & Kelas hierarchy)
  const [selectedKompleksId, setSelectedKompleksId] = useState<string>('');
  const [activeRoomForDetail, setActiveRoomForDetail] = useState<Kamar | null>(null);

  // Search & Filter for Kamar grid
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomSortKey, setRoomSortKey] = useState<'name-asc' | 'name-desc' | 'students-desc' | 'students-asc'>('name-asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Search, Filter & Sort for Santri Table
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [sortField, setSortField] = useState<'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar' | 'alamat' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Bulk Action
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [bulkDestKompleksId, setBulkDestKompleksId] = useState('');
  const [bulkDestRoomId, setBulkDestRoomId] = useState('');
  const [bulkNomorLemari, setBulkNomorLemari] = useState('');

  // Dropdowns & Menu Action
  const [activeActionKompleksId, setActiveActionKompleksId] = useState<string | null>(null);
  const [activeActionKamarId, setActiveActionKamarId] = useState<string | null>(null);
  const [activeStudentDropdownId, setActiveStudentDropdownId] = useState<string | null>(null);
  const [studentDropdownPos, setStudentDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [isAutoNumberingDropdownOpen, setIsAutoNumberingDropdownOpen] = useState(false);

  // Modals
  const [isKompleksModalOpen, setIsKompleksModalOpen] = useState(false);
  const [editingKompleks, setEditingKompleks] = useState<Kompleks | null>(null);
  const [komNama, setKomNama] = useState('');
  const [komKode, setKomKode] = useState('');

  const [isKamarModalOpen, setIsKamarModalOpen] = useState(false);
  const [editingKamar, setEditingKamar] = useState<Kamar | null>(null);
  const [kamNama, setKamNama] = useState('');
  const [kamKetua, setKamKetua] = useState('');
  const [kamKapasitas, setKamKapasitas] = useState<number>(15);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberRoomFilter, setAddMemberRoomFilter] = useState<string>('BelumKamar');
  const [selectedModalStudentIds, setSelectedModalStudentIds] = useState<string[]>([]);

  const [selectedSantriForDetail, setSelectedSantriForDetail] = useState<Santri | null>(null);
  const [singleTransferStudent, setSingleTransferStudent] = useState<Santri | null>(null);
  const [singleDestKompleksId, setSingleDestKompleksId] = useState('');
  const [singleDestRoomId, setSingleDestRoomId] = useState('');
  const [singleNomorLemari, setSingleNomorLemari] = useState('');

  const [editingLemariStudent, setEditingLemariStudent] = useState<Santri | null>(null);
  const [tempLemariValue, setTempLemariValue] = useState('');

  // Toast & Confirm Modal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Universal Floating Dropdown Menu
  const [menuDropdown, setMenuDropdown] = useState<{
    type: 'kompleks' | 'kamar' | 'santri';
    id: string;
    top: number;
    right: number;
    data?: any;
  } | null>(null);

  const handleOpenMenu = (
    e: React.MouseEvent,
    type: 'kompleks' | 'kamar' | 'santri',
    id: string,
    data?: any
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (menuDropdown?.id === id && menuDropdown?.type === type) {
      setMenuDropdown(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - rect.right);
    const top = rect.bottom + 4;
    setMenuDropdown({ type, id, top, right, data });
  };

  // Close dropdown menu automatically on any scroll event
  useEffect(() => {
    if (!menuDropdown) return;
    const handleScroll = () => {
      setMenuDropdown(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [menuDropdown]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Hapus'
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Hapus') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  // Scroll & Table navigation refs
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const updateScrollButtons = () => {
    const container = tableContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth + 4;
      setCanScrollLeft(hasHorizontalScroll && scrollLeft > 2);
      setCanScrollRight(hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    const container = tableContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleClose = () => {
      setActiveActionKompleksId(null);
      setActiveActionKamarId(null);
      setActiveStudentDropdownId(null);
      setStudentDropdownPos(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose, true);
    window.addEventListener('click', handleClose, true);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose, true);
      window.removeEventListener('click', handleClose, true);
    };
  }, []);

  // Filtered list of Kompleks by selected gender
  const currentGenderKompleks = kompleksList.filter(k => (k.gender || 'Putra') === selectedGender);

  // Ensure selected Kompleks exists
  useEffect(() => {
    if (selectedKompleksId) {
      const exists = currentGenderKompleks.some(k => k.id === selectedKompleksId);
      if (!exists) {
        setSelectedKompleksId('');
        setActiveRoomForDetail(null);
      }
    }
  }, [selectedGender, kompleksList]);

  const selectedKompleks = kompleksList.find(k => k.id === selectedKompleksId);

  // Filtered Rooms under currently selected Kompleks
  const activeRooms = kamarList.filter(r => r.kompleksId === selectedKompleksId);

  // Helper to get students belonging to a room
  const getMembersOfRoom = (roomName: string) => {
    return santriList.filter(s => {
      if (s.gender !== selectedGender) return false;
      if (s.statusKeanggotaan && s.statusKeanggotaan !== 'Aktif') return false;
      return (s.kamar || '').trim().toLowerCase() === roomName.trim().toLowerCase();
    });
  };

  // Helper to get students belonging to a kompleks
  const getMembersOfKompleks = (kompleksId: string) => {
    const roomsInKompleks = kamarList.filter(r => r.kompleksId === kompleksId).map(r => r.nama.trim().toLowerCase());
    return santriList.filter(s => {
      if (s.gender !== selectedGender) return false;
      if (s.statusKeanggotaan && s.statusKeanggotaan !== 'Aktif') return false;
      const kName = (s.kamar || '').trim().toLowerCase();
      return kName && kName !== 'tanpa kamar' && roomsInKompleks.includes(kName);
    });
  };

  // Searched & Sorted Rooms for grid
  const searchedRooms = activeRooms.filter(r => {
    if (!roomSearchQuery) return true;
    const q = roomSearchQuery.toLowerCase();
    return (
      (r.nama || '').toLowerCase().includes(q) ||
      (r.ketuaKamar || '').toLowerCase().includes(q)
    );
  });

  const sortedRooms = [...searchedRooms].sort((a, b) => {
    if (roomSortKey === 'name-asc') return a.nama.localeCompare(b.nama);
    if (roomSortKey === 'name-desc') return b.nama.localeCompare(a.nama);
    if (roomSortKey === 'students-desc') return getMembersOfRoom(b.nama).length - getMembersOfRoom(a.nama).length;
    if (roomSortKey === 'students-asc') return getMembersOfRoom(a.nama).length - getMembersOfRoom(b.nama).length;
    return 0;
  });

  // Calculate Overall Gender Statistics
  const activeGenderSantri = santriList.filter(s => s.gender === selectedGender && (!s.statusKeanggotaan || s.statusKeanggotaan === 'Aktif'));
  const activeGenderKompleksIds = currentGenderKompleks.map(k => k.id);
  const activeGenderKamar = kamarList.filter(r => activeGenderKompleksIds.includes(r.kompleksId));
  const activeGenderRoomNames = activeGenderKamar.map(r => r.nama.toLowerCase());

  const placedSantriCount = activeGenderSantri.filter(s => {
    const kName = (s.kamar || '').trim().toLowerCase();
    return kName && kName !== 'tanpa kamar' && activeGenderRoomNames.includes(kName);
  }).length;

  const totalGenderCapacity = activeGenderKamar.reduce((sum, r) => sum + (r.kapasitas || 15), 0);
  const overallOccupancyPercent = totalGenderCapacity > 0 ? Math.min(100, Math.round((placedSantriCount / totalGenderCapacity) * 100)) : 0;

  // Active room members (when in detail mode)
  const currentRoomMembers = activeRoomForDetail ? getMembersOfRoom(activeRoomForDetail.nama) : [];

  // Filtered members for detail view
  const filteredStudents = currentRoomMembers.filter(s => {
    // Search query
    if (studentSearchQuery) {
      const q = studentSearchQuery.toLowerCase();
      const matchName = (s.nama || '').toLowerCase().includes(q);
      const matchNis = (s.nis || '').toLowerCase().includes(q);
      const matchLemari = (s.nomorLemari || '').toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchLemari) return false;
    }

    // Status filter (Muqim vs Kampung)
    if (statusFilter !== 'Semua') {
      const sStatus = (s.statusDomisili || s.status || 'Muqim').toLowerCase();
      if (statusFilter === 'Muqim' && sStatus !== 'muqim') return false;
      if (statusFilter === 'Kampung' && sStatus !== 'kampung') return false;
    }

    return true;
  });

  // Sorted students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortField) return 0;
    let valA = '';
    let valB = '';

    if (sortField === 'nama') { valA = a.nama; valB = b.nama; }
    else if (sortField === 'nis') { valA = a.nis || ''; valB = b.nis || ''; }
    else if (sortField === 'nomorLemari') { valA = a.nomorLemari || ''; valB = b.nomorLemari || ''; }
    else if (sortField === 'statusKeanggotaan') { valA = a.statusKeanggotaan || ''; valB = b.statusKeanggotaan || ''; }
    else if (sortField === 'kamar') { valA = a.kamar || ''; valB = b.kamar || ''; }
    else if (sortField === 'alamat') { 
      valA = a.desa ? `Ds. ${a.desa}, Kec. ${a.kecamatan || ''}` : (a.alamat || a.asal || '');
      valB = b.desa ? `Ds. ${b.desa}, Kec. ${b.kecamatan || ''}` : (b.alamat || b.asal || '');
    }

    const res = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? res : -res;
  });

  // Pagination
  const itemsPerPage = 50;
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [activeRoomForDetail, currentPage, filteredStudents.length]);

  // Sorting Handler
  const handleSort = (field: 'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar' | 'alamat') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortableHeader = (label: string, field: 'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar' | 'alamat', extraClass: string) => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)} 
        className={`${extraClass} cursor-pointer hover:bg-slate-200 transition-colors select-none text-left`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-purple-600 font-bold shrink-0" />
            ) : (
              <ArrowDown className="h-3 w-3 text-purple-600 font-bold shrink-0" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-400 hover:text-slate-600 shrink-0" />
          )}

          {field === 'nama' && canScrollLeft && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollTable('left');
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[40] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 transition-all cursor-pointer"
              title="Gulir Kiri"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </th>
    );
  };

  // Handlers for Add / Edit Kompleks
  const handleOpenAddKompleks = () => {
    setEditingKompleks(null);
    setKomNama('');
    setKomKode('');
    setIsKompleksModalOpen(true);
  };

  const handleOpenEditKompleks = (kom: Kompleks) => {
    setEditingKompleks(kom);
    setKomNama(kom.nama);
    setKomKode(kom.kode || '');
    setIsKompleksModalOpen(true);
  };

  const handleSaveKompleks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!komNama.trim()) return;

    if (editingKompleks) {
      onUpdateKompleks({
        ...editingKompleks,
        nama: komNama.trim(),
        kode: komKode.trim(),
        gender: selectedGender
      });
      showToast(`Kompleks "${komNama.trim()}" berhasil diperbarui.`);
    } else {
      const newKom: Kompleks = {
        id: 'KOM-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
        nama: komNama.trim(),
        kode: komKode.trim() || 'KMP-' + String(currentGenderKompleks.length + 1).padStart(2, '0'),
        gender: selectedGender
      };
      onAddKompleks(newKom);
      setSelectedKompleksId(newKom.id);
      showToast(`Kompleks "${komNama.trim()}" berhasil ditambahkan.`);
    }
    setIsKompleksModalOpen(false);
  };

  // Handlers for Add / Edit Kamar
  const handleOpenAddKamar = () => {
    setEditingKamar(null);
    setKamNama('');
    setKamKetua('');
    setKamKapasitas(15);
    setIsKamarModalOpen(true);
  };

  const handleOpenEditKamar = (kam: Kamar) => {
    setEditingKamar(kam);
    setKamNama(kam.nama);
    setKamKetua(kam.ketuaKamar || '');
    setKamKapasitas(kam.kapasitas || 15);
    setIsKamarModalOpen(true);
  };

  const handleSaveKamar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kamNama.trim() || !selectedKompleksId) return;

    if (editingKamar) {
      const updated = {
        ...editingKamar,
        nama: kamNama.trim(),
        ketuaKamar: kamKetua.trim(),
        kapasitas: Number(kamKapasitas) || 15
      };
      onUpdateKamar(updated);
      if (activeRoomForDetail?.id === updated.id) {
        setActiveRoomForDetail(updated);
      }
      showToast(`Kamar "${kamNama.trim()}" berhasil diperbarui.`);
    } else {
      const newKam: Kamar = {
        id: 'KMR-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
        kompleksId: selectedKompleksId,
        nama: kamNama.trim(),
        ketuaKamar: kamKetua.trim(),
        kapasitas: Number(kamKapasitas) || 15
      };
      onAddKamar(newKam);
      showToast(`Kamar "${kamNama.trim()}" berhasil ditambahkan.`);
    }
    setIsKamarModalOpen(false);
  };

  // Auto-numbering for closets in room
  const handleAutoNumbering = (mode: 'sequential' | 'random' | 'reset') => {
    if (!activeRoomForDetail) return;
    const members = getMembersOfRoom(activeRoomForDetail.nama);

    if (mode === 'reset') {
      members.forEach(s => onUpdateSantriRoom(s.id, activeRoomForDetail.nama, ''));
      showToast('Nomor lemari semua anggota berhasil direset.');
    } else if (mode === 'sequential') {
      members.sort((a, b) => a.nama.localeCompare(b.nama)).forEach((s, idx) => {
        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, String(idx + 1));
      });
      showToast('Nomor lemari berhasil dibuat secara berurutan (1, 2, 3...).');
    } else if (mode === 'random') {
      const n = members.length;
      const nums = Array.from({ length: n }, (_, i) => String(i + 1));
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      members.forEach((s, idx) => {
        onUpdateSantriRoom(s.id, activeRoomForDetail.nama, nums[idx]);
      });
      showToast('Nomor lemari berhasil diacak.');
    }
    setIsAutoNumberingDropdownOpen(false);
  };

  // Add Member Modal logic
  const handleOpenAddMemberModal = () => {
    setSelectedModalStudentIds([]);
    setAddMemberSearch('');
    setAddMemberRoomFilter('BelumKamar');
    setIsAddMemberModalOpen(true);
  };

  // Students eligible to be added to room
  const eligibleStudentsForAdd = santriList.filter(s => {
    if (s.gender !== selectedGender) return false;
    if (s.statusKeanggotaan === 'Alumni') return false;

    // Filter by room assignment status
    if (addMemberRoomFilter === 'BelumKamar') {
      const k = (s.kamar || '').trim().toLowerCase();
      if (k && k !== 'tanpa kamar') return false;
    }

    if (activeRoomForDetail) {
      const inCurrentRoom = (s.kamar || '').trim().toLowerCase() === activeRoomForDetail.nama.trim().toLowerCase();
      if (inCurrentRoom) return false;
    }

    // Filter by search query
    if (addMemberSearch) {
      const q = addMemberSearch.toLowerCase();
      const mName = (s.nama || '').toLowerCase().includes(q);
      const mNis = (s.nis || '').toLowerCase().includes(q);
      const mKamar = (s.kamar || '').toLowerCase().includes(q);
      if (!mName && !mNis && !mKamar) return false;
    }

    return true;
  });

  const handleConfirmAddMembers = () => {
    if (!activeRoomForDetail || selectedModalStudentIds.length === 0) return;

    selectedModalStudentIds.forEach(id => {
      onUpdateSantriRoom(id, activeRoomForDetail.nama);
    });

    showToast(`${selectedModalStudentIds.length} santri berhasil ditambahkan ke ${activeRoomForDetail.nama}.`);
    setSelectedModalStudentIds([]);
    setIsAddMemberModalOpen(false);
  };

  // Bulk Transfer Handler
  const handleConfirmBulkTransfer = () => {
    if (selectedStudentIds.length === 0 || !bulkDestRoomId) return;

    const destRoomObj = kamarList.find(r => r.id === bulkDestRoomId);
    if (!destRoomObj) return;

    selectedStudentIds.forEach(id => {
      onUpdateSantriRoom(id, destRoomObj.nama, bulkNomorLemari.trim());
    });

    showToast(`${selectedStudentIds.length} santri berhasil dipindahkan ke ${destRoomObj.nama}.`);
    setSelectedStudentIds([]);
    setIsSelectionMode(false);
    setIsBulkTransferOpen(false);
  };

  // Export Rooms Data to Excel
  const exportRoomsToExcel = () => {
    const profile = getPesantrenProfile();
    const filteredKompleks = kompleksList.filter(kom => kom.gender === selectedGender);

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
          .title { font-size: 16px; font-weight: bold; color: #7e22ce; text-align: center; }
          .meta { font-size: 10px; color: #64748b; text-align: center; }
          .kompleks-header { background-color: #7e22ce; color: #ffffff; font-size: 13px; font-weight: bold; text-align: center; }
          .kamar-header { background-color: #f3e8ff; color: #581c87; font-size: 11px; font-weight: bold; text-align: center; }
          .table-th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
        </style>
      </head>
      <body>
        <table style="width: 100%;">
          <tr>
            <td colspan="5" class="title">DATA KAMAR SANTRI ${selectedGender.toUpperCase()} - ${profile.namaPesantren.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="5" class="meta">Laporan terkelompok per Kompleks dan Kamar (${selectedGender}) • Tanggal: ${new Date().toLocaleDateString('id-ID')}</td>
          </tr>
        </table>
        <br/>
    `;

    filteredKompleks.forEach(kom => {
      const roomsInKom = kamarList.filter(r => r.kompleksId === kom.id);
      if (roomsInKom.length === 0) return;

      html += `
        <table style="width: 100%; margin-bottom: 10px;">
          <tr class="kompleks-header">
            <td colspan="5">KOMPLEKS: ${kom.nama.toUpperCase()} (${(kom.gender || 'PUTRA').toUpperCase()})</td>
          </tr>
        </table>
      `;

      roomsInKom.forEach(rm => {
        const members = getMembersOfRoom(rm.nama);
        html += `
          <table style="width: 100%; margin-bottom: 15px;">
            <tr class="kamar-header">
              <td colspan="5">Nama Kamar: ${rm.nama} &nbsp;|&nbsp; Ketua: ${rm.ketuaKamar || '-'} &nbsp;|&nbsp; Kapasitas: ${rm.kapasitas} &nbsp;|&nbsp; Jumlah: ${members.length} Santri</td>
            </tr>
            <tr>
              <th class="table-th">No</th>
              <th class="table-th">NIS</th>
              <th class="table-th">Nama Lengkap Santri</th>
              <th class="table-th">No. Lemari</th>
              <th class="table-th">Status</th>
            </tr>
        `;

        if (members.length === 0) {
          html += `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Belum ada santri terdaftar di kamar ini</td></tr>`;
        } else {
          members.sort((a, b) => a.nama.localeCompare(b.nama)).forEach((s, idx) => {
            html += `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace;">${s.nis || '-'}</td>
                <td style="font-weight: bold;">${s.nama}</td>
                <td style="text-align: center; font-family: monospace;">${s.nomorLemari || '-'}</td>
                <td style="text-align: center;">${s.statusKeanggotaan || 'Muqim'}</td>
              </tr>
            `;
          });
        }
        html += `</table><br/>`;
      });
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Kamar_Santri_${selectedGender}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle printing PDF for single Kamar
  const handlePrintKamarPDF = () => {
    if (!activeRoomForDetail || !selectedKompleks) return;
    const profile = getPesantrenProfile();
    const members = currentRoomMembers;

    if (members.length === 0) {
      showToast(`Tidak ada data santri pada ${activeRoomForDetail.nama}.`, 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Gagal membuka jendela cetak. Pastikan pop-up dibolehkan di peramban Anda.', 'error');
      return;
    }

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rowsHtml = members.map((s, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace;">${s.nis || '-'}</td>
        <td><strong>${s.nama}</strong></td>
        <td style="text-align: center; font-family: monospace;">${s.nomorLemari || '-'}</td>
        <td style="text-align: center;">${s.statusKeanggotaan || 'Muqim'}</td>
        <td>${s.desa ? `Ds. ${s.desa}, Kec. ${s.kecamatan || '-'}` : (s.alamat || s.asal || '-')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DAFTAR SANTRI ${activeRoomForDetail.nama.toUpperCase()} - KOMPLEKS ${selectedKompleks.nama.toUpperCase()}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #7e22ce; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 18px; color: #7e22ce; font-weight: bold; }
          .header p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
          .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; color: #334155; }
          .info { margin-bottom: 12px; font-size: 11px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 25px; text-align: right; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${profile.namaPesantren || 'PONDOK PESANTREN'}</h1>
          <p>${profile.alamat || ''} ${(profile as any).kota ? ' - ' + (profile as any).kota : ''}</p>
        </div>
        <div class="title">DAFTAR SANTRI ${activeRoomForDetail.nama.toUpperCase()} — KOMPLEKS ${selectedKompleks.nama.toUpperCase()}</div>
        <div class="info">
          <strong>Ketua Kamar:</strong> ${activeRoomForDetail.ketuaKamar || '-'} &nbsp;|&nbsp; 
          <strong>Kapasitas:</strong> ${activeRoomForDetail.kapasitas || 15} Bed &nbsp;|&nbsp; 
          <strong>Total Santri:</strong> ${members.length} Santri
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th style="width: 90px;">NIS</th>
              <th>Nama Santri</th>
              <th style="width: 80px; text-align: center;">No. Lemari</th>
              <th style="width: 80px; text-align: center;">Status</th>
              <th>Alamat / Asal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Dicetak pada: ${dateStr}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Handle printing PDF for selected Kompleks
  const handlePrintKompleksPDF = () => {
    if (!selectedKompleks) return;
    const profile = getPesantrenProfile();
    const roomsInKom = activeRooms;

    if (roomsInKom.length === 0) {
      showToast(`Tidak ada kamar terdaftar pada ${selectedKompleks.nama}.`, 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Gagal membuka jendela cetak. Pastikan pop-up dibolehkan di peramban Anda.', 'error');
      return;
    }

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let tablesHtml = '';
    roomsInKom.forEach(rm => {
      const members = getMembersOfRoom(rm.nama);
      const rowsHtml = members.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${s.nis || '-'}</td>
          <td><strong>${s.nama}</strong></td>
          <td style="text-align: center; font-family: monospace;">${s.nomorLemari || '-'}</td>
          <td style="text-align: center;">${s.statusKeanggotaan || 'Muqim'}</td>
        </tr>
      `).join('');

      tablesHtml += `
        <div style="margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-size: 11px; color: #7e22ce;">
          Kamar: ${rm.nama} (Ketua: ${rm.ketuaKamar || '-'} | Kapasitas: ${rm.kapasitas || 15} Bed | Total: ${members.length} Santri)
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th style="width: 100px;">NIS</th>
              <th>Nama Santri</th>
              <th style="width: 90px; text-align: center;">No. Lemari</th>
              <th style="width: 80px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${members.length > 0 ? rowsHtml : '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Belum ada santri</td></tr>'}
          </tbody>
        </table>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DAFTAR KAMAR KOMPLEKS ${selectedKompleks.nama.toUpperCase()}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #7e22ce; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 18px; color: #7e22ce; font-weight: bold; }
          .header p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
          .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; color: #334155; }
          .info { margin-bottom: 12px; font-size: 11px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 25px; text-align: right; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${profile.namaPesantren || 'PONDOK PESANTREN'}</h1>
          <p>${profile.alamat || ''} ${(profile as any).kota ? ' - ' + (profile as any).kota : ''}</p>
        </div>
        <div class="title">DAFTAR SELURUH KAMAR — KOMPLEKS ${selectedKompleks.nama.toUpperCase()}</div>
        <div class="info">
          <strong>Gender:</strong> Santri ${selectedGender} &nbsp;|&nbsp; 
          <strong>Total Kamar:</strong> ${roomsInKom.length} Kamar
        </div>
        ${tablesHtml}
        <div class="footer">
          Dicetak pada: ${dateStr}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const isPutra = selectedGender === 'Putra';
  const bgClass = isPutra ? 'bg-purple-600' : 'bg-rose-600';
  const textClass = isPutra ? 'text-purple-600' : 'text-rose-600';
  const borderClass = isPutra ? 'border-purple-100' : 'border-rose-100';
  const bgLightClass = isPutra ? 'bg-purple-50/50' : 'bg-rose-50/50';

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Overview Cards (HIDDEN WHEN IN DETAIL KOMPLEKS VIEW) */}
      {!selectedKompleksId && (
        <>
          {/* Header with Title & Gender Toggle Switcher */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl flex flex-wrap items-center gap-x-2">
                <span>Kelola Kamar</span>
                {canViewPutra && canViewPutri && (
                  <span 
                    onClick={() => {
                      setSelectedGender(selectedGender === 'Putra' ? 'Putri' : 'Putra');
                      setActiveRoomForDetail(null);
                    }}
                    className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none cursor-pointer active:scale-95 ${
                      selectedGender === 'Putra' 
                        ? 'text-indigo-600 hover:text-indigo-700' 
                        : 'text-rose-600 hover:text-rose-700'
                    }`}
                    title="Klik untuk mengubah filter gender (Putra ⇄ Putri)"
                  >
                    <span>
                      {selectedGender === 'Putra' ? 'Santri Putra' : 'Santri Putri'}
                    </span>
                    <ArrowLeftRight className="h-5 w-5 mt-0.5 shrink-0" />
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Kelola struktur kompleks asrama, kamar santri, kapasitas tempat tidur, dan distribusi anggota kamar.
              </p>
            </div>
          </div>

          {/* Top Level Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-2xl border ${borderClass} ${bgLightClass} p-4.5 shadow-xs flex items-center gap-4 transition-all`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgClass} text-white shadow-sm`}>
                <Building2 className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Kompleks ({selectedGender})</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>{currentGenderKompleks.length}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Home className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Kamar Aktif</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>{activeGenderKamar.length}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ruang</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <BedDouble className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Santri Ditempatkan</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>{placedSantriCount} / {activeGenderSantri.length}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Santri</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <UserCheck className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Kapasitas</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>{overallOccupancyPercent}%</span>
                  <span className="text-xs font-medium text-slate-400">({placedSantriCount}/{totalGenderCapacity})</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!selectedKompleksId || !selectedKompleks ? (
          /* LEVEL 1 VIEW: KOMPLEKS GRID & KAMAR GRID (MEMBERI RASA UI/UX SAMA PERSIS SEPERTI LEMBAGA & KELAS PENDIDIKAN) */
          <motion.div
            key="kompleks-kamar-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Section 1: Daftar Kompleks Asrama Cards */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Daftar Kompleks Asrama ({selectedGender})
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={exportRoomsToExcel}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-3xs"
                    title="Ekspor Data Excel"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {canWriteCurrent && (
                    <button
                      onClick={handleOpenAddKompleks}
                      className={`px-3.5 py-1.5 rounded-xl ${bgClass} text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all cursor-pointer`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kompleks</span>
                    </button>
                  )}
                </div>
              </div>

              {currentGenderKompleks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Belum ada Kompleks Asrama ({selectedGender})</p>
                  <p className="text-[10px] text-slate-400">Klik tombol "Tambah Kompleks" untuk menambahkan lokasi asrama baru.</p>
                </div>
              ) : (
                /* Card Grid 2 Kolom - Gaya Lembaga/Pendidikan */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentGenderKompleks.map(kom => {
                    const rooms = kamarList.filter(r => r.kompleksId === kom.id);
                    const roomNames = rooms.map(r => r.nama.toLowerCase());
                    const studentsInKom = activeGenderSantri.filter(s => {
                      const kName = (s.kamar || '').trim().toLowerCase();
                      return kName && roomNames.includes(kName);
                    }).length;

                    return (
                      <div
                        key={kom.id}
                        onClick={() => {
                          setSelectedKompleksId(kom.id);
                          if (rooms.length > 0) {
                            setActiveRoomForDetail(rooms[0]);
                          } else {
                            setActiveRoomForDetail(null);
                          }
                        }}
                        className="group relative bg-white border border-slate-100 rounded-2xl cursor-pointer transition-all hover:border-slate-300 hover:shadow-md flex h-32 overflow-hidden"
                      >
                        {/* Box Kiri: Icon Kompleks */}
                        <div className="w-24 bg-slate-50 flex items-center justify-center shrink-0 border-r border-slate-100 relative overflow-hidden">
                          <div className="flex flex-col items-center justify-center p-2 text-slate-300 text-center">
                            <Building2 className={`h-8 w-8 ${isPutra ? 'text-purple-600' : 'text-rose-600'}`} />
                          </div>
                        </div>

                        {/* Box Kanan: Informasi & Stats */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-base font-black text-slate-800 leading-tight group-hover:text-purple-700 transition-colors truncate">
                                  {kom.nama}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                  Kompleks Asrama {selectedGender}
                                </p>
                              </div>

                              {/* Menu Tiga Titik */}
                              {canWriteCurrent && (
                                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => handleOpenMenu(e, 'kompleks', kom.id, kom)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                                    title="Menu Pilihan"
                                  >
                                    <MoreVertical className="h-4.5 w-4.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stats Counter */}
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Home className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{rooms.length} Kamar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{studentsInKom} Santri</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* LEVEL 2 VIEW: DETAIL ANGGOTA KAMAR & SANTRI TABLE (SAMAPERSIS DENGAN DETAIL KELAS DI PENDIDIKAN FORMAL) */
          <motion.div
            key="kamar-detail-students-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Split View 30/70 Layout - 2 Box Red Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel (30% - 4 col): Daftar Kamar di Kompleks Ini */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
                  {/* Top Back & Header */}
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => {
                        setSelectedKompleksId(null);
                        setActiveRoomForDetail(null);
                      }}
                      className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-3xs"
                      title="Kembali ke Daftar Kompleks"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Center Kompleks Icon & Title */}
                  <div className="text-center space-y-2">
                    <div className={`w-14 h-14 rounded-2xl ${bgLightClass} border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs mx-auto`}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedKompleks?.nama}
                      </h3>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                        {sortedRooms.length} KAMAR &bull; {getMembersOfKompleks(selectedKompleks?.id || '').length} SANTRI
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => handlePrintKompleksPDF()}
                        className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-3xs"
                        title="Cetak PDF Kompleks"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {canWriteCurrent && selectedKompleks && (
                        <>
                          <button
                            onClick={() => handleOpenEditKompleks(selectedKompleks)}
                            className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-3xs"
                            title="Edit Kompleks"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => askConfirmation(
                              'Hapus Kompleks',
                              `Apakah Anda yakin ingin menghapus kompleks "${selectedKompleks.nama}"? Seluruh kamar di dalamnya juga akan terhapus.`,
                              () => {
                                onDeleteKompleks(selectedKompleks.id);
                                setSelectedKompleksId(null);
                                setActiveRoomForDetail(null);
                              }
                            )}
                            className="p-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer shadow-3xs"
                            title="Hapus Kompleks"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider and DAFTAR KAMAR title */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      DAFTAR KAMAR
                    </h4>
                    {canWriteCurrent && (
                      <button
                        onClick={handleOpenAddKamar}
                        className={`p-1.5 rounded-xl ${bgClass} text-white transition-all cursor-pointer shadow-xs hover:opacity-90`}
                        title="Tambah Kamar Baru"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Kamar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kamar / ketua..."
                      value={roomSearchQuery}
                      onChange={e => setRoomSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                  </div>

                  {/* Kamar List Nav */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {sortedRooms.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Belum ada kamar di {selectedKompleks?.nama}
                      </div>
                    ) : (
                      sortedRooms.map(kam => {
                        const members = getMembersOfRoom(kam.nama);
                        const capacity = kam.kapasitas || 15;
                        const isSelected = activeRoomForDetail?.id === kam.id;

                        return (
                          <div
                            key={kam.id}
                            onClick={() => {
                              setActiveRoomForDetail(kam);
                              setCurrentPage(1);
                              setStudentSearchQuery('');
                              setSelectedStudentIds([]);
                              setIsSelectionMode(false);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? `${bgClass} text-white border-transparent shadow-md`
                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Folder className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                              <div className="min-w-0">
                                <h4 className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                  {kam.nama}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {members.length}/{capacity}
                              </span>

                              {canWriteCurrent && (
                                <div onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={e => handleOpenMenu(e, 'kamar', kam.id, kam)}
                                    className={`p-1 rounded transition-colors cursor-pointer ${isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                                    title="Opsi Kamar"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel (70% - 8 col): Detail Kamar & Table Santri */}
              <div className="lg:col-span-8 space-y-4">
                {activeRoomForDetail ? (
                  <>

            {/* Room Banner & Detail Header Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-5">
              {/* Header Title & Icon Action Buttons Row */}
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    DETAIL KAMAR
                  </h4>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {activeRoomForDetail.nama}
                  </h3>
                </div>

                {/* Top Right Action Buttons Group */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintKamarPDF}
                    className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-all cursor-pointer"
                    title="Cetak Data Kamar"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {canWriteCurrent && (
                    <button
                      onClick={() => handleOpenEditKamar(activeRoomForDetail)}
                      className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-all cursor-pointer"
                      title="Edit Kamar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {canWriteCurrent && (
                    <button
                      onClick={handleOpenAddMemberModal}
                      className="p-2.5 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-2xs transition-all cursor-pointer"
                      title="Tambah Anggota Santri ke Kamar"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}

                  {canWriteCurrent && (
                    <button
                      onClick={() => askConfirmation(
                        'Hapus Kamar',
                        `Apakah Anda yakin ingin menghapus kamar "${activeRoomForDetail.nama}"?`,
                        () => {
                          const members = getMembersOfRoom(activeRoomForDetail.nama);
                          members.forEach(m => onUpdateSantriRoom(m.id, ''));
                          onDeleteKamar(activeRoomForDetail.id);
                          setActiveRoomForDetail(null);
                        }
                      )}
                      className="p-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs transition-all cursor-pointer"
                      title="Hapus Kamar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stat Cards (Wali Kelas / Ketua Kamar, Kapasitas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Ketua Kamar */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    KETUA KAMAR
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-800 truncate">
                      {activeRoomForDetail.ketuaKamar || 'Belum Ditentukan'}
                    </span>
                  </div>
                </div>

                {/* Card 2: Kapasitas */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <span>KAPASITAS</span>
                    <span className="text-purple-700 font-extrabold">{currentRoomMembers.length} / {activeRoomForDetail.kapasitas || 15}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((currentRoomMembers.length / (activeRoomForDetail.kapasitas || 15)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search, Filter & Bulk Action Toolbar */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Search & Action Controls */}
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Dropdown Atur Nomor Lemari (Button with Dropdown) - Most Left */}
                  {canWriteCurrent && (
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setIsAutoNumberingDropdownOpen(!isAutoNumberingDropdownOpen)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 text-xs font-bold"
                        title="Atur Nomor Lemari"
                      >
                        <Hash className="w-4 h-4 text-purple-600" />
                        <span>Atur Lemari</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {isAutoNumberingDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setIsAutoNumberingDropdownOpen(false)} />
                          <div className="absolute left-0 mt-1 w-44 rounded-2xl border border-slate-100 bg-white shadow-xl py-1.5 z-30 text-xs font-medium animate-fade-in">
                            <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Atur No. Lemari
                            </div>
                            <button
                              onClick={() => {
                                setIsAutoNumberingDropdownOpen(false);
                                handleAutoNumbering('sequential');
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-bold cursor-pointer transition-colors"
                            >
                              Terurut
                            </button>
                            <button
                              onClick={() => {
                                setIsAutoNumberingDropdownOpen(false);
                                handleAutoNumbering('random');
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-bold cursor-pointer transition-colors"
                            >
                              Acak
                            </button>
                            <button
                              onClick={() => {
                                setIsAutoNumberingDropdownOpen(false);
                                handleAutoNumbering('reset');
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 font-bold border-t border-slate-100 cursor-pointer transition-colors"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIS, no. lemari..."
                      value={studentSearchQuery}
                      onChange={e => {
                        setStudentSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="py-1.5 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none cursor-pointer"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Muqim">Muqim</option>
                    <option value="Kampung">Kampung</option>
                  </select>
                </div>

                    {/* Horizontal Scroll Header Navigation Buttons (shown only when horizontal scroll is active) */}
                    {(canScrollLeft || canScrollRight) && (
                      <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        {canScrollLeft && (
                          <button
                            onClick={() => scrollTable('left')}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-3xs"
                            title="Gulir Ke Kiri"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {canScrollRight && (
                          <button
                            onClick={() => scrollTable('right')}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-3xs"
                            title="Gulir Ke Kanan"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

              {/* Bulk Action Bar Banner */}
              {selectedStudentIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border border-purple-200 p-3 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                    <span className="text-xs font-bold text-purple-950">
                      {selectedStudentIds.length} Santri Terpilih
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBulkTransferOpen(true)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Pindahkan ke Kamar Lain</span>
                    </button>

                    <button
                      onClick={() => askConfirmation(
                        'Keluarkan Santri Terpilih',
                        `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.length} santri dari kamar ini?`,
                        () => {
                          selectedStudentIds.forEach(id => onUpdateSantriRoom(id, ''));
                          setSelectedStudentIds([]);
                          setIsSelectionMode(false);
                          showToast(`${selectedStudentIds.length} santri dikeluarkan dari kamar.`);
                        }
                      )}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Keluarkan</span>
                    </button>

                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Responsive Santri Table */}
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div 
                ref={tableContainerRef}
                onScroll={updateScrollButtons}
                className="overflow-x-auto min-h-[350px]"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold select-none">
                      {isSelectionMode && (
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                            onChange={e => {
                              if (e.target.checked) {
                                const newIds = Array.from(new Set([...selectedStudentIds, ...paginatedStudents.map(s => s.id)]));
                                setSelectedStudentIds(newIds);
                              } else {
                                const pageIds = paginatedStudents.map(s => s.id);
                                setSelectedStudentIds(selectedStudentIds.filter(id => !pageIds.includes(id)));
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="py-3 px-3.5 w-12 text-center">No</th>
                      {renderSortableHeader('No. Lemari', 'nomorLemari', 'py-3 px-3.5 w-28 text-center')}
                      {renderSortableHeader('Nama Santri', 'nama', 'py-3 px-3.5 min-w-[200px] relative')}
                      {renderSortableHeader('NIS', 'nis', 'py-3 px-3.5 w-28')}
                      {renderSortableHeader('Alamat', 'alamat', 'py-3 px-3.5 w-48')}
                      <th className="py-3 px-3.5 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                          Belum ada santri terdaftar di kamar ini.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s, idx) => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        const isKetua = Boolean(
                          activeRoomForDetail?.ketuaKamar && 
                          activeRoomForDetail.ketuaKamar.trim().toLowerCase() === s.nama.trim().toLowerCase()
                        );

                        return (
                          <tr 
                            key={s.id}
                            className={`hover:bg-purple-50/20 transition-colors ${isChecked ? 'bg-purple-50/40' : ''}`}
                          >
                            {isSelectionMode && (
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                                    else setSelectedStudentIds([...selectedStudentIds, s.id]);
                                  }}
                                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                            )}
                            {/* No */}
                            <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                              <div className="flex items-center justify-center gap-1">
                                {isKetua && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                )}
                                <span className={isKetua ? "font-bold text-amber-600" : ""}>{startIndex + idx + 1}</span>
                              </div>
                            </td>
                            {/* No. Lemari */}
                            <td className="py-3 px-3.5 text-center">
                              {editingLemariStudent?.id === s.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="text"
                                    value={tempLemariValue}
                                    onChange={e => setTempLemariValue(e.target.value)}
                                    placeholder="No..."
                                    className="w-16 px-2 py-0.5 text-center font-mono text-xs border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      onUpdateSantriRoom(s.id, activeRoomForDetail.nama, tempLemariValue.trim());
                                      setEditingLemariStudent(null);
                                      showToast('Nomor lemari diperbarui.');
                                    }}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingLemariStudent(null)}
                                    className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => {
                                    if (canWriteCurrent) {
                                      setEditingLemariStudent(s);
                                      setTempLemariValue(s.nomorLemari || '');
                                    }
                                  }}
                                  className="font-mono font-bold text-xs bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer border border-slate-200 transition-colors inline-block"
                                  title="Klik untuk ubah nomor lemari"
                                >
                                  {s.nomorLemari || '-'}
                                </span>
                              )}
                            </td>
                            {/* Nama Santri */}
                            <td className="py-3 px-3.5">
                              <div 
                                onClick={() => setSelectedSantriForDetail(s)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                                title="Klik untuk lihat biodata lengkap"
                              >
                                {renderSantriAvatar(s, "w-8 h-8 rounded-full border border-slate-200 text-xs font-bold")}
                                <div>
                                  <p className="font-extrabold text-slate-800 group-hover:text-purple-600 transition-colors">
                                    {s.nama}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="inline-block text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {s.statusDomisili || s.status || 'Muqim'}
                                    </span>
                                    {isKetua && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9.5px] font-bold border border-amber-200/60">
                                        <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                                        Ketua
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* NIS */}
                            <td className="py-3 px-3.5 font-mono text-slate-600 font-bold text-[11px]">
                              {s.nis || '-'}
                            </td>
                            <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                              {s.desa ? `Ds. ${s.desa}, Kec. ${s.kecamatan || '-'}` : (s.alamat || s.asal || '-')}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center">
                                {canWriteCurrent && (
                                  <button
                                    onClick={e => handleOpenMenu(e, 'santri', s.id, s)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Opsi Santri"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-xs font-bold text-slate-600">
                <span>
                  Halaman {activePage} dari {totalPages} ({sortedStudents.length} Santri)
                </span>

                <div className="flex items-center gap-1.5 self-center">
                  <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg font-bold transition-colors cursor-pointer ${
                        page === activePage ? 'bg-purple-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
                    <Home className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-xs font-bold text-slate-600">Pilih Kamar di Panel Kiri</h3>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Silakan pilih salah satu kamar di daftar sebelah kiri untuk melihat detail anggota santri, nomor lemari, dan penataan tempat tidur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL ADD / EDIT KOMPLEKS --- */}
      <AnimatePresence>
        {isKompleksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  {editingKompleks ? 'Edit Kompleks Asrama' : 'Tambah Kompleks Asrama Baru'}
                </h3>
                <button onClick={() => setIsKompleksModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveKompleks} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Kompleks</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kompleks Sunan Ampel"
                    value={komNama}
                    onChange={e => setKomNama(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKompleksModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${bgClass} shadow-sm hover:opacity-90`}
                  >
                    Simpan Kompleks
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL ADD / EDIT KAMAR --- */}
      <AnimatePresence>
        {isKamarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-600" />
                  {editingKamar ? 'Edit Kamar' : 'Tambah Kamar Baru'}
                </h3>
                <button onClick={() => setIsKamarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveKamar} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Kamar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamar A1 - Abu Bakar"
                    value={kamNama}
                    onChange={e => setKamNama(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kapasitas Tempat Tidur (Bed)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={kamKapasitas}
                    onChange={e => setKamKapasitas(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKamarModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${bgClass} shadow-sm hover:opacity-90`}
                  >
                    Simpan Kamar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL ADD SANTRI TO ROOM --- */}
      <AnimatePresence>
        {isAddMemberModalOpen && activeRoomForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Tambah Anggota Kamar</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {selectedKompleks?.nama?.toLowerCase()} &bull; {activeRoomForDetail.nama?.toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - 2 Columns */}
              {(() => {
                const unselectedEligibleStudents = eligibleStudentsForAdd.filter(s => !selectedModalStudentIds.includes(s.id));
                const selectedStudentsForModal = santriList.filter(s => selectedModalStudentIds.includes(s.id));

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-1 overflow-hidden min-h-[380px] max-h-[500px]">
                    {/* Left Column: Santri Tersedia */}
                    <div className="flex flex-col h-full overflow-hidden bg-white">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <span className="text-xs font-extrabold text-slate-800">Santri Tersedia</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {unselectedEligibleStudents.length}
                        </span>
                      </div>

                      {/* Filter Bar */}
                      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-2 shrink-0">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari nama atau NIS..."
                            value={addMemberSearch}
                            onChange={e => setAddMemberSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <select
                          value={addMemberRoomFilter}
                          onChange={e => setAddMemberRoomFilter(e.target.value)}
                          className="py-1.5 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer w-full sm:w-auto"
                        >
                          <option value="BelumKamar">Belum Memiliki Kamar</option>
                          <option value="Semua">Semua Santri</option>
                        </select>
                      </div>

                      {/* Available List */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {unselectedEligibleStudents.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                            <User className="w-10 h-10 text-slate-300 stroke-1 mb-2" />
                            <p className="text-xs font-bold text-slate-400">Tidak ada santri tersedia</p>
                          </div>
                        ) : (
                          unselectedEligibleStudents.map(s => (
                            <div
                              key={s.id}
                              onClick={() => setSelectedModalStudentIds([...selectedModalStudentIds, s.id])}
                              className="p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-emerald-50/40 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-3xs group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {renderSantriAvatar(s, "w-8 h-8 rounded-full border border-slate-200 text-xs font-bold shrink-0")}
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-slate-800 truncate">{s.nama}</p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    NIS: {s.nis || '-'} &bull; {s.kamar || 'Belum Ada Kamar'}
                                  </p>
                                </div>
                              </div>
                              <button className="p-1 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 cursor-pointer">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Column: Santri Dipilih */}
                    <div className="flex flex-col h-full overflow-hidden bg-slate-50/30">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <span className="text-xs font-extrabold text-slate-800">Santri Dipilih</span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {selectedStudentsForModal.length}
                        </span>
                      </div>

                      {/* Selected List */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {selectedStudentsForModal.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[260px]">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 border border-slate-200/80">
                              <Check className="w-5 h-5 text-slate-300 stroke-[2.5]" />
                            </div>
                            <p className="text-xs font-bold text-slate-400">Belum ada santri dipilih</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Klik santri di sebelah kiri untuk menambahkan
                            </p>
                          </div>
                        ) : (
                          selectedStudentsForModal.map(s => (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3 shadow-3xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {renderSantriAvatar(s, "w-8 h-8 rounded-full border border-emerald-200 text-xs font-bold shrink-0")}
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-slate-900 truncate">{s.nama}</p>
                                  <p className="text-[10px] text-slate-500 truncate">NIS: {s.nis || '-'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedModalStudentIds(selectedModalStudentIds.filter(id => id !== s.id))}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                title="Batalkan pilihan"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white shrink-0">
                <span className="text-xs font-medium text-slate-400">
                  Pilih santri dari daftar di sebelah kiri
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    disabled={selectedModalStudentIds.length === 0}
                    onClick={handleConfirmAddMembers}
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Tambahkan ({selectedModalStudentIds.length})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL BULK TRANSFER / SINGLE TRANSFER KAMAR --- */}
      <AnimatePresence>
        {(isBulkTransferOpen || singleTransferStudent) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                  {singleTransferStudent ? `Pindahkan ${singleTransferStudent.nama}` : `Pindahkan ${selectedStudentIds.length} Santri`}
                </h3>
                <button 
                  onClick={() => {
                    setIsBulkTransferOpen(false);
                    setSingleTransferStudent(null);
                  }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Kompleks Tujuan</label>
                  <select
                    value={singleTransferStudent ? singleDestKompleksId : bulkDestKompleksId}
                    onChange={e => {
                      if (singleTransferStudent) {
                        setSingleDestKompleksId(e.target.value);
                        setSingleDestRoomId('');
                      } else {
                        setBulkDestKompleksId(e.target.value);
                        setBulkDestRoomId('');
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">-- Pilih Kompleks --</option>
                    {currentGenderKompleks.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Kamar Tujuan</label>
                  <select
                    disabled={!(singleTransferStudent ? singleDestKompleksId : bulkDestKompleksId)}
                    value={singleTransferStudent ? singleDestRoomId : bulkDestRoomId}
                    onChange={e => {
                      if (singleTransferStudent) setSingleDestRoomId(e.target.value);
                      else setBulkDestRoomId(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {kamarList
                      .filter(r => r.kompleksId === (singleTransferStudent ? singleDestKompleksId : bulkDestKompleksId))
                      .map(r => {
                        const count = getMembersOfRoom(r.nama).length;
                        const cap = r.kapasitas || 15;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({count}/{cap})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Lemari (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 05"
                    value={singleTransferStudent ? singleNomorLemari : bulkNomorLemari}
                    onChange={e => {
                      if (singleTransferStudent) setSingleNomorLemari(e.target.value);
                      else setBulkNomorLemari(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkTransferOpen(false);
                    setSingleTransferStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  disabled={!(singleTransferStudent ? singleDestRoomId : bulkDestRoomId)}
                  onClick={() => {
                    if (singleTransferStudent) {
                      const destRoom = kamarList.find(r => r.id === singleDestRoomId);
                      if (destRoom) {
                        onUpdateSantriRoom(singleTransferStudent.id, destRoom.nama, singleNomorLemari.trim());
                        showToast(`Santri "${singleTransferStudent.nama}" dipindahkan ke ${destRoom.nama}.`);
                        setSingleTransferStudent(null);
                      }
                    } else {
                      handleConfirmBulkTransfer();
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${bgClass} shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Konfirmasi Pindah
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SANTRI DETAIL MODAL --- */}
      {selectedSantriForDetail && (
        <SantriDetailModal
          selectedSantri={selectedSantriForDetail}
          onClose={() => setSelectedSantriForDetail(null)}
        />
      )}

      {/* --- FLOATING TOP-LAYER ACTION DROPDOWN MENU --- */}
      <AnimatePresence>
        {menuDropdown && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setMenuDropdown(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              style={{ top: menuDropdown.top, right: menuDropdown.right }}
              className="fixed w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs font-bold text-slate-700"
              onClick={e => e.stopPropagation()}
            >
              {menuDropdown.type === 'kompleks' && (
                <>
                  <button
                    onClick={() => {
                      const kom = menuDropdown.data as Kompleks;
                      setMenuDropdown(null);
                      handleOpenEditKompleks(kom);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const kom = menuDropdown.data as Kompleks;
                      setMenuDropdown(null);
                      askConfirmation(
                        'Hapus Kompleks',
                        `Apakah Anda yakin ingin menghapus kompleks "${kom.nama}"? Seluruh kamar di dalamnya juga akan terhapus.`,
                        () => onDeleteKompleks(kom.id)
                      );
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer border-t border-slate-100"
                  >
                    Hapus
                  </button>
                </>
              )}

              {menuDropdown.type === 'kamar' && (
                <>
                  <button
                    onClick={() => {
                      const kam = menuDropdown.data as Kamar;
                      setMenuDropdown(null);
                      handleOpenEditKamar(kam);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const kam = menuDropdown.data as Kamar;
                      setMenuDropdown(null);
                      askConfirmation(
                        'Hapus Kamar',
                        `Apakah Anda yakin ingin menghapus kamar "${kam.nama}"?`,
                        () => {
                          const members = getMembersOfRoom(kam.nama);
                          members.forEach(m => onUpdateSantriRoom(m.id, ''));
                          onDeleteKamar(kam.id);
                          if (activeRoomForDetail?.id === kam.id) {
                            setActiveRoomForDetail(null);
                          }
                        }
                      );
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer border-t border-slate-100"
                  >
                    Hapus
                  </button>
                </>
              )}

              {menuDropdown.type === 'santri' && (
                <>
                  <button
                    onClick={() => {
                      const s = menuDropdown.data as Santri;
                      setMenuDropdown(null);
                      askConfirmation(
                        'Jadikan Ketua Kamar',
                        `Apakah Anda yakin ingin menjadikan "${s.nama}" sebagai ketua kamar ini?`,
                        () => {
                          if (activeRoomForDetail) {
                            const updated = { ...activeRoomForDetail, ketuaKamar: s.nama };
                            onUpdateKamar(updated);
                            setActiveRoomForDetail(updated);
                            showToast(`Santri "${s.nama}" berhasil dijadikan Ketua Kamar.`);
                          }
                        }
                      );
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Jadikan Ketua
                  </button>
                  <button
                    onClick={() => {
                      const s = menuDropdown.data as Santri;
                      setMenuDropdown(null);
                      setSingleTransferStudent(s);
                      setSingleDestKompleksId(selectedKompleksId || '');
                      setSingleDestRoomId(activeRoomForDetail?.id || '');
                      setSingleNomorLemari(s.nomorLemari || '');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Pindah
                  </button>
                  <button
                    onClick={() => {
                      const s = menuDropdown.data as Santri;
                      setMenuDropdown(null);
                      askConfirmation(
                        'Keluarkan Santri',
                        `Apakah Anda yakin ingin mengeluarkan santri "${s.nama}" dari kamar ini?`,
                        () => {
                          onUpdateSantriRoom(s.id, '');
                          showToast(`Santri "${s.nama}" dikeluarkan dari kamar.`);
                        }
                      );
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer border-t border-slate-100"
                  >
                    Keluarkan
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- CONFIRMATION DIALOG --- */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{confirmModal.message}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                >
                  {confirmModal.confirmText || 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

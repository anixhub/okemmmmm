import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Home, BedDouble, Plus, Trash2, Edit, Users, ChevronRight, ChevronLeft,
  ArrowLeft, Search, Check, CheckCircle2, AlertCircle, X, MoreVertical, Award,
  Folder, FolderOpen, User, ArrowUpDown, Pencil, Settings, UserPlus, ArrowUp, ArrowDown,
  ChevronDown, Printer, Sparkles, UserCheck, ShieldAlert, UserMinus, ArrowLeftRight,
  Download, Eye, Sliders, Hash, FileSpreadsheet
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
  const [sortField, setSortField] = useState<'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar' | null>(null);
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
  const [canScrollRight, setCanScrollRight] = useState(true);
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

  // Ensure default selected Kompleks
  useEffect(() => {
    if (currentGenderKompleks.length > 0) {
      const exists = currentGenderKompleks.some(k => k.id === selectedKompleksId);
      if (!exists) {
        setSelectedKompleksId(currentGenderKompleks[0].id);
      }
    } else {
      setSelectedKompleksId('');
    }
  }, [selectedGender, kompleksList]);

  const selectedKompleks = kompleksList.find(k => k.id === selectedKompleksId);

  // Filtered Rooms under currently selected Kompleks
  const activeRooms = kamarList.filter(r => r.kompleksId === selectedKompleksId);

  // Helper to get students belonging to a room
  const getMembersOfRoom = (roomName: string) => {
    return santriList.filter(s => {
      if (s.gender !== selectedGender) return false;
      if (s.statusKeanggotaan === 'Alumni') return false;
      return (s.kamar || '').trim().toLowerCase() === roomName.trim().toLowerCase();
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
  const activeGenderSantri = santriList.filter(s => s.gender === selectedGender && s.statusKeanggotaan !== 'Alumni');
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

    // Status filter
    if (statusFilter !== 'Semua') {
      const sStatus = s.statusKeanggotaan || 'Muqim';
      if (statusFilter === 'Muqim' && sStatus.toLowerCase() !== 'muqim' && sStatus.toLowerCase() !== 'aktif') return false;
      if (statusFilter === 'Kampung' && sStatus.toLowerCase() !== 'kampung') return false;
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

    const res = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? res : -res;
  });

  // Pagination
  const itemsPerPage = 15;
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  // Sorting Handler
  const handleSort = (field: 'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortableHeader = (label: string, field: 'nama' | 'nis' | 'nomorLemari' | 'statusKeanggotaan' | 'kamar', extraClass: string) => {
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

      {/* Header Bar with Gender Switcher & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPutra ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'} shadow-xs`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Kelola Kamar & Kompleks Asrama ({selectedGender})
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Kelola struktur kompleks asrama, kamar santri, kapasitas tempat tidur, dan distribusi anggota kamar.
            </p>
          </div>
        </div>

        {/* Gender Toggle Pill */}
        {canViewPutra && canViewPutri && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] font-bold text-slate-500">Kategori:</span>
            <div className="relative bg-slate-100 p-1 rounded-full flex items-center gap-1 w-44 border border-slate-200/80">
              <motion.div
                className={`absolute top-1 bottom-1 rounded-full ${bgClass}`}
                layoutId="activeGenderPillKamar"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                style={{
                  left: isPutra ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)'
                }}
              />
              <button
                onClick={() => {
                  setSelectedGender('Putra');
                  setActiveRoomForDetail(null);
                }}
                className={`relative flex-1 text-center py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors z-10 ${
                  isPutra ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Putra
              </button>
              <button
                onClick={() => {
                  setSelectedGender('Putri');
                  setActiveRoomForDetail(null);
                }}
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

      {/* Top Level Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className={`rounded-2xl border ${borderClass} ${bgLightClass} p-4.5 shadow-xs flex items-center gap-4 transition-all`}>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgClass} text-white shadow-sm`}>
            <Building2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Kompleks ({selectedGender})</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1.5">{currentGenderKompleks.length} Unit</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Home className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Kamar Aktif</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1.5">{activeGenderKamar.length} Ruang</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <BedDouble className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Santri Ditempatkan</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1.5">{placedSantriCount} / {activeGenderSantri.length} Santri</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <UserCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Keterisian Kasur</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1.5">{overallOccupancyPercent}% ({placedSantriCount}/{totalGenderCapacity})</p>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!activeRoomForDetail ? (
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
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {currentGenderKompleks.length} Kompleks
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={exportRoomsToExcel}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    title="Ekspor seluruh data kamar ke Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Excel</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentGenderKompleks.map(kom => {
                    const isSelected = selectedKompleksId === kom.id;
                    const rooms = kamarList.filter(r => r.kompleksId === kom.id);
                    const roomNames = rooms.map(r => r.nama.toLowerCase());
                    const studentsInKom = activeGenderSantri.filter(s => {
                      const kName = (s.kamar || '').trim().toLowerCase();
                      return kName && roomNames.includes(kName);
                    }).length;

                    const totalCapacityInKom = rooms.reduce((sum, r) => sum + (r.kapasitas || 15), 0);
                    const komOccupancyRate = totalCapacityInKom > 0 ? Math.min(100, Math.round((studentsInKom / totalCapacityInKom) * 100)) : 0;

                    return (
                      <div
                        key={kom.id}
                        onClick={() => setSelectedKompleksId(kom.id)}
                        className={`group relative rounded-2xl p-4 border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/10 shadow-sm' 
                            : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'} transition-colors`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-purple-700 transition-colors">
                                {kom.nama}
                              </h4>
                              <p className="text-[9.5px] font-mono text-slate-400 mt-0.5">Kode: {kom.kode || '-'}</p>
                            </div>
                          </div>

                          {/* Options menu for Kompleks */}
                          {canWriteCurrent && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditKompleks(kom)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
                                title="Edit Kompleks"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => askConfirmation(
                                  'Hapus Kompleks',
                                  `Apakah Anda yakin ingin menghapus kompleks "${kom.nama}"? Seluruh kamar di dalamnya juga akan terhapus.`,
                                  () => onDeleteKompleks(kom.id)
                                )}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Kompleks"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar & Stats */}
                        <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-bold">{rooms.length} Kamar • {studentsInKom} Santri</span>
                            <span className="font-mono font-extrabold text-slate-700">{komOccupancyRate}% Terisi</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${bgClass} transition-all duration-300`}
                              style={{ width: `${komOccupancyRate}%` }}
                            />
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-1 rounded-full shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Daftar Kamar Grid di Kompleks Terpilih */}
            {selectedKompleks && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Home className="w-4 h-4 text-purple-600" />
                      Daftar Kamar — {selectedKompleks.nama}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pilih kamar untuk melihat dan mengelola daftar santri, nomor lemari, serta penataan tempat tidur.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Kamar */}
                    <div className="relative min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari kamar / ketua..."
                        value={roomSearchQuery}
                        onChange={e => setRoomSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Urutkan</span>
                      </button>

                      {isSortDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                          <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-30 text-xs">
                            <button
                              onClick={() => { setRoomSortKey('name-asc'); setIsSortDropdownOpen(false); }}
                              className={`w-full px-3 py-1.5 text-left font-medium hover:bg-slate-50 ${roomSortKey === 'name-asc' ? 'text-purple-600 font-extrabold bg-purple-50/50' : 'text-slate-600'}`}
                            >
                              Nama (A-Z)
                            </button>
                            <button
                              onClick={() => { setRoomSortKey('name-desc'); setIsSortDropdownOpen(false); }}
                              className={`w-full px-3 py-1.5 text-left font-medium hover:bg-slate-50 ${roomSortKey === 'name-desc' ? 'text-purple-600 font-extrabold bg-purple-50/50' : 'text-slate-600'}`}
                            >
                              Nama (Z-A)
                            </button>
                            <button
                              onClick={() => { setRoomSortKey('students-desc'); setIsSortDropdownOpen(false); }}
                              className={`w-full px-3 py-1.5 text-left font-medium hover:bg-slate-50 ${roomSortKey === 'students-desc' ? 'text-purple-600 font-extrabold bg-purple-50/50' : 'text-slate-600'}`}
                            >
                              Santri Terbanyak
                            </button>
                            <button
                              onClick={() => { setRoomSortKey('students-asc'); setIsSortDropdownOpen(false); }}
                              className={`w-full px-3 py-1.5 text-left font-medium hover:bg-slate-50 ${roomSortKey === 'students-asc' ? 'text-purple-600 font-extrabold bg-purple-50/50' : 'text-slate-600'}`}
                            >
                              Santri Tersedikit
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {canWriteCurrent && (
                      <button
                        onClick={handleOpenAddKamar}
                        className={`px-3.5 py-1.5 rounded-xl ${bgClass} text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all cursor-pointer`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kamar</span>
                      </button>
                    )}
                  </div>
                </div>

                {sortedRooms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                    <Home className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Belum Ada Kamar di {selectedKompleks.nama}</p>
                    <p className="text-[10px] text-slate-400">Klik tombol "Tambah Kamar" untuk menambahkan kamar baru pada kompleks ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedRooms.map(kam => {
                      const members = getMembersOfRoom(kam.nama);
                      const capacity = kam.kapasitas || 15;
                      const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((members.length / capacity) * 100)) : 0;

                      let statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (occupancyPercent >= 100) statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      else if (occupancyPercent >= 80) statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

                      return (
                        <div
                          key={kam.id}
                          className="group rounded-2xl border border-slate-200 bg-white p-4 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-extrabold text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                                  {kam.nama}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Ketua: {kam.ketuaKamar || '-'}</span>
                                </p>
                              </div>

                              <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${statusBadgeColor} shrink-0`}>
                                {members.length} / {capacity} Bed
                              </span>
                            </div>

                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                                <span>Kapasitas</span>
                                <span>{occupancyPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${occupancyPercent >= 100 ? 'bg-rose-500' : occupancyPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-300`}
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                setActiveRoomForDetail(kam);
                                setCurrentPage(1);
                                setStudentSearchQuery('');
                                setSelectedStudentIds([]);
                                setIsSelectionMode(false);
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Lihat Santri</span>
                            </button>

                            {canWriteCurrent && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditKamar(kam)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Edit Kamar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => askConfirmation(
                                    'Hapus Kamar',
                                    `Apakah Anda yakin ingin menghapus kamar "${kam.nama}"? Santri di dalamnya akan dikeluarkan dari penugasan kamar.`,
                                    () => {
                                      members.forEach(m => onUpdateSantriRoom(m.id, ''));
                                      onDeleteKamar(kam.id);
                                    }
                                  )}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus Kamar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* LEVEL 2 VIEW: DETAIL ANGGOTA KAMAR & SANTRI TABLE (SAMAPERSIS DENGAN DETAIL KELAS DI PENDIDIKAN FORMAL) */
          <motion.div
            key="kamar-detail-students-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveRoomForDetail(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Kamar</span>
                </button>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  {selectedKompleks?.nama}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <Home className="w-3.5 h-3.5 text-purple-600" />
                  {activeRoomForDetail.nama}
                </span>
              </div>

              {/* Action Buttons for Room */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={exportRoomsToExcel}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak / Ekspor</span>
                </button>

                {/* Auto Numbering Closets Dropdown */}
                {canWriteCurrent && (
                  <div className="relative">
                    <button
                      onClick={() => setIsAutoNumberingDropdownOpen(!isAutoNumberingDropdownOpen)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Hash className="w-3.5 h-3.5 text-purple-600" />
                      <span>Atur No. Lemari</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {isAutoNumberingDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsAutoNumberingDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-30 text-xs font-medium">
                          <button
                            onClick={() => handleAutoNumbering('sequential')}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-2"
                          >
                            <span>Urutkan No. Lemari (1, 2, 3...)</span>
                          </button>
                          <button
                            onClick={() => handleAutoNumbering('random')}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-2"
                          >
                            <span>Acak No. Lemari</span>
                          </button>
                          <button
                            onClick={() => handleAutoNumbering('reset')}
                            className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 border-t border-slate-100"
                          >
                            <span>Reset Semua No. Lemari</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {canWriteCurrent && (
                  <button
                    onClick={handleOpenAddMemberModal}
                    className={`px-3.5 py-1.5 rounded-xl ${bgClass} text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all cursor-pointer`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Santri</span>
                  </button>
                )}
              </div>
            </div>

            {/* Room Banner Statistics Card */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-sm">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{activeRoomForDetail.nama}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ketua Kamar: <span className="font-bold text-slate-800">{activeRoomForDetail.ketuaKamar || 'Belum Ditentukan'}</span> • Kapasitas: <span className="font-bold text-slate-800">{activeRoomForDetail.kapasitas || 15} Bed</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-purple-100/80 shadow-3xs self-start md:self-auto min-w-[220px]">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Keterisian Bed</span>
                    <span className="text-purple-700">{currentRoomMembers.length} / {activeRoomForDetail.kapasitas || 15}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[220px]">
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
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="py-1.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none cursor-pointer"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Muqim">Muqim</option>
                      <option value="Kampung">Kampung</option>
                    </select>
                  </div>

                  {/* Mode Seleksi Toggle */}
                  <button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      if (isSelectionMode) setSelectedStudentIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelectionMode 
                        ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-3xs' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isSelectionMode ? 'Selesai Seleksi' : 'Pilih Banyak'}</span>
                  </button>
                </div>

                {/* Counter Label */}
                <div className="text-[11px] font-extrabold text-slate-500 self-end md:self-auto">
                  Menampilkan <span className="text-purple-600">{filteredStudents.length}</span> Santri
                </div>
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
                      {renderSortableHeader('NIS', 'nis', 'py-3 px-3.5 w-28')}
                      {renderSortableHeader('Nama Santri', 'nama', 'py-3 px-3.5 min-w-[200px] relative')}
                      {renderSortableHeader('No. Lemari', 'nomorLemari', 'py-3 px-3.5 w-28 text-center')}
                      {renderSortableHeader('Status Mukim', 'statusKeanggotaan', 'py-3 px-3.5 w-32 text-center')}
                      <th className="py-3 px-3.5 w-48">Alamat / Asal</th>
                      <th className="py-3 px-3.5 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 8 : 7} className="py-12 text-center text-slate-400 font-medium">
                          Belum ada santri terdaftar di kamar ini.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s, idx) => {
                        const isChecked = selectedStudentIds.includes(s.id);
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
                            <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                              {startIndex + idx + 1}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-slate-600 font-bold text-[11px]">
                              {s.nis || '-'}
                            </td>
                            <td className="py-3 px-3.5">
                              <div 
                                onClick={() => setSelectedSantriForDetail(s)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                              >
                                {renderSantriAvatar(s, "w-8 h-8 rounded-full border border-slate-200 text-xs font-bold")}
                                <div>
                                  <p className="font-extrabold text-slate-800 group-hover:text-purple-600 transition-colors">
                                    {s.nama}
                                  </p>
                                  <p className="text-[9.5px] text-slate-400">{s.desa ? `Ds. ${s.desa}` : (s.asal || '-')}</p>
                                </div>
                              </div>
                            </td>
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
                                  {s.nomorLemari || 'Set No.'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (s.statusKeanggotaan || 'Muqim').toLowerCase() === 'kampung'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {s.statusKeanggotaan || 'Muqim'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                              {s.desa ? `Ds. ${s.desa}, Kec. ${s.kecamatan || '-'}` : (s.alamat || s.asal || '-')}
                            </td>
                            <td className="py-3 px-3.5 text-center relative">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedSantriForDetail(s)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="Detail Santri"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {canWriteCurrent && (
                                  <div className="relative">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (activeStudentDropdownId === s.id) setActiveStudentDropdownId(null);
                                        else setActiveStudentDropdownId(s.id);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {activeStudentDropdownId === s.id && (
                                      <>
                                        <div className="fixed inset-0 z-20" onClick={() => setActiveStudentDropdownId(null)} />
                                        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-100 bg-white shadow-lg py-1.5 z-30 text-left text-xs font-medium">
                                          <button
                                            onClick={() => {
                                              setActiveStudentDropdownId(null);
                                              setSingleTransferStudent(s);
                                              setSingleDestKompleksId(selectedKompleksId);
                                              setSingleDestRoomId(activeRoomForDetail.id);
                                              setSingleNomorLemari(s.nomorLemari || '');
                                            }}
                                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                          >
                                            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Pindah Kamar</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setActiveStudentDropdownId(null);
                                              askConfirmation(
                                                'Keluarkan Santri',
                                                `Apakah Anda yakin ingin mengeluarkan santri "${s.nama}" dari kamar ini?`,
                                                () => {
                                                  onUpdateSantriRoom(s.id, '');
                                                  showToast(`Santri "${s.nama}" dikeluarkan dari kamar.`);
                                                }
                                              );
                                            }}
                                            className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100"
                                          >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            <span>Keluarkan</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
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

              {/* Scroll Right Floating Navigation Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollTable('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 transition-all cursor-pointer"
                  title="Gulir Kanan"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Kompleks</label>
                  <input
                    type="text"
                    placeholder="Contoh: KMP-01"
                    value={komKode}
                    onChange={e => setKomKode(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori Gender</label>
                  <input
                    type="text"
                    value={selectedGender}
                    disabled
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed"
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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ketua Kamar</label>
                  <input
                    type="text"
                    placeholder="Nama Ketua Kamar..."
                    value={kamKetua}
                    onChange={e => setKamKetua(e.target.value)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    Tambah Anggota ke {activeRoomForDetail.nama}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Pilih santri yang belum memiliki kamar atau ingin dipindahkan ke kamar ini.
                  </p>
                </div>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama santri, NIS..."
                    value={addMemberSearch}
                    onChange={e => setAddMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <select
                  value={addMemberRoomFilter}
                  onChange={e => setAddMemberRoomFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                >
                  <option value="BelumKamar">Belum Memiliki Kamar</option>
                  <option value="Semua">Semua Santri ({selectedGender})</option>
                </select>
              </div>

              {/* Santri List Selector */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl p-2 divide-y divide-slate-100 min-h-[250px]">
                {eligibleStudentsForAdd.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400">
                    Tidak ada santri yang cocok dengan kriteria pencarian.
                  </div>
                ) : (
                  eligibleStudentsForAdd.map(s => {
                    const isChecked = selectedModalStudentIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (isChecked) setSelectedModalStudentIds(selectedModalStudentIds.filter(id => id !== s.id));
                          else setSelectedModalStudentIds([...selectedModalStudentIds, s.id]);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                          isChecked ? 'bg-purple-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          {renderSantriAvatar(s, "w-8 h-8 rounded-full border border-slate-200 text-xs font-bold")}
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">{s.nama}</p>
                            <p className="text-[10px] text-slate-400">NIS: {s.nis || '-'} • Kamar Saat Ini: {s.kamar || 'Belum Ada'}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {s.statusKeanggotaan || 'Muqim'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
                <span className="text-xs font-extrabold text-purple-700">
                  {selectedModalStudentIds.length} Santri Terpilih
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    disabled={selectedModalStudentIds.length === 0}
                    onClick={handleConfirmAddMembers}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${bgClass} shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Tambahkan Santri
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
                      .map(r => (
                        <option key={r.id} value={r.id}>{r.nama} (Kapasitas: {r.kapasitas || 15})</option>
                      ))}
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

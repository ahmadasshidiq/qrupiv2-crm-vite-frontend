import { Activity, BookOpen, Building2, CalendarCheck2, GraduationCap, LayoutDashboard, ListChecks, ShieldCheck, UserCog, UsersRound } from 'lucide-react'
import type { NavigationItem, SearchSuggestion } from './types'

export const MAIN_NAVIGATION: NavigationItem[] = [
  { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Pengguna',
    href: '/users?category=staff',
    icon: UsersRound,
    children: [
      { label: 'Guru & Admin', href: '/users?category=staff', icon: UserCog },
      { label: 'Siswa', href: '/users?category=student', icon: GraduationCap },
    ],
  },
  { label: 'Institusi', href: '/institutions', icon: Building2, roles: ['owner', 'super_admin', 'admin', 'dinas', 'dinas_pendidikan'] },
  { label: 'Grup belajar', href: '/learning-groups', icon: GraduationCap },
  { label: 'Materi belajar', href: '/learning-resources', icon: BookOpen },
]

export const INSIGHT_NAVIGATION: NavigationItem[] = [
  { label: 'Absensi', href: '/attendances', icon: CalendarCheck2 },
  { label: 'Aktivitas', href: '/activities', icon: Activity },
  { label: 'Kuis', href: '/quizzes', icon: ListChecks },
  { label: 'Role & izin', href: '/roles', icon: ShieldCheck, roles: ['owner', 'super_admin', 'admin'] },
]

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { label: 'Laporan absensi', description: 'Lihat rekap kehadiran dan keterlambatan', category: 'Laporan', href: '/attendances', keywords: ['absen', 'absensi', 'hadir', 'kehadiran', 'terlambat'], icon: CalendarCheck2, tone: 'blue' },
  { label: 'Guru & admin', description: 'Cari dan kelola guru, admin, dan staf', category: 'Pengguna', href: '/users?category=staff', keywords: ['user', 'pengguna', 'guru', 'teacher', 'admin', 'staf'], icon: UserCog, tone: 'violet' },
  { label: 'Data siswa', description: 'Cari dan kelola seluruh siswa', category: 'Pengguna', href: '/users?category=student', keywords: ['user', 'pengguna', 'siswa', 'student', 'murid', 'buat siswa'], icon: GraduationCap, tone: 'blue' },
  { label: 'Materi pembelajaran', description: 'Kelola sumber belajar dan materi kelas', category: 'Pembelajaran', href: '/learning-resources', keywords: ['materi', 'modul', 'resource', 'bahan ajar'], icon: BookOpen, tone: 'emerald' },
  { label: 'Kuis pembelajaran', description: 'Kelola kuis dan soal untuk siswa', category: 'Pembelajaran', href: '/quizzes', keywords: ['kuis', 'quiz', 'soal', 'ujian'], icon: ListChecks, tone: 'orange' },
  { label: 'Aktivitas siswa', description: 'Buka catatan aktivitas dan poin', category: 'Aktivitas', href: '/activities', keywords: ['aktivitas', 'poin', 'pelanggaran'], icon: Activity, tone: 'blue' },
]

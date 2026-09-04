import { Activity, BookOpen, Building2, CalendarCheck2, ClipboardList, GraduationCap, ListChecks, ShieldCheck, Tags, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppModule = { title: string; singular: string; description: string; href: string; icon: LucideIcon; roles?: string[] }
const ADMIN_ROLES = ['owner', 'super_admin', 'admin', 'dinas', 'dinas_pendidikan']
const SCHOOL_ROLES = [...ADMIN_ROLES, 'teacher', 'guru', 'staff']

export const APP_MODULES: AppModule[] = [
  { title: 'Pengguna', singular: 'pengguna', description: 'Kelola guru, admin, staf, dan siswa.', href: '/users', icon: UsersRound, roles: SCHOOL_ROLES },
  { title: 'Institusi', singular: 'institusi', description: 'Kelola sekolah dan institusi dalam ekosistem Qrupi.', href: '/institutions', icon: Building2, roles: ADMIN_ROLES },
  { title: 'Role & izin', singular: 'role', description: 'Atur role dan permission pengguna CRM.', href: '/roles', icon: ShieldCheck, roles: ADMIN_ROLES },
  { title: 'Grup belajar', singular: 'grup belajar', description: 'Kelola kelas dan kelompok pembelajaran.', href: '/learning-groups', icon: GraduationCap, roles: SCHOOL_ROLES },
  { title: 'Anggota grup', singular: 'anggota grup', description: 'Kelola anggota pada setiap grup belajar.', href: '/learning-group-members', icon: UsersRound, roles: SCHOOL_ROLES },
  { title: 'Materi belajar', singular: 'materi', description: 'Kelola materi dan sumber pembelajaran.', href: '/learning-resources', icon: BookOpen, roles: SCHOOL_ROLES },
  { title: 'Kuis', singular: 'kuis', description: 'Kelola soal dan kuis pembelajaran.', href: '/quizzes', icon: ListChecks, roles: SCHOOL_ROLES },
  { title: 'Sesi kuis', singular: 'sesi kuis', description: 'Pantau pelaksanaan dan hasil sesi kuis.', href: '/quiz-sessions', icon: ClipboardList, roles: SCHOOL_ROLES },
  { title: 'Absensi', singular: 'absensi', description: 'Pantau check-in, check-out, dan status kehadiran.', href: '/attendances', icon: CalendarCheck2, roles: SCHOOL_ROLES },
  { title: 'Alasan ketidakhadiran', singular: 'alasan', description: 'Kelola pilihan alasan izin dan ketidakhadiran.', href: '/absence-reasons', icon: CalendarCheck2, roles: SCHOOL_ROLES },
  { title: 'Aktivitas', singular: 'aktivitas', description: 'Pantau aktivitas positif dan pelanggaran siswa.', href: '/activities', icon: Activity, roles: SCHOOL_ROLES },
  { title: 'Kategori aktivitas', singular: 'kategori aktivitas', description: 'Kelola kategori aktivitas siswa.', href: '/activity-categories', icon: Tags, roles: SCHOOL_ROLES },
  { title: 'Jenis aktivitas', singular: 'jenis aktivitas', description: 'Atur jenis aktivitas, poin, dan batas periode.', href: '/activity-items', icon: ClipboardList, roles: SCHOOL_ROLES },
]

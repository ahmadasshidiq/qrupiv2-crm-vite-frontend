/* eslint-disable react-refresh/only-export-components */
import { forwardRef } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeiconsProps, IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon,
  Activity03Icon,
  Add01Icon,
  AddCircleIcon,
  Alert02Icon,
  Analytics01Icon,
  Archive02Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  Award01Icon,
  Award02Icon,
  Book02Icon,
  Building03Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartAverageIcon,
  ChartColumnIcon,
  ChartLineData01Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  DashboardSquare01Icon,
  Delete02Icon,
  Download04Icon,
  File01Icon,
  FileDownloadIcon,
  FileUploadIcon,
  FilterHorizontalIcon,
  HelpCircleIcon,
  Image01Icon,
  ImageAdd01Icon,
  ImageNotFound01Icon,
  InformationCircleIcon,
  Layers01Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  Link04Icon,
  LinkSquare02Icon,
  Loading03Icon,
  Location01Icon,
  Login03Icon,
  Logout03Icon,
  Megaphone01Icon,
  Moon02Icon,
  Mortarboard01Icon,
  Notification01Icon,
  PencilEdit02Icon,
  PrinterIcon,
  QrCodeIcon,
  RankingIcon,
  RotateLeft01Icon,
  School01Icon,
  Search01Icon,
  SecurityCheckIcon,
  Shield02Icon,
  SparklesIcon,
  Sun03Icon,
  Tag01Icon,
  Task01Icon,
  TextAlignCenterIcon,
  TextAlignJustifyCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBoldIcon,
  TextClearIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  Tick02Icon,
  TickDouble02Icon,
  Upload04Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserSettings01Icon,
  Video01Icon,
  ViewIcon,
  ViewOffIcon,
  Xls01Icon,
} from "@hugeicons/core-free-icons";

export type AppIconProps = Omit<HugeiconsProps, "icon" | "ref">;
export type AppIcon = ForwardRefExoticComponent<
  AppIconProps & RefAttributes<SVGSVGElement>
>;

function createIcon(icon: IconSvgElement, displayName: string): AppIcon {
  const Icon = forwardRef<SVGSVGElement, AppIconProps>((props, ref) => (
    <HugeiconsIcon ref={ref} icon={icon} strokeWidth={2} {...props} />
  ));
  Icon.displayName = displayName;
  return Icon;
}

export const Activity = createIcon(Activity01Icon, "Activity");
export const AlertTriangle = createIcon(Alert02Icon, "AlertTriangle");
export const TriangleAlert = AlertTriangle;
export const ArrowLeft = createIcon(ArrowLeft02Icon, "ArrowLeft");
export const ArrowRight = createIcon(ArrowRight02Icon, "ArrowRight");
export const Bell = createIcon(Notification01Icon, "Bell");
export const Building2 = createIcon(Building03Icon, "Building2");
export const CalendarCheck = createIcon(CalendarCheckIn01Icon, "CalendarCheck");
export const CalendarCheck2 = CalendarCheck;
export const CalendarDays = createIcon(Calendar03Icon, "CalendarDays");
export const ChartSpline = createIcon(ChartLineData01Icon, "ChartSpline");
export const Check = createIcon(Tick02Icon, "Check");
export const CheckCheck = createIcon(TickDouble02Icon, "CheckCheck");
export const CheckCircle2 = createIcon(CheckmarkCircle02Icon, "CheckCircle2");
export const ChevronDown = createIcon(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = createIcon(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = createIcon(ArrowRight01Icon, "ChevronRight");
export const CircleHelp = createIcon(HelpCircleIcon, "CircleHelp");
export const CirclePlus = createIcon(AddCircleIcon, "CirclePlus");
export const ClipboardList = createIcon(Task01Icon, "ClipboardList");
export const ListChecks = ClipboardList;
export const Download = createIcon(Download04Icon, "Download");
export const ExternalLink = createIcon(LinkSquare02Icon, "ExternalLink");
export const FileBarChart = createIcon(Analytics01Icon, "FileBarChart");
export const FileText = createIcon(File01Icon, "FileText");
export const FileUp = createIcon(FileUploadIcon, "FileUp");
export const GraduationCap = createIcon(Mortarboard01Icon, "GraduationCap");
export const ImageOff = createIcon(ImageNotFound01Icon, "ImageOff");
export const Layers3 = createIcon(Layers01Icon, "Layers3");
export const Loader2 = createIcon(Loading03Icon, "Loader2");
export const LoaderCircle = Loader2;
export const LogIn = createIcon(Login03Icon, "LogIn");
export const LogOut = createIcon(Logout03Icon, "LogOut");
export const MapPin = createIcon(Location01Icon, "MapPin");
export const Moon = createIcon(Moon02Icon, "Moon");
export const Plus = createIcon(Add01Icon, "Plus");
export const Podium = createIcon(RankingIcon, "Podium");
export const Printer = createIcon(PrinterIcon, "Printer");
export const QrCode = createIcon(QrCodeIcon, "QrCode");
export const RotateCcw = createIcon(RotateLeft01Icon, "RotateCcw");
export const Search = createIcon(Search01Icon, "Search");
export const ShieldCheck = createIcon(SecurityCheckIcon, "ShieldCheck");
export const Sun = createIcon(Sun03Icon, "Sun");
export const Tags = createIcon(Tag01Icon, "Tags");
export const Trash2 = createIcon(Delete02Icon, "Trash2");
export const Trophy = createIcon(Award01Icon, "Trophy");
export const Upload = createIcon(Upload04Icon, "Upload");
export const UserRoundPlus = createIcon(UserAdd01Icon, "UserRoundPlus");
export const Users = createIcon(UserGroupIcon, "Users");
export const UsersRound = Users;
export const X = createIcon(Cancel01Icon, "X");
export const XCircle = createIcon(CancelCircleIcon, "XCircle");
export const AlignCenter = createIcon(TextAlignCenterIcon, "AlignCenter");
export const AlignJustify = createIcon(TextAlignJustifyCenterIcon, "AlignJustify");
export const AlignLeft = createIcon(TextAlignLeftIcon, "AlignLeft");
export const AlignRight = createIcon(TextAlignRightIcon, "AlignRight");
export const Archive = createIcon(Archive02Icon, "Archive");
export const Award = createIcon(Award02Icon, "Award");
export const BarChart3 = createIcon(ChartColumnIcon, "BarChart3");
export const Bold = createIcon(TextBoldIcon, "Bold");
export const BookOpen = createIcon(Book02Icon, "BookOpen");
export const ChartNoAxesCombined = createIcon(ChartAverageIcon, "ChartNoAxesCombined");
export const CircleCheck = createIcon(CheckmarkCircle02Icon, "CircleCheck");
export const Eye = createIcon(ViewIcon, "Eye");
export const EyeOff = createIcon(ViewOffIcon, "EyeOff");
export const FileDown = createIcon(FileDownloadIcon, "FileDown");
export const FileSpreadsheet = createIcon(Xls01Icon, "FileSpreadsheet");
export const Funnel = createIcon(FilterHorizontalIcon, "Funnel");
export const Image = createIcon(Image01Icon, "Image");
export const ImagePlus = createIcon(ImageAdd01Icon, "ImagePlus");
export const Info = createIcon(InformationCircleIcon, "Info");
export const Italic = createIcon(TextItalicIcon, "Italic");
export const LayoutDashboard = createIcon(DashboardSquare01Icon, "LayoutDashboard");
export const Link = createIcon(Link01Icon, "Link");
export const Link2 = createIcon(Link04Icon, "Link2");
export const List = createIcon(LeftToRightListBulletIcon, "List");
export const ListOrdered = createIcon(LeftToRightListNumberIcon, "ListOrdered");
export const Megaphone = createIcon(Megaphone01Icon, "Megaphone");
export const PlusCircle = createIcon(AddCircleIcon, "PlusCircle");
export const RemoveFormatting = createIcon(TextClearIcon, "RemoveFormatting");
export const School = createIcon(School01Icon, "School");
export const ShieldAlert = createIcon(Shield02Icon, "ShieldAlert");
export const SquareActivity = createIcon(Activity03Icon, "SquareActivity");
export const SquarePen = createIcon(PencilEdit02Icon, "SquarePen");
export const Stars = createIcon(SparklesIcon, "Stars");
export const Underline = createIcon(TextUnderlineIcon, "Underline");
export const UploadCloud = createIcon(CloudUploadIcon, "UploadCloud");
export const UserCog = createIcon(UserSettings01Icon, "UserCog");
export const Video = createIcon(Video01Icon, "Video");

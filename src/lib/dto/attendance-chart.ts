export type AttendanceChartQueryDto = {
  type?: "student" | "teacher";
  start_date?: string;
  end_date?: string;
  learning_group_id?: string;
  user_id?: string;
};

export type AttendanceChartResponseDto = {
  summary: {
    total_records: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: number;
    average_late_minutes: number;
  };
  daily_trend: Array<{
    date: string;
    on_time: number;
    late: number;
    absent: number;
    total: number;
  }>;
  attendance_by_status: Array<{
    status: string;
    label: string;
    total: number;
    percentage: number;
  }>;
  absence_by_reason: Array<{
    absence_reason_id?: string | null;
    absence_reason_name: string;
    total: number;
    percentage: number;
  }>;
  by_learning_group: Array<{
    learning_group_id: string;
    learning_group_name: string;
    total: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: number;
  }>;
  top_attendance: Array<{
    user_id: string;
    user_name: string;
    total: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: number;
  }>;
  lowest_attendance: Array<{
    user_id: string;
    user_name: string;
    total: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: number;
  }>;
};

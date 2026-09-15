export type ActivityChartQueryDto = {
  category_id?: string;
  type?: "positive" | "violation";
  start_date?: string;
  end_date?: string;
  learning_group_id?: string;
};

export type ActivityChartResponseDto = {
  summary: {
    total_activities: number;
    positive_activities: number;
    violation_activities: number;
    total_points: number;
  };
  activities_by_item: Array<{
    activity_item_id: string;
    activity_item_name: string;
    total_activities: number;
    color?: string | null;
  }>;
  activities_by_learning_group: Array<{
    learning_group_id: string;
    learning_group_name: string;
    total_activities: number;
  }>;
  top_students: Array<{
    user_id: string;
    user_name: string;
    total_activities: number;
    total_points: number;
  }>;
  daily_trend: Array<{
    date: string;
    positive_activities: number;
    violation_activities: number;
  }>;
};

export const ACTIVITY_CHART_RESPONSE_EXAMPLE: ActivityChartResponseDto = {
  summary: {
    total_activities: 24,
    positive_activities: 19,
    violation_activities: 5,
    total_points: 42,
  },
  activities_by_item: [
    {
      activity_item_id: "activity-item-id",
      activity_item_name: "Menyelesaikan latihan Matematika",
      total_activities: 12,
      color: "#4CAF50",
    },
  ],
  activities_by_learning_group: [
    {
      learning_group_id: "learning-group-id",
      learning_group_name: "Matematika Dasar",
      total_activities: 12,
    },
  ],
  top_students: [
    {
      user_id: "user-id",
      user_name: "Ahmad",
      total_activities: 8,
      total_points: 16,
    },
  ],
  daily_trend: [
    {
      date: "2026-09-08",
      positive_activities: 3,
      violation_activities: 1,
    },
  ],
};

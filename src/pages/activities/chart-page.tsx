import { useNavigate } from "react-router-dom";
import { ActivityChartMode } from "./components/activity-chart-mode";

export default function ActivityChartPage() {
  const navigate = useNavigate();

  return <ActivityChartMode onBack={() => navigate("/activities")} />;
}

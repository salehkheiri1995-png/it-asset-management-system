import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend);

function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [ticketMonthly, setTicketMonthly] = useState([]);

  useEffect(() => {
    const load = async () => {
      const s = await api.get("/reports/dashboard");
      setStats(s.data);
      const t = await api.get("/reports/tickets/monthly");
      setTicketMonthly(t.data);
    };
    load();
  }, []);

  const pieData =
    stats && {
      labels: ["کل تجهیزات", "تجهیزات تخصیص‌یافته"],
      datasets: [
        {
          data: [stats.total_assets, stats.assigned_assets],
          backgroundColor: ["#f59e0b", "#ef4444"]
        }
      ]
    };

  const barData = {
    labels: ticketMonthly.map(x => x.label),
    datasets: [
      {
        label: "تعداد تیکت‌ها",
        data: ticketMonthly.map(x => x.value),
        backgroundColor: "#3b82f6"
      }
    ]
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between mb-3">
        <h4>داشبورد مدیریتی</h4>
        <div>
          <span className="me-3">کاربر: {user?.full_name || user?.username}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={logout}>
            خروج
          </button>
        </div>
      </div>

      {stats && (
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6>کل تجهیزات</h6>
                <h3 className="text-primary">{stats.total_assets}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6>تجهیزات تخصیص‌یافته</h6>
                <h3 className="text-success">{stats.assigned_assets}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6>تیکت‌های باز</h6>
                <h3 className="text-warning">{stats.open_tickets}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6>بازرسی‌های موعدگذشته</h6>
                <h3 className="text-danger">{stats.overdue_inspections}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="mb-3">نمودار وضعیت تجهیزات</h6>
              {pieData && <Pie data={pieData} />}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="mb-3">تعداد تیکت‌ها به تفکیک ماه</h6>
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

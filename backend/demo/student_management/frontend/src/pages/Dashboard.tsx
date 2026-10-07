import React, { useEffect, useState } from "react";
import axios from "axios";

interface Student {
  id: number;
  student_id: string;
  name: string;
  department: string;
  year: number;
  gpa: number;
}

interface Stats {
  total_students: number;
  total_courses: number;
  average_gpa: number;
  active_enrollments: number;
}

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "student";

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const studentsRes = await axios.get("/api/students");
      setStudents(studentsRes.data.students.slice(0, 5));
      setStats({
        total_students: studentsRes.data.total,
        total_courses: 12,
        average_gpa: 3.4,
        active_enrollments: 89,
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Students", value: stats?.total_students ?? "--", icon: "👨‍🎓", color: "bg-blue-500" },
    { label: "Active Courses", value: stats?.total_courses ?? "--", icon: "📚", color: "bg-green-500" },
    { label: "Average GPA", value: stats?.average_gpa?.toFixed(2) ?? "--", icon: "📊", color: "bg-yellow-500" },
    { label: "Enrollments", value: stats?.active_enrollments ?? "--", icon: "📋", color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Student Management System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, <strong>{username}</strong> ({role})
            </span>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Students Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent Students</h2>
            <a href="/students" className="text-indigo-600 text-sm hover:underline">View All →</a>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Student ID", "Name", "Department", "Year", "GPA"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{s.student_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Year {s.year}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.gpa >= 3.5 ? "bg-green-100 text-green-800" :
                        s.gpa >= 2.5 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {s.gpa.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

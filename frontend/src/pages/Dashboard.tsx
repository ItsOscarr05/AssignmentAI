import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface DashboardStats {
  total_assignments: number;
  pending_submissions: number;
  completed_submissions: number;
  total_students: number;
}

interface RecentAssignment {
  id: string;
  title: string;
  due_date: string;
  submissions_count: number;
  status: "pending" | "submitted" | "graded";
}

interface ActivityItem {
  id: string;
  type: "submission" | "feedback" | "assignment";
  title: string;
  description: string;
  timestamp: string;
}

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  const { data: recentAssignments } = useQuery<RecentAssignment[]>({
    queryKey: ["recent-assignments"],
    queryFn: async () => {
      const response = await api.get("/dashboard/recent-assignments");
      return response.data;
    },
  });

  const { data: activities } = useQuery<ActivityItem[]>({
    queryKey: ["activities"],
    queryFn: async () => {
      const response = await api.get("/dashboard/activities");
      return response.data;
    },
  });

  const stats_cards = [
    {
      name: "Total Assignments",
      value: stats?.total_assignments || 0,
      icon: AcademicCapIcon,
      color: "bg-blue-500",
    },
    {
      name: "Pending Submissions",
      value: stats?.pending_submissions || 0,
      icon: ClipboardDocumentListIcon,
      color: "bg-yellow-500",
    },
    {
      name: "Completed Submissions",
      value: stats?.completed_submissions || 0,
      icon: ClockIcon,
      color: "bg-green-500",
    },
    {
      name: "Total Students",
      value: stats?.total_students || 0,
      icon: UserGroupIcon,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button asChild>
          <Link to="/assignments/new">Create Assignment</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_cards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {card.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Assignments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Recent Assignments
            </h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentAssignments?.map((assignment) => (
                  <li key={assignment.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {assignment.title}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          Due{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {assignment.submissions_count} submissions
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            assignment.status === "graded"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "submitted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Recent Activity
            </h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {activities?.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

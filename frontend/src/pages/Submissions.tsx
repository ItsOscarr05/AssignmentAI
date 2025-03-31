import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Submission {
  id: string;
  assignment_title: string;
  subject: string;
  grade_level: string;
  submitted_at: string;
  status: "pending" | "completed";
  ai_response?: string;
}

type SortField = "submitted_at" | "assignment_title";
type SortDirection = "asc" | "desc";

export default function Submissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [sortField, setSortField] = useState<SortField>("submitted_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      const response = await api.get("/submissions");
      return response.data;
    },
  });

  const generateAIResponse = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/submissions/${id}/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });

  const filteredSubmissions = submissions
    ?.filter((submission) => {
      const matchesSearch =
        submission.assignment_title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        submission.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || submission.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortField === "submitted_at") {
        return (
          direction *
          (new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime())
        );
      }
      return direction * a.assignment_title.localeCompare(b.assignment_title);
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            My Submissions
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your AI-assisted assignments
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button onClick={() => (window.location.href = "/assignments/new")}>
            New Submission
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search assignments or students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      <button
                        onClick={() => handleSort("assignment_title")}
                        className="group inline-flex"
                      >
                        Assignment
                        {sortField === "assignment_title" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpIcon className="ml-2 h-5 w-5" />
                          ) : (
                            <ArrowDownIcon className="ml-2 h-5 w-5" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <button
                        onClick={() => handleSort("student_name")}
                        className="group inline-flex"
                      >
                        Student
                        {sortField === "student_name" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpIcon className="ml-2 h-5 w-5" />
                          ) : (
                            <ArrowDownIcon className="ml-2 h-5 w-5" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      <button
                        onClick={() => handleSort("submitted_at")}
                        className="group inline-flex"
                      >
                        Submitted
                        {sortField === "submitted_at" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpIcon className="ml-2 h-5 w-5" />
                          ) : (
                            <ArrowDownIcon className="ml-2 h-5 w-5" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Score
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredSubmissions?.map((submission) => (
                    <tr key={submission.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {submission.assignment_title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {submission.student_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            submission.status === "graded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {submission.score ? `${submission.score}%` : "-"}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {submission.status === "pending" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement grading modal
                            }}
                          >
                            Grade
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  assignment_type: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_time: number;
  additional_requirements?: string;
  content: string;
  created_at: string;
}

interface Submission {
  id: string;
  student_name: string;
  submitted_at: string;
  status: "pending" | "graded";
  score?: number;
  feedback?: string;
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: ["assignment", id],
    queryFn: async () => {
      const response = await api.get(`/assignments/${id}`);
      return response.data;
    },
  });

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery<
    Submission[]
  >({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const response = await api.get(`/assignments/${id}/submissions`);
      return response.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: Assignment["status"]) => {
      const response = await api.patch(`/assignments/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async () => {
      await api.delete(`/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      navigate("/assignments");
    },
  });

  const duplicateAssignment = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/assignments/${id}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  if (isLoading || isLoadingSubmissions) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (!assignment) {
    return (
      <div className="p-4 text-center text-gray-500">Assignment not found</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/assignments")}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          <div className="flex-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/assignments/${id}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => duplicateAssignment.mutate()}
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => deleteAssignment.mutate()}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {assignment.title}
        </h1>
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span>{assignment.subject}</span>
          <span>•</span>
          <span>{assignment.grade_level}</span>
          <span>•</span>
          <span>{assignment.assignment_type}</span>
          <span>•</span>
          <span>{assignment.estimated_time} minutes</span>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Topic</h2>
            <p className="text-gray-700">{assignment.topic}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Difficulty Level
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                assignment.difficulty === "easy"
                  ? "bg-green-100 text-green-800"
                  : assignment.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {assignment.difficulty}
            </span>
          </div>

          {assignment.additional_requirements && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Additional Requirements
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {assignment.additional_requirements}
              </p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Assignment Content
            </h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {assignment.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

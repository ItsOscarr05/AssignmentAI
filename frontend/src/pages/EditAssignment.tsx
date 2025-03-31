import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  grade_level: z.string().min(1, "Grade level is required"),
  assignment_type: z.string().min(1, "Assignment type is required"),
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time: z.string().min(1, "Estimated time is required"),
  additional_requirements: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", id],
    queryFn: async () => {
      const response = await api.get(`/assignments/${id}`);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: assignment?.title || "",
      subject: assignment?.subject || "",
      grade_level: assignment?.grade_level || "",
      assignment_type: assignment?.assignment_type || "",
      topic: assignment?.topic || "",
      difficulty: assignment?.difficulty || "medium",
      estimated_time: assignment?.estimated_time?.toString() || "",
      additional_requirements: assignment?.additional_requirements || "",
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.put(`/assignments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      navigate("/assignments");
    },
  });

  const onSubmit = (data: FormData) => {
    updateAssignment.mutate(data);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  if (!assignment) {
    return (
      <div className="p-4 text-center text-gray-500">Assignment not found</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Assignment
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Modify your assignment details and regenerate the content if needed
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <Input
            id="title"
            type="text"
            {...register("title")}
            className="mt-1"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Subject
          </label>
          <select
            id="subject"
            {...register("subject")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select a subject</option>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            <option value="history">History</option>
            <option value="computer_science">Computer Science</option>
          </select>
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="grade_level"
            className="block text-sm font-medium text-gray-700"
          >
            Grade Level
          </label>
          <select
            id="grade_level"
            {...register("grade_level")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select grade level</option>
            <option value="elementary">Elementary</option>
            <option value="middle_school">Middle School</option>
            <option value="high_school">High School</option>
            <option value="college">College</option>
            <option value="university">University</option>
          </select>
          {errors.grade_level && (
            <p className="mt-1 text-sm text-red-600">
              {errors.grade_level.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="assignment_type"
            className="block text-sm font-medium text-gray-700"
          >
            Assignment Type
          </label>
          <select
            id="assignment_type"
            {...register("assignment_type")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select type</option>
            <option value="essay">Essay</option>
            <option value="problem_set">Problem Set</option>
            <option value="project">Project</option>
            <option value="quiz">Quiz</option>
            <option value="research_paper">Research Paper</option>
          </select>
          {errors.assignment_type && (
            <p className="mt-1 text-sm text-red-600">
              {errors.assignment_type.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700"
          >
            Topic
          </label>
          <Input
            id="topic"
            type="text"
            {...register("topic")}
            className="mt-1"
          />
          {errors.topic && (
            <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-gray-700"
          >
            Difficulty Level
          </label>
          <select
            id="difficulty"
            {...register("difficulty")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {errors.difficulty && (
            <p className="mt-1 text-sm text-red-600">
              {errors.difficulty.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="estimated_time"
            className="block text-sm font-medium text-gray-700"
          >
            Estimated Time (minutes)
          </label>
          <Input
            id="estimated_time"
            type="number"
            min="1"
            {...register("estimated_time")}
            className="mt-1"
          />
          {errors.estimated_time && (
            <p className="mt-1 text-sm text-red-600">
              {errors.estimated_time.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="additional_requirements"
            className="block text-sm font-medium text-gray-700"
          >
            Additional Requirements (Optional)
          </label>
          <textarea
            id="additional_requirements"
            rows={4}
            {...register("additional_requirements")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.additional_requirements && (
            <p className="mt-1 text-sm text-red-600">
              {errors.additional_requirements.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/assignments")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

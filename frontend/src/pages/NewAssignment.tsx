import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  due_date: z.string().min(1, "Due date is required"),
  points: z.number().min(0, "Points must be 0 or greater"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time: z.number().min(1, "Estimated time must be at least 1 minute"),
});

type AssignmentForm = z.infer<typeof assignmentSchema>;

export default function NewAssignment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      points: 0,
      difficulty: "medium",
      estimated_time: 30,
    },
  });

  const createAssignment = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      const response = await api.post("/assignments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      navigate("/assignments");
    },
  });

  const onSubmit = (data: AssignmentForm) => {
    createAssignment.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Assignment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to create a new assignment.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Title"
          error={errors.title?.message}
          {...register("title")}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
              errors.description ? "border-red-300" : ""
            }`}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Due Date"
            type="date"
            error={errors.due_date?.message}
            {...register("due_date")}
          />

          <Input
            label="Points"
            type="number"
            error={errors.points?.message}
            {...register("points", { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              {...register("difficulty")}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                errors.difficulty ? "border-red-300" : ""
              }`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {errors.difficulty && (
              <p className="mt-2 text-sm text-red-600">
                {errors.difficulty.message}
              </p>
            )}
          </div>

          <Input
            label="Estimated Time (minutes)"
            type="number"
            error={errors.estimated_time?.message}
            {...register("estimated_time", { valueAsNumber: true })}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/assignments")}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Assignment
          </Button>
        </div>
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const submissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  grade_level: z.string().min(1, "Grade level is required"),
  description: z.string().min(1, "Description is required"),
  file: z.any().refine((file) => file !== null, "File is required"),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function NewSubmission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  const createSubmission = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("subject", data.subject);
      formData.append("grade_level", data.grade_level);
      formData.append("description", data.description);
      formData.append("file", data.file[0]);

      const response = await api.post("/submissions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      navigate("/submissions");
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            New Submission
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Upload your assignment for AI assistance
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => createSubmission.mutate(data))}
        className="mt-8 space-y-6"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Assignment Title
            </label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              error={errors.title?.message}
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register("subject")}
            >
              <option value="">Select a subject</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English</option>
              <option value="history">History</option>
              <option value="computer_science">Computer Science</option>
              <option value="other">Other</option>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register("grade_level")}
            >
              <option value="">Select grade level</option>
              <option value="elementary">Elementary</option>
              <option value="middle_school">Middle School</option>
              <option value="high_school">High School</option>
              <option value="college">College</option>
              <option value="university">University</option>
              <option value="graduate">Graduate</option>
            </select>
            {errors.grade_level && (
              <p className="mt-1 text-sm text-red-600">
                {errors.grade_level.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Assignment Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700"
            >
              Assignment File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="file"
                accept=".pdf,.doc,.docx,.txt"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
                {...register("file")}
              />
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/submissions")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload Assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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

export default function AssignmentGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      difficulty: "medium",
    },
  });

  const generateAssignment = useMutation({
    mutationFn: async (data: FormData) => {
      setIsGenerating(true);
      try {
        const response = await api.post("/assignments/generate", data);
        setGeneratedContent(response.data.content);
        return response.data;
      } finally {
        setIsGenerating(false);
      }
    },
  });

  const saveAssignment = useMutation({
    mutationFn: async (data: FormData & { content: string }) => {
      const response = await api.post("/assignments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      navigate("/assignments");
    },
  });

  const onSubmit = async (data: FormData) => {
    if (generatedContent) {
      saveAssignment.mutate({ ...data, content: generatedContent });
    } else {
      generateAssignment.mutate(data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Generate Assignment</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new assignment using AI. Fill in the details below and click Generate to create your assignment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
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
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Generate Assignment
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Create an AI-generated assignment for your students
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div>
          <form
            onSubmit={handleSubmit((data) => generateAssignment.mutate(data))}
            className="space-y-6"
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
                  htmlFor="assignment_type"
                  className="block text-sm font-medium text-gray-700"
                >
                  Assignment Type
                </label>
                <select
                  id="assignment_type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  {...register("assignment_type")}
                >
                  <option value="">Select type</option>
                  <option value="essay">Essay</option>
                  <option value="problem_set">Problem Set</option>
                  <option value="project">Project</option>
                  <option value="quiz">Quiz</option>
                  <option value="research">Research</option>
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
                  error={errors.topic?.message}
                />
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  {...register("difficulty")}
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
                  {...register("estimated_time", { valueAsNumber: true })}
                  error={errors.estimated_time?.message}
                />
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
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  {...register("additional_requirements")}
                />
                {errors.additional_requirements && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.additional_requirements.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Assignment"}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:pl-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Generated Assignment
            </h3>
            {generatedContent ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{generatedContent}</div>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      saveAssignment.mutate({
                        ...generatorSchema.parse({}),
                        content: generatedContent,
                      })
                    }
                  >
                    Save Assignment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>
                  Fill out the form and click "Generate Assignment" to create
                  your assignment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

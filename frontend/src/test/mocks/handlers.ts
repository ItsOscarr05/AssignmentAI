import { rest } from "msw";
import { mockAssignments, mockSubmissions, mockUsers } from "./data";

export const handlers = [
  // Auth endpoints
  rest.post("/api/auth/login", (req, res, ctx) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res(
        ctx.status(401),
        ctx.json({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  }),

  rest.post("/api/auth/register", (req, res, ctx) => {
    const userData = req.body as any;

    if (mockUsers.some((u) => u.email === userData.email)) {
      return res(
        ctx.status(400),
        ctx.json({
          code: "VALIDATION_ERROR",
          message: "Email already exists",
        })
      );
    }

    const newUser = {
      id: String(mockUsers.length + 1),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    return res(
      ctx.status(201),
      ctx.json({
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      })
    );
  }),

  // User endpoints
  rest.get("/api/users/:id", (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find((u) => u.id === id);

    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          code: "NOT_FOUND",
          message: "User not found",
        })
      );
    }

    return res(ctx.status(200), ctx.json(user));
  }),

  rest.put("/api/users/:id", (req, res, ctx) => {
    const { id } = req.params;
    const userData = req.body as any;
    const userIndex = mockUsers.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          code: "NOT_FOUND",
          message: "User not found",
        })
      );
    }

    const updatedUser = {
      ...mockUsers[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    mockUsers[userIndex] = updatedUser;

    return res(ctx.status(200), ctx.json(updatedUser));
  }),

  // Assignment endpoints
  rest.get("/api/assignments", (req, res, ctx) => {
    const page = Number(req.url.searchParams.get("page")) || 1;
    const pageSize = Number(req.url.searchParams.get("pageSize")) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return res(
      ctx.status(200),
      ctx.json({
        items: mockAssignments.slice(start, end),
        total: mockAssignments.length,
        page,
        pageSize,
        totalPages: Math.ceil(mockAssignments.length / pageSize),
      })
    );
  }),

  rest.get("/api/assignments/:id", (req, res, ctx) => {
    const { id } = req.params;
    const assignment = mockAssignments.find((a) => a.id === id);

    if (!assignment) {
      return res(
        ctx.status(404),
        ctx.json({
          code: "NOT_FOUND",
          message: "Assignment not found",
        })
      );
    }

    return res(ctx.status(200), ctx.json(assignment));
  }),

  rest.post("/api/assignments", (req, res, ctx) => {
    const assignmentData = req.body as any;
    const newAssignment = {
      id: String(mockAssignments.length + 1),
      ...assignmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
    };

    mockAssignments.push(newAssignment);

    return res(ctx.status(201), ctx.json(newAssignment));
  }),

  rest.put("/api/assignments/:id", (req, res, ctx) => {
    const { id } = req.params;
    const assignmentData = req.body as any;
    const assignmentIndex = mockAssignments.findIndex((a) => a.id === id);

    if (assignmentIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          code: "NOT_FOUND",
          message: "Assignment not found",
        })
      );
    }

    const updatedAssignment = {
      ...mockAssignments[assignmentIndex],
      ...assignmentData,
      updatedAt: new Date().toISOString(),
    };

    mockAssignments[assignmentIndex] = updatedAssignment;

    return res(ctx.status(200), ctx.json(updatedAssignment));
  }),

  // Submission endpoints
  rest.get("/api/submissions", (req, res, ctx) => {
    const page = Number(req.url.searchParams.get("page")) || 1;
    const pageSize = Number(req.url.searchParams.get("pageSize")) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return res(
      ctx.status(200),
      ctx.json({
        items: mockSubmissions.slice(start, end),
        total: mockSubmissions.length,
        page,
        pageSize,
        totalPages: Math.ceil(mockSubmissions.length / pageSize),
      })
    );
  }),

  rest.post("/api/submissions/:id/analyze", (req, res, ctx) => {
    const { id } = req.params;
    const submission = mockSubmissions.find((s) => s.id === id);

    if (!submission) {
      return res(
        ctx.status(404),
        ctx.json({
          code: "NOT_FOUND",
          message: "Submission not found",
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        score: 85,
        strengths: ["Good understanding of concepts", "Clear explanations"],
        areasForImprovement: [
          "Could use more examples",
          "Formatting could be better",
        ],
        suggestions: [
          "Add more real-world examples",
          "Improve document structure",
        ],
        detailedAnalysis:
          "The submission demonstrates a solid understanding of the topic...",
      })
    );
  }),
];

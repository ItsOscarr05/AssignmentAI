import { rest } from "msw";

const API_URL = process.env.REACT_APP_API_URL;

export const handlers = [
  // Mock login
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;

    if (email === "test@example.com" && password === "password") {
      return res(
        ctx.status(200),
        ctx.json({
          token: "fake-jwt-token",
          user: {
            id: 1,
            email: "test@example.com",
            full_name: "Test User",
          },
        })
      );
    }

    return res(ctx.status(401), ctx.json({ message: "Invalid credentials" }));
  }),

  // Mock assignments list
  rest.get(`${API_URL}/assignments`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          subject: "Math",
          grade_level: "10",
          assignment_text: "Solve quadratic equations",
          due_date: "2024-03-20",
          completed: false,
        },
        {
          id: 2,
          subject: "English",
          grade_level: "10",
          assignment_text: "Write an essay",
          due_date: "2024-03-21",
          completed: true,
        },
      ])
    );
  }),

  // Mock assignment creation
  rest.post(`${API_URL}/assignments`, async (req, res, ctx) => {
    const assignment = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: Math.floor(Math.random() * 1000),
        ...assignment,
      })
    );
  }),

  // Mock assignment update
  rest.put(`${API_URL}/assignments/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(id),
        ...updates,
      })
    );
  }),

  // Mock assignment deletion
  rest.delete(`${API_URL}/assignments/:id`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Mock assignment stats
  rest.get(`${API_URL}/assignments/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total: 10,
        completed: 5,
      })
    );
  }),
];

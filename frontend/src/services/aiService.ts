import axios from "axios";
import {
  AssignmentGenerationRequest,
  AssignmentGenerationResponse,
} from "../types/ai";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

export const aiService = {
  generateAssignment: async (
    request: AssignmentGenerationRequest
  ): Promise<AssignmentGenerationResponse> => {
    try {
      const response = await axios.post(`${API_URL}/ai/generate`, request, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.detail || "Failed to generate assignment",
        };
      }
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  },
};

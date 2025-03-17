import { vi } from "vitest";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const useRouter = () => router;
export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const redirect = vi.fn();
export const notFound = vi.fn();

// Reset all mocks after each test
afterEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.back.mockReset();
  router.forward.mockReset();
  router.refresh.mockReset();
  router.prefetch.mockReset();
  redirect.mockReset();
  notFound.mockReset();
});

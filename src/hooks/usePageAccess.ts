import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import {
  isPageAccessible,
  getRecommendedLandingPage,
  getAccessiblePages,
  type PageRoute,
} from '@/lib/privileges';

/**
 * Hook to check page accessibility and provide routing utilities
 * @param currentPath - The current page path to check
 * @returns Object with accessibility checks and routing functions
 */
export const usePageAccess = (currentPath?: string) => {
  const router = useRouter();
  const { session, isAuthenticated } = useAuth();
  const pathname = currentPath || window.location.pathname;

  // Check if current page is accessible
  const isCurrentPageAccessible = isPageAccessible(session?.privileges || null, pathname);

  // Get recommended landing page
  const recommendedPage = getRecommendedLandingPage(session?.privileges || null);

  // Get all accessible pages
  const accessiblePages = getAccessiblePages(session?.privileges || null);

  // Navigate to recommended page
  const navigateToRecommended = () => {
    if (recommendedPage && recommendedPage.path !== pathname) {
      router.push(recommendedPage.path);
    }
  };

  // Navigate to specific page if accessible
  const navigateToPage = (path: string) => {
    if (isPageAccessible(session?.privileges || null, path)) {
      router.push(path);
    } else {
      console.warn(`Page ${path} is not accessible to current user`);
      navigateToRecommended();
    }
  };

  // Check if user has any page access
  const hasAnyPageAccess = accessiblePages.length > 0;

  return {
    // State
    isAuthenticated,
    isCurrentPageAccessible,
    hasAnyPageAccess,
    recommendedPage,
    accessiblePages,

    // Actions
    navigateToRecommended,
    navigateToPage,

    // Utilities
    isPageAccessible: (path: string) => isPageAccessible(session?.privileges || null, path),
  };
};

/**
 * Hook to get accessible pages for navigation
 * @returns Array of accessible page routes
 */
export const useAccessiblePages = (): PageRoute[] => {
  const { session } = useAuth();
  return getAccessiblePages(session?.privileges || null);
};

/**
 * Hook to check if a specific page is accessible
 * @param path - The page path to check
 * @returns boolean indicating if the page is accessible
 */
export const usePageAccessibility = (path: string): boolean => {
  const { session } = useAuth();
  return isPageAccessible(session?.privileges || null, path);
};

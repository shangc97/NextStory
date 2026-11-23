export const MAX_REVIEW_LENGTH = 2000;

export type BookReview = {
  userId: string;
  rating: number;
  content: string;
  updatedAt: number | null;
};

export function validateReview(rating: number | null, content: string): string | null {
  if (rating == null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Choose a rating from 1 to 5.';
  }
  if (!content.trim()) return 'Write a review before posting.';
  if (content.length > MAX_REVIEW_LENGTH) return `Keep your review within ${MAX_REVIEW_LENGTH} characters.`;
  return null;
}

export function averageReviewRating(reviews: readonly BookReview[]): number | null {
  return reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
}

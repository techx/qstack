export const computeNormalizedRating = (
  averageRating: number,
  totalTickets: number
) => {
  if (totalTickets == 0) return 0;
  return ((averageRating * totalTickets) / (totalTickets)).toFixed(3);
};

export const computeNormalizedRating = (
  averageRating: number,
  totalTickets: number
) => {
  return ((averageRating * totalTickets + 6) / (totalTickets + 2)).toFixed(2);
};

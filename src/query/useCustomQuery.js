import { useQuery } from '@tanstack/react-query';
//---

export const useCustomQuery = ({ queryFn, queryKey, ...queryProps }) => {
  return useQuery({
    queryFn,
    queryKey,
    ...queryProps,
  });
};

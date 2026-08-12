import { useMutation } from '@tanstack/react-query';
//---
import { formatBackendErrors } from '../utils';

export const useCustomMutation = ({
  mutationFn,
  mutationKey = null,
  onSuccess,
  onError,
  on422Error,
  ...mutationProps
}) => {
  return useMutation({
    mutationKey: mutationKey,
    mutationFn: mutationFn,
    onError: error => {
      const response = error.response;
      console.log('Top Level Error:', error?.response?.data);

      if (response?.status === 422) {
        const parsedErrors = formatBackendErrors(response.data.errors);
        on422Error?.(parsedErrors);
      }
      onError?.(response);
    },
    onSuccess: (response, reqData) => {
      onSuccess?.(response, reqData);
    },
    ...mutationProps,
  });
};

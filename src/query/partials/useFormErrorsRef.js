import { useRef } from 'react';

export default function useFormErrorsRef() {
  const errorsRef = useRef(null);

  const register = setErrors => {
    errorsRef.current = setErrors;
  };

  const apply = errors => {
    if (errorsRef.current) {
      errorsRef.current(errors);
    }
  };

  const reset = () => {
    errorsRef.current = null;
  };

  return { register, apply, reset };
}

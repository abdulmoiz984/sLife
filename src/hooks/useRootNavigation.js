import { useNavigation } from '@react-navigation/native';

const useRootNavigation = () => {
  const navigation = useNavigation();
  return navigation.getParent?.() ?? navigation;
};

export default useRootNavigation;

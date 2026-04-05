// Mobile-native selection patterns for iOS/Android
// Provides utilities to adapt select/dropdown UIs to native patterns

export const isMobileDevice = () => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const useNativeSelect = () => {
  // On mobile, use system picker for native select
  // On desktop, use custom bottom sheet component
  return isMobileDevice() ? 'native' : 'bottomsheet';
};

export const convertToSelectOptions = (items, labelKey, valueKey) => {
  return items.map(item => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
};
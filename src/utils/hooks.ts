import { store } from 'umi';
import { createUseInject } from 'natur';

export const useInject = createUseInject(() => store)
export const useFlatInject = createUseInject(() => store, { flat: true })

export { useAsyncFunction as useHttp } from 'great-async';
export { useAsyncFunction as useAsyncFn } from 'great-async';

import { configureStore } from '@reduxjs/toolkit';
import rcaReducer from './rcaSlice';

export const store = configureStore({
  reducer: {
    rca: rcaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

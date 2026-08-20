import { Task } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Server: undefined;
};

export type AppStackParamList = {
  TaskList: undefined;
  TaskForm: { taskId?: string } | undefined;
  TaskDetail: { taskId: string };
  Insights: undefined;
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;

export type TaskPreview = Pick<Task, 'id' | 'title'>;

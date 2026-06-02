export type Subject = {
  id: number;
  name: string;
  color: string;
  task_count: number;
  role: "owner" | "editor" | "viewer";
  shared: boolean;
};

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  subject_id: number | null;
  owner_id: number;
};

export type Invite = {
  id: number;
  subject_id: number;
  subject_name: string;
  email: string;
  role: "editor" | "viewer";
  status: string;
  token: string;
  expires_at: string;
};

export type Member = {
  id: number;
  user_id: number;
  email: string;
  name: string;
  role: Subject["role"];
};

export type StudySession = {
  id: number;
  task_id: number;
  title: string;
  planned_for: string | null;
  completed: boolean;
};

export type TaskAttachment = {
  id: number;
  task_id: number;
  filename: string;
  mime_type: string;
  data_url: string;
};

export type UserRead = {
  id: number;
  name: string;
  email: string;
  onboarding_completed: boolean;
};

export type StatusFilter = "all" | "active" | "completed" | "overdue" | "week";

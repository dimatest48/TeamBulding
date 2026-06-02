export type Subject = {
  id: number;
  name: string;
  color: string;
  task_count: number;
  role: "owner" | "editor" | "viewer";
  shared: boolean;
};

export type Priority = "low" | "medium" | "high";

export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "editor" | "viewer";

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  subject_id: number | null;
  owner_id: number;
  // EP-06 sharing context (computed per requesting user)
  role: Role;
  owner_name: string | null;
  shared_with_me: boolean;
  shared: boolean;
};

export type TaskCollaborator = {
  id: number;
  user_id: number;
  email: string;
  name: string;
  role: Role;
};

export type TaskShareLink = {
  id: number;
  task_id: number;
  token: string;
  role: ShareRole;
  revoked: boolean;
  created_at: string;
};

export type TaskInvite = {
  id: number;
  task_id: number;
  task_title: string;
  email: string;
  role: ShareRole;
  status: string;
  token: string;
  invited_by_name: string | null;
};

export type SharePreview = {
  task_id: number;
  title: string;
  owner_name: string;
  role: ShareRole;
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

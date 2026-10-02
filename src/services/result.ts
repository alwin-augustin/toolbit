export interface ServiceResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
}

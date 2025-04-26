export interface ApiResponse<T = undefined> {
  message: string;
  data: T;
}

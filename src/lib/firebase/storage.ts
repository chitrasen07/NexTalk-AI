import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";
import { storage } from "./config";
import { formatBytes } from "@/lib/utils";

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  contentType: string;
  size: number;
}

export interface UploadHandlers {
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
  /** Called with the underlying task so callers can cancel/pause. */
  onTask?: (task: UploadTask) => void;
}

export const FILE_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 25 * 1024 * 1024, // 25 MB
  file: 25 * 1024 * 1024, // 25 MB
  profile: 5 * 1024 * 1024, // 5 MB
} as const;

export const ACCEPTED_MIME = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/webm", "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4"],
  file: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip",
  ],
} as const;

export type UploadKind = keyof typeof FILE_LIMITS;

export function validateFile(
  file: File,
  kind: Exclude<UploadKind, "profile">,
): string | null {
  const limit = FILE_LIMITS[kind];
  if (file.size > limit) {
    return `File is too large. Max size is ${formatBytes(limit)}.`;
  }
  const accepted = ACCEPTED_MIME[kind] as readonly string[];
  if (!accepted.includes(file.type)) {
    return `Unsupported file type: ${file.type || "unknown"}.`;
  }
  return null;
}

export function validateProfileImage(file: File): string | null {
  if (file.size > FILE_LIMITS.profile) {
    return `Image is too large. Max size is ${formatBytes(FILE_LIMITS.profile)}.`;
  }
  if (!(ACCEPTED_MIME.image as readonly string[]).includes(file.type)) {
    return "Please choose a valid image (JPEG, PNG, WEBP or GIF).";
  }
  return null;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Core resumable upload with progress + cancel support. */
export function uploadFile(
  path: string,
  file: File,
  handlers: UploadHandlers = {},
): Promise<UploadResult> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  handlers.onTask?.(task);

  return new Promise<UploadResult>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const percent =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
        handlers.onProgress?.(percent);
      },
      (error) => {
        handlers.onError?.(error);
        reject(error);
      },
      () => {
        void getDownloadURL(task.snapshot.ref)
          .then((url) => {
            resolve({
              url,
              path,
              name: file.name,
              contentType: file.type || "application/octet-stream",
              size: file.size,
            });
          })
          .catch(reject);
      },
    );
  });
}

function uniquePrefix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uploadProfileImage(
  userId: string,
  file: File,
  handlers?: UploadHandlers,
): Promise<UploadResult> {
  const path = `users/${userId}/profile/${uniquePrefix()}-${sanitizeName(file.name)}`;
  return uploadFile(path, file, handlers);
}

export function uploadConversationImage(
  conversationId: string,
  file: File,
  handlers?: UploadHandlers,
): Promise<UploadResult> {
  const path = `conversations/${conversationId}/images/${uniquePrefix()}-${sanitizeName(file.name)}`;
  return uploadFile(path, file, handlers);
}

export function uploadConversationVideo(
  conversationId: string,
  file: File,
  handlers?: UploadHandlers,
): Promise<UploadResult> {
  const path = `conversations/${conversationId}/videos/${uniquePrefix()}-${sanitizeName(file.name)}`;
  return uploadFile(path, file, handlers);
}

export function uploadConversationFile(
  conversationId: string,
  file: File,
  handlers?: UploadHandlers,
): Promise<UploadResult> {
  const path = `conversations/${conversationId}/files/${uniquePrefix()}-${sanitizeName(file.name)}`;
  return uploadFile(path, file, handlers);
}

export function uploadConversationAudio(
  conversationId: string,
  file: File,
  handlers?: UploadHandlers,
): Promise<UploadResult> {
  const path = `conversations/${conversationId}/audio/${uniquePrefix()}-${sanitizeName(file.name)}`;
  return uploadFile(path, file, handlers);
}

export async function deleteStorageObject(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}

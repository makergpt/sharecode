import { File } from "lucide-react";

const isImage = (type, name) =>
  type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name || "");

const isVideo = (type, name) =>
  type?.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)$/i.test(name || "");

const isAudio = (type, name) =>
  type?.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name || "");

const isPdf = (type, name) =>
  type === "application/pdf" || /\.pdf$/i.test(name || "");

export default function FilePreview({ file }) {
  if (!file) return null;

  const name = file.file_name || "";
  const url = file.external_url || file.file_url;
  const isDirect = file.source_type === "direct" || !file.external_url;

  // Cloud-hosted external links can't be reliably previewed inline.
  if (!isDirect) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-gray-900/60 border border-gray-700 rounded-xl p-6 text-center mb-4">
        <File className="w-8 h-8 text-gray-500" />
        <p className="text-gray-400 text-sm">Preview not available for cloud-hosted files</p>
        <p className="text-gray-600 text-xs">Download to open the file in a new tab.</p>
      </div>
    );
  }

  if (isImage(file.file_type, name)) {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
        <img src={url} alt={name} className="w-full max-h-72 object-contain" />
      </div>
    );
  }

  if (isVideo(file.file_type, name)) {
    return (
      <div className="bg-black border border-gray-700 rounded-xl overflow-hidden mb-4">
        <video src={url} controls className="w-full max-h-72" />
      </div>
    );
  }

  if (isAudio(file.file_type, name)) {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 mb-4">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  if (isPdf(file.file_type, name)) {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden mb-4">
        <iframe src={url} title={name} className="w-full h-72" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 bg-gray-900/60 border border-gray-700 rounded-xl p-6 text-center mb-4">
      <File className="w-8 h-8 text-gray-500" />
      <p className="text-gray-400 text-sm">No preview available</p>
      <p className="text-gray-600 text-xs">{file.file_type || "Unknown file type"}</p>
    </div>
  );
}

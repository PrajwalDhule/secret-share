// src/components/Loader.tsx
export default function Loader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
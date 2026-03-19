"use client";
import { useTransition } from "react";

export default function DeleteButton({ id, action, entityName }: { id: string, action: any, entityName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete this ${entityName}? This action cannot be undone.`)) {
      const fd = new FormData();
      fd.append("id", id);
      startTransition(() => {
        action(fd);
      });
    }
  };

  return (
    <button 
      disabled={isPending} 
      onClick={handleDelete} 
      className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-bold text-sm transition disabled:opacity-50 border border-transparent hover:border-red-200"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}

import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface TodoItem {
  id: string | number;
  title?: string;
  name?: string;
  is_complete?: boolean;
  inserted_at?: string;
  [key: string]: unknown;
}

async function TodosList() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <>
      {error && (
        <div className="p-3 mb-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <p className="font-semibold">Notice from Supabase:</p>
          <p className="text-xs mt-1">{error.message}</p>
          <p className="text-xs text-slate-500 mt-2">
            Note: Pastikan tabel <code>todos</code> telah dibuat di Supabase dashboard dan RLS policies mengizinkan pembacaan.
          </p>
        </div>
      )}
      <ul className="space-y-2">
        {todos && todos.length > 0 ? (
          todos.map((todo: TodoItem) => (
            <li
              key={todo.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              {todo.name || todo.title || JSON.stringify(todo)}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-400 italic">No todos found.</li>
        )}
      </ul>
    </>
  );
}

export default function TodosPage() {
  return (
    <div className="min-h-screen p-8 bg-slate-50 font-sans">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Supabase Todos Test Page</h1>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading todos from Supabase...</p>}>
          <TodosList />
        </Suspense>
      </div>
    </div>
  );
}

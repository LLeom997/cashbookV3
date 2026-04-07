import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { ArrowLeftIcon, PlusIcon, CheckIcon, Trash2Icon, ListTodoIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { LoadingScreen } from '../components/LoadingScreen';

export interface Todo {
  id: string;
  name: string;
  is_completed: boolean;
  user_id: string;
  created_at: string;
}

interface TodoViewProps {
  // Navigation handled by react-router-dom
}

export const TodoView: React.FC<TodoViewProps> = ({}) => {
  const { dataTodos: todos, setDataTodos: setTodos, hasHydrated } = useAppStore();
  const navigate = useNavigate();
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(todos.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!hasHydrated) return;
    isMounted.current = true;
    fetchTodos();
    return () => {
      isMounted.current = false;
    };
  }, [hasHydrated]);

  async function fetchTodos() {
    try {
      if (todos.length === 0) setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
        setLoadError("Couldn't load tasks.");
        toast.error('Failed to load tasks');
      } else if (isMounted.current) {
        setTodos(data || []);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('todos')
      .insert([{ name: newTodo, user_id: user.id }]);

    if (error) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add task');
    } else {
      setNewTodo('');
      toast.success('Task added');
      fetchTodos();
    }
  }

  async function toggleTodo(id: string, isCompleted: boolean) {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !isCompleted })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update task');
    } else {
      fetchTodos();
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    } else {
      toast.success('Task deleted');
      fetchTodos();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">My Tasks</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Reminders</p>
            </div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <ListTodoIcon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={addTodo} className="flex gap-3">
              <Input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 h-12 border-slate-200 font-medium"
              />
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Tasks ({todos.filter(t => !t.is_completed).length})</h3>
          </div>

          {loading ? (
            <LoadingScreen
              compact
              title="Loading tasks"
              subtitle="Restoring your reminders and follow-ups."
            />
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-700 font-bold">Tasks unavailable</p>
              <p className="text-sm text-slate-500 mt-1">{loadError}</p>
              <Button onClick={fetchTodos} className="mt-4 bg-blue-600 hover:bg-blue-700">Retry</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <ListTodoIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No tasks yet. Start by adding one above!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <Card className={cn(
                      "border-slate-200 transition-all hover:shadow-md",
                      todo.is_completed && "bg-slate-50/50 opacity-60"
                    )}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <button
                            onClick={() => toggleTodo(todo.id, todo.is_completed)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                              todo.is_completed 
                                ? 'bg-blue-600 border-blue-600' 
                                : 'border-slate-200 hover:border-blue-400'
                            )}
                          >
                            {todo.is_completed && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <span className={cn(
                            "text-base font-bold truncate",
                            todo.is_completed ? 'line-through text-slate-400' : 'text-slate-700'
                          )}>
                            {todo.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

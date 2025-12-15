import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trash2, Plus, Server, Database, Globe } from 'lucide-react';

// Automatically points to Port 5000 on the same machine (Localhost or EC2 IP)
const API_URL = `http://${window.location.hostname}:5000/api/tasks`;

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend. Is it running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask })
      });
      
      if (response.ok) {
        const createdTask = await response.json();
        setTasks([createdTask, ...tasks]); // Add new task to top
        setNewTask('');
      }
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
    }
  };

  const toggleTask = async (id, currentStatus) => {
    // Optimistic UI update
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !currentStatus } : task
    ));

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
    } catch (err) {
      console.error('Error updating task:', err);
      fetchTasks(); // Revert on error
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Architecture Diagram */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">DevOps Task Manager</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>React (Port 80)</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-green-500" />
              <span>Node API (Port 5000)</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" />
              <span>PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Tasks</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Add Task Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTask}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Loading State */}
          {loading && tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">Loading tasks...</div>
          )}

          {/* Empty State */}
          {!loading && tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks yet. Add one to get started!
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <button
                  onClick={() => toggleTask(task.id, task.completed)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                
                <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {task.title}
                </span>
                
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
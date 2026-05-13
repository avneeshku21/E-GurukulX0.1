import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import CategoryCard from '../../components/CategoryCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import toast from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { get, patch, post } from '../../lib/api.js';

const INITIAL_FORM = {
  name: '',
  description: '',
  icon: '📚',
  youtubeQuery: '',
  color: '#4f46e5',
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await get('/admin/categories');
      setCategories(response.data?.data ?? []);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const previewCategory = useMemo(() => ({
    ...(editingCategory ?? {}),
    ...form,
  }), [editingCategory, form]);

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      youtubeQuery: category.youtubeQuery,
      color: category.color,
      isActive: category.isActive,
    });
  };

  const closeModal = () => {
    setEditingCategory(null);
    setCreateOpen(false);
    setForm(INITIAL_FORM);
  };

  const saveEdit = async () => {
    try {
      const response = await patch(`/admin/categories/${editingCategory.id}`, form);
      const updated = response.data?.data;
      setCategories((prev) => prev.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry));
      toast.success('Category updated.');
      closeModal();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to update category.');
    }
  };

  const createCategory = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.youtubeQuery.trim()) {
      toast.error('Complete all required fields.');
      return;
    }
    try {
      const response = await post('/admin/categories', form);
      setCategories((prev) => [...prev, response.data?.data].filter(Boolean));
      toast.success('Category created.');
      closeModal();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to create category.');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Modal isOpen={!!editingCategory || createOpen} onClose={closeModal} title={editingCategory ? 'Edit Category' : 'New Category'} size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Icon</span>
                <input value={form.icon} onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</span>
                <textarea rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">YouTube Query</span>
                <input value={form.youtubeQuery} onChange={(e) => setForm((prev) => ({ ...prev, youtubeQuery: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Color</span>
                <input value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={editingCategory ? saveEdit : createCategory}>{editingCategory ? 'Save Changes' : 'Create Category'}</Button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Preview</p>
            <CategoryCard category={{ ...previewCategory, videoCount: previewCategory.userCount ?? 0 }} />
          </div>
        </div>
      </Modal>

      <section className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manage Categories</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Edit the core eight categories plus any custom categories your team adds.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Category</Button>
      </section>

      <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} variant="rectangular" height={72} />)}</div>
        ) : categories.length === 0 ? (
          <div className="p-6"><EmptyState title="No categories found" description="Create your first category to start organizing content." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Icon</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Query</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3 text-lg">{category.icon}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{category.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{category.description}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{category.youtubeQuery}</td>
                    <td className="px-4 py-3"><span className="inline-flex h-5 w-5 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: category.color }} /></td>
                    <td className="px-4 py-3">{category.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => openEdit(category)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Boxes, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { shopkeeperApi } from '../../api/shopkeeperApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../../components/common/Feedback.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ProductFormModal from './ProductFormModal.jsx';
import { formatCurrency } from '../../utils/format.js';
import { LOW_STOCK_THRESHOLD } from '../../utils/constants.js';

/** Inline stock editor: saves on Enter or blur, only when the value changed. */
function StockEditor({ product, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(String(product.stockQuantity));
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(String(product.stockQuantity)), [product.stockQuantity]);

  const save = async () => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      toast.error('Stock must be a whole number, 0 or more');
      setValue(String(product.stockQuantity));
      return;
    }
    if (next === product.stockQuantity) return;
    setSaving(true);
    try {
      const { data } = await shopkeeperApi.updateStock(product.id, { stockQuantity: next });
      onSaved(data);
      toast.success(`Stock for ${product.name} set to ${next}`);
    } catch (err) {
      toast.error(errorMessage(err));
      setValue(String(product.stockQuantity));
    } finally {
      setSaving(false);
    }
  };

  const low = product.stockQuantity < LOW_STOCK_THRESHOLD;
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={`input h-9 w-20 px-2.5 py-1 text-center font-semibold ${low ? 'border-amber-300 bg-amber-50 text-amber-800' : ''}`}
        aria-label={`Stock for ${product.name}`}
      />
      {saving && <Spinner className="h-4 w-4" />}
    </div>
  );
}

export default function Inventory() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const debouncedQuery = useDebounce(query);

  const categories = useAsync(() => shopkeeperApi.categories(), []);

  useEffect(() => setPage(0), [debouncedQuery, categoryId]);

  const { data, loading, error, reload, setData } = useAsync(
    () =>
      shopkeeperApi.products({
        q: debouncedQuery || undefined,
        categoryId: categoryId || undefined,
        page,
        size: 20,
      }),
    [debouncedQuery, categoryId, page],
  );

  const replaceProduct = (updated) =>
    setData((d) => (d ? { ...d, content: d.content.map((p) => (p.id === updated.id ? updated : p)) } : d));

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleSaved = (saved) => {
    setModalOpen(false);
    if (editing) replaceProduct(saved);
    else reload();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await shopkeeperApi.deleteProduct(deleting.id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Manage your catalogue, prices and stock levels."
        actions={
          <Button icon={Plus} onClick={openNew} disabled={!categories.data}>
            Add product
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button type="button" onClick={() => setCategoryId('')} className={`chip ${categoryId === '' ? 'chip-active' : 'chip-idle'}`}>
            All
          </button>
          {(categories.data || []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(String(c.id))}
              className={`chip ${categoryId === String(c.id) ? 'chip-active' : 'chip-idle'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={query || categoryId ? 'No matching products' : 'Your shelves are empty'}
          description={query || categoryId ? 'Try another search or category.' : 'Add your first product so customers can start ordering.'}
          action={!query && !categoryId && <Button icon={Plus} onClick={openNew}>Add product</Button>}
        />
      ) : (
        <div className={`transition ${loading ? 'opacity-60' : ''}`}>
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SmartImage src={p.imageUrl} alt={p.name} className="h-11 w-11 shrink-0 rounded-lg" iconClassName="h-4 w-4" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
                            {p.name}
                            {!p.available && <EyeOff className="h-3.5 w-3.5 text-slate-400" title="Hidden from customers" />}
                          </p>
                          <p className="text-xs text-slate-500">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.categoryName}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{formatCurrency(p.effectivePrice)}</p>
                      {p.discountPercent > 0 && (
                        <p className="text-xs text-slate-400">
                          <span className="line-through">{formatCurrency(p.price)}</span> · {p.discountPercent}% off
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StockEditor product={p} onSaved={replaceProduct} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {data.content.map((p) => (
              <li key={p.id} className="card p-3">
                <div className="flex gap-3">
                  <SmartImage src={p.imageUrl} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl" iconClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
                      {p.name}
                      {!p.available && <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.unit} · {p.categoryName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(p.effectivePrice)}
                      {p.discountPercent > 0 && <span className="ml-1.5 text-xs font-normal text-slate-400 line-through">{formatCurrency(p.price)}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    Stock <StockEditor product={p} onSaved={replaceProduct} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button variant="danger-soft" size="sm" icon={Trash2} onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        categories={categories.data || []}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        variant="danger"
        title="Delete product?"
        confirmLabel="Delete"
        message={`${deleting?.name} (${deleting?.unit}) will be removed from your catalogue. Past orders keep their item details. To hide it temporarily, edit it and turn off visibility instead.`}
      />
    </>
  );
}

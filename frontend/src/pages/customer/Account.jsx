import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, Mail, MapPin, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react';
import { customerApi } from '../../api/customerApi.js';
import { errorMessage } from '../../api/axiosClient.js';
import useAsync from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { EmptyState, ErrorState, PageHeader } from '../../components/common/Feedback.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import AddressFormModal from '../../components/customer/AddressFormModal.jsx';
import { initials } from '../../utils/format.js';

export default function Account() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const addresses = useAsync(() => customerApi.addresses(), []);
  const [modal, setModal] = useState({ open: false, address: null });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const makeDefault = async (address) => {
    try {
      await customerApi.makeDefaultAddress(address.id);
      addresses.reload();
      toast.success(`${address.label} is now your default address`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await customerApi.deleteAddress(deleting.id);
      setDeleting(null);
      addresses.reload();
      toast.success('Address removed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My account" />

      <section className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest-800 text-lg font-bold text-white">
          {initials(user.fullName)}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-lg font-bold text-slate-900">{user.fullName}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Mail className="h-4 w-4" /> {user.email}
          </p>
          {user.phone && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-4 w-4" /> {user.phone}
            </p>
          )}
        </div>
        <Button variant="danger-soft" icon={LogOut} onClick={handleLogout}>
          Log out
        </Button>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Saved addresses</h2>
        <Button size="sm" icon={Plus} onClick={() => setModal({ open: true, address: null })}>
          Add
        </Button>
      </div>

      {addresses.error && !addresses.data ? (
        <ErrorState message={addresses.error} onRetry={addresses.reload} />
      ) : !addresses.data ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7" />
        </div>
      ) : addresses.data.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add an address to speed up checkout." />
      ) : (
        <ul className="space-y-3">
          {addresses.data.map((a) => (
            <li key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Home className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-slate-900">
                  {a.label}
                  {a.isDefault && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">Default</span>}
                </p>
                <p className="text-slate-600">{a.fullText}</p>
              </div>
              <div className="flex gap-1">
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" icon={Star} onClick={() => makeDefault(a)}>
                    Set default
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, address: a })} aria-label={`Edit ${a.label} address`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(a)} aria-label={`Delete ${a.label} address`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressFormModal
        open={modal.open}
        address={modal.address}
        onClose={() => setModal({ open: false, address: null })}
        onSaved={() => {
          setModal({ open: false, address: null });
          addresses.reload();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        variant="danger"
        title="Remove address?"
        confirmLabel="Remove"
        message={deleting ? `${deleting.label}: ${deleting.fullText}` : ''}
      />
    </div>
  );
}

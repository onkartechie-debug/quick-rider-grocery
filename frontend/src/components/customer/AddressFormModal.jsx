import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { TextInput, Toggle } from '../common/Fields.jsx';
import { customerApi } from '../../api/customerApi.js';
import { errorMessage, fieldErrors } from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { blankToNull } from '../../utils/format.js';

const LABELS = ['Home', 'Work', 'Other'];
const EMPTY = { label: 'Home', line1: '', line2: '', city: '', pincode: '', isDefault: false };

export default function AddressFormModal({ open, onClose, address, onSaved }) {
  const toast = useToast();
  const isEdit = !!address;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      address
        ? {
            label: address.label,
            line1: address.line1,
            line2: address.line2 || '',
            city: address.city,
            pincode: address.pincode,
            isDefault: address.isDefault,
          }
        : EMPTY,
    );
  }, [open, address]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = {};
    if (!form.line1.trim()) clientErrors.line1 = 'House / flat and street are required';
    if (!form.city.trim()) clientErrors.city = 'City is required';
    if (!/^[0-9]{6}$/.test(form.pincode)) clientErrors.pincode = 'Pincode must be 6 digits';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    const payload = {
      label: blankToNull(form.label) || 'Home',
      line1: form.line1.trim(),
      line2: blankToNull(form.line2),
      city: form.city.trim(),
      pincode: form.pincode,
      isDefault: form.isDefault,
    };
    setSaving(true);
    try {
      const { data } = isEdit ? await customerApi.updateAddress(address.id, payload) : await customerApi.createAddress(payload);
      toast.success(isEdit ? 'Address updated' : 'Address saved');
      onSaved(data);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit address' : 'Add delivery address'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="address-form" loading={saving}>
            Save address
          </Button>
        </>
      }
    >
      <form id="address-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex gap-2">
          {LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setForm((f) => ({ ...f, label }))}
              className={`chip ${form.label === label ? 'chip-active' : 'chip-idle'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <TextInput label="Flat / house no., building, street" name="line1" value={form.line1} onChange={update} error={errors.line1} required maxLength={200} />
        <TextInput label="Area, landmark (optional)" name="line2" value={form.line2} onChange={update} error={errors.line2} maxLength={200} />
        <div className="grid grid-cols-2 gap-4">
          <TextInput label="City" name="city" value={form.city} onChange={update} error={errors.city} required maxLength={80} />
          <TextInput label="Pincode" name="pincode" inputMode="numeric" value={form.pincode} onChange={update} error={errors.pincode} required />
        </div>
        <Toggle checked={form.isDefault} onChange={(isDefault) => setForm((f) => ({ ...f, isDefault }))} label="Make this my default address" />
      </form>
    </Modal>
  );
}

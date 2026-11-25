import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectInput, TextArea, TextInput, Toggle } from '../../components/common/Fields.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import { shopkeeperApi } from '../../api/shopkeeperApi.js';
import { errorMessage, fieldErrors } from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { blankToNull, toNumberOrNull } from '../../utils/format.js';

const UNIT_SUGGESTIONS = ['250g', '500g', '1kg', '5kg', '200ml', '500ml', '1L', '1 pack', '1 dozen', '1 pc'];

const EMPTY = {
  categoryId: '',
  name: '',
  description: '',
  unit: '',
  price: '',
  discountedPrice: '',
  stockQuantity: '0',
  imageUrl: '',
  available: true,
};

function fromProduct(p) {
  return {
    categoryId: String(p.categoryId),
    name: p.name,
    description: p.description || '',
    unit: p.unit,
    price: String(p.price),
    discountedPrice: p.discountedPrice != null ? String(p.discountedPrice) : '',
    stockQuantity: String(p.stockQuantity),
    imageUrl: p.imageUrl || '',
    available: p.available,
  };
}

function validate(f) {
  const e = {};
  if (!f.categoryId) e.categoryId = 'Choose a category';
  if (!f.name.trim()) e.name = 'Name is required';
  if (!f.unit.trim()) e.unit = 'Unit is required';
  const price = Number(f.price);
  if (!(price > 0)) e.price = 'Enter a price above 0';
  if (f.discountedPrice !== '') {
    const d = Number(f.discountedPrice);
    if (!(d > 0)) e.discountedPrice = 'Must be above 0';
    else if (price > 0 && d > price) e.discountedPrice = 'Cannot exceed the price';
  }
  const stock = Number(f.stockQuantity);
  if (!Number.isInteger(stock) || stock < 0) e.stockQuantity = 'Whole number, 0 or more';
  if (f.imageUrl && !/^https:\/\/\S+$/.test(f.imageUrl.trim())) e.imageUrl = 'Must be an https:// URL';
  return e;
}

export default function ProductFormModal({ open, onClose, product, categories, onSaved }) {
  const toast = useToast();
  const isEdit = !!product;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : EMPTY);
      setErrors({});
    }
  }, [open, product]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined, discountValid: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    const payload = {
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      description: blankToNull(form.description),
      unit: form.unit.trim(),
      price: toNumberOrNull(form.price),
      discountedPrice: toNumberOrNull(form.discountedPrice),
      stockQuantity: Number(form.stockQuantity),
      imageUrl: blankToNull(form.imageUrl),
      available: form.available,
    };

    setSaving(true);
    try {
      const { data } = isEdit
        ? await shopkeeperApi.updateProduct(product.id, payload)
        : await shopkeeperApi.createProduct(payload);
      toast.success(isEdit ? 'Product updated' : 'Product added to your catalogue');
      onSaved(data);
    } catch (err) {
      const server = fieldErrors(err);
      setErrors(server.discountValid ? { ...server, discountedPrice: server.discountValid } : server);
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      description={isEdit ? product.name : 'List a new grocery item in your shop.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div className="hidden sm:block">
          <SmartImage src={form.imageUrl} alt="Preview" className="aspect-square w-full rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Product name" name="name" value={form.name} onChange={update} error={errors.name} required className="sm:col-span-2" />
          <SelectInput label="Category" name="categoryId" value={form.categoryId} onChange={update} error={errors.categoryId} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
          <div>
            <TextInput label="Unit / weight" name="unit" list="unit-suggestions" placeholder="e.g. 500g, 1L, 1 pack" value={form.unit} onChange={update} error={errors.unit} required />
            <datalist id="unit-suggestions">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
          <TextInput label="MRP (Rs.)" name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} error={errors.price} required />
          <TextInput label="Selling price (Rs.)" name="discountedPrice" type="number" min="0" step="0.01" value={form.discountedPrice} onChange={update} error={errors.discountedPrice} hint="Leave empty if no discount" />
          <TextInput label="Stock quantity" name="stockQuantity" type="number" min="0" step="1" value={form.stockQuantity} onChange={update} error={errors.stockQuantity} required />
          <TextArea label="Description" name="description" value={form.description} onChange={update} error={errors.description} maxLength={500} className="sm:col-span-3" rows={2} />
          <TextInput label="Image URL" name="imageUrl" type="url" placeholder="https://..." value={form.imageUrl} onChange={update} error={errors.imageUrl} className="sm:col-span-3" />
          <div className="sm:col-span-3">
            <Toggle
              checked={form.available}
              onChange={(available) => setForm((f) => ({ ...f, available }))}
              label="Visible to customers"
              description="Turn off to hide this item from your storefront without deleting it."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Store, UserPlus, Users } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import { errorMessage, fieldErrors } from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectInput, TextArea, TextInput } from '../../components/common/Fields.jsx';
import { ErrorState, PageHeader } from '../../components/common/Feedback.jsx';
import { PageLoader } from '../../components/common/Spinner.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import { blankToNull, toNumberOrNull } from '../../utils/format.js';

const EMPTY_SHOP = {
  name: '',
  description: '',
  address: '',
  city: '',
  pincode: '',
  phone: '',
  deliveryRadiusKm: '3',
  openingTime: '08:00',
  closingTime: '22:00',
  imageUrl: '',
  minOrderAmount: '0',
  deliveryFee: '0',
};

const EMPTY_KEEPER = { fullName: '', email: '', phone: '', password: '' };

function shopFromResponse(s) {
  return {
    name: s.name || '',
    description: s.description || '',
    address: s.address || '',
    city: s.city || '',
    pincode: s.pincode || '',
    phone: s.phone || '',
    deliveryRadiusKm: String(s.deliveryRadiusKm ?? ''),
    openingTime: s.openingTime || '08:00',
    closingTime: s.closingTime || '22:00',
    imageUrl: s.imageUrl || '',
    minOrderAmount: String(s.minOrderAmount ?? '0'),
    deliveryFee: String(s.deliveryFee ?? '0'),
  };
}

function shopPayload(f) {
  return {
    name: f.name.trim(),
    description: blankToNull(f.description),
    address: f.address.trim(),
    city: f.city.trim(),
    pincode: f.pincode.trim(),
    phone: blankToNull(f.phone),
    deliveryRadiusKm: toNumberOrNull(f.deliveryRadiusKm),
    openingTime: f.openingTime,
    closingTime: f.closingTime,
    imageUrl: blankToNull(f.imageUrl),
    minOrderAmount: toNumberOrNull(f.minOrderAmount) ?? 0,
    deliveryFee: toNumberOrNull(f.deliveryFee) ?? 0,
  };
}

function validateShop(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Shop name is required';
  if (!f.address.trim()) e.address = 'Address is required';
  if (!f.city.trim()) e.city = 'City is required';
  if (!/^[0-9]{6}$/.test(f.pincode)) e.pincode = 'Pincode must be 6 digits';
  const radius = Number(f.deliveryRadiusKm);
  if (!(radius >= 0.5 && radius <= 50)) e.deliveryRadiusKm = 'Between 0.5 and 50 km';
  if (!f.openingTime) e.openingTime = 'Required';
  if (!f.closingTime) e.closingTime = 'Required';
  if (f.imageUrl && !/^https:\/\/\S+$/.test(f.imageUrl.trim())) e.imageUrl = 'Must be an https:// URL';
  if (Number(f.minOrderAmount) < 0) e.minOrderAmount = 'Cannot be negative';
  if (Number(f.deliveryFee) < 0) e.deliveryFee = 'Cannot be negative';
  return e;
}

function validateKeeper(k) {
  const e = {};
  if (k.fullName.trim().length < 2) e.fullName = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(k.email.trim())) e.email = 'Enter a valid email';
  if (k.phone && !/^[6-9][0-9]{9}$/.test(k.phone)) e.phone = 'Enter a valid 10-digit mobile number';
  if (k.password.length < 8 || !/[A-Za-z]/.test(k.password) || !/\d/.test(k.password))
    e.password = '8+ characters with a letter and a number';
  return e;
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdminShopForm() {
  const { shopId } = useParams();
  const isEdit = !!shopId;
  const navigate = useNavigate();
  const toast = useToast();

  const [shop, setShop] = useState(EMPTY_SHOP);
  const [owner, setOwner] = useState(null);
  const [keeperMode, setKeeperMode] = useState('new');
  const [keeper, setKeeper] = useState(EMPTY_KEEPER);
  const [existingId, setExistingId] = useState('');
  const [available, setAvailable] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    const request = isEdit ? adminApi.getShop(shopId) : adminApi.availableShopkeepers();
    request
      .then(({ data }) => {
        if (!active) return;
        if (isEdit) {
          setShop(shopFromResponse(data));
          setOwner(data.owner);
        } else {
          setAvailable(data);
        }
      })
      .catch((err) => active && setLoadError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isEdit, shopId]);

  const updateShop = (e) => {
    const { name, value } = e.target;
    const cleaned = name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : value;
    setShop((s) => ({ ...s, [name]: cleaned }));
    setErrors((errs) => ({ ...errs, [`shop.${name}`]: undefined }));
  };

  const updateKeeper = (e) => {
    const { name, value } = e.target;
    const cleaned = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setKeeper((k) => ({ ...k, [name]: cleaned }));
    setErrors((errs) => ({ ...errs, [`newShopkeeper.${name}`]: undefined }));
  };

  const prefix = (obj, p) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${p}.${k}`, v]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let clientErrors = prefix(validateShop(shop), 'shop');
    if (!isEdit) {
      if (keeperMode === 'new') clientErrors = { ...clientErrors, ...prefix(validateKeeper(keeper), 'newShopkeeper') };
      else if (!existingId) clientErrors.existingShopkeeperId = 'Select a shopkeeper';
    }
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateShop(shopId, shopPayload(shop));
        toast.success('Shop details updated');
      } else {
        await adminApi.createShop({
          shop: shopPayload(shop),
          existingShopkeeperId: keeperMode === 'existing' ? Number(existingId) : null,
          newShopkeeper:
            keeperMode === 'new'
              ? {
                  fullName: keeper.fullName.trim(),
                  email: keeper.email.trim(),
                  phone: blankToNull(keeper.phone),
                  password: keeper.password,
                }
              : null,
        });
        toast.success(`${shop.name.trim()} is now live on QuickRider`);
      }
      navigate('/admin/shops');
    } catch (err) {
      const serverErrors = fieldErrors(err);
      // On edit the payload is the bare ShopRequest, so map its keys under "shop.".
      setErrors(isEdit ? prefix(serverErrors, 'shop') : serverErrors);
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => navigate(0)} />;

  const err = (key) => errors[`shop.${key}`];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        back={
          <Link to="/admin/shops" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back to shops
          </Link>
        }
        title={isEdit ? 'Edit shop' : 'Onboard a new shop'}
        subtitle={isEdit ? 'Update storefront details shown to customers.' : 'Register a grocery shop and give its owner access.'}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard icon={Store} title="Shop details" description="Name, location and delivery coverage.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Shop name" name="name" value={shop.name} onChange={updateShop} error={err('name')} required className="sm:col-span-2" />
              <TextArea label="Description" name="description" value={shop.description} onChange={updateShop} error={err('description')} className="sm:col-span-2" maxLength={500} placeholder="What makes this shop special?" />
              <TextInput label="Street address" name="address" value={shop.address} onChange={updateShop} error={err('address')} required className="sm:col-span-2" />
              <TextInput label="City" name="city" value={shop.city} onChange={updateShop} error={err('city')} required />
              <TextInput label="Pincode" name="pincode" inputMode="numeric" value={shop.pincode} onChange={updateShop} error={err('pincode')} required />
              <TextInput label="Shop phone" name="phone" type="tel" value={shop.phone} onChange={updateShop} error={err('phone')} />
              <TextInput label="Delivery radius (km)" name="deliveryRadiusKm" type="number" step="0.5" min="0.5" max="50" value={shop.deliveryRadiusKm} onChange={updateShop} error={err('deliveryRadiusKm')} required />
              <TextInput label="Opens at" name="openingTime" type="time" value={shop.openingTime} onChange={updateShop} error={err('openingTime')} required />
              <TextInput label="Closes at" name="closingTime" type="time" value={shop.closingTime} onChange={updateShop} error={err('closingTime')} required hint="Earlier than opening time means open past midnight." />
              <TextInput label="Minimum order (Rs.)" name="minOrderAmount" type="number" min="0" step="1" value={shop.minOrderAmount} onChange={updateShop} error={err('minOrderAmount')} />
              <TextInput label="Delivery fee (Rs.)" name="deliveryFee" type="number" min="0" step="1" value={shop.deliveryFee} onChange={updateShop} error={err('deliveryFee')} />
            </div>
          </SectionCard>

          {isEdit ? (
            owner && (
              <SectionCard icon={Users} title="Shopkeeper" description="The account that manages this shop.">
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-900">{owner.fullName}</p>
                  <p className="text-slate-500">{owner.email}</p>
                  {owner.phone && <p className="text-slate-500">{owner.phone}</p>}
                </div>
              </SectionCard>
            )
          ) : (
            <SectionCard icon={UserPlus} title="Shopkeeper account" description="Who will manage inventory and orders for this shop?">
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {[
                  { value: 'new', label: 'Create new account' },
                  { value: 'existing', label: `Assign existing (${available.length})` },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setKeeperMode(opt.value)}
                    disabled={opt.value === 'existing' && available.length === 0}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      keeperMode === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {keeperMode === 'new' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Full name" name="fullName" value={keeper.fullName} onChange={updateKeeper} error={errors['newShopkeeper.fullName']} required />
                  <TextInput label="Email (login)" name="email" type="email" value={keeper.email} onChange={updateKeeper} error={errors['newShopkeeper.email']} required />
                  <TextInput label="Mobile" name="phone" type="tel" inputMode="numeric" value={keeper.phone} onChange={updateKeeper} error={errors['newShopkeeper.phone']} />
                  <TextInput
                    label="Temporary password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={keeper.password}
                    onChange={updateKeeper}
                    error={errors['newShopkeeper.password']}
                    hint="Share it securely; the shopkeeper should change it after first login."
                    required
                  />
                </div>
              ) : (
                <SelectInput
                  label="Shopkeeper"
                  name="existingShopkeeperId"
                  value={existingId}
                  onChange={(e) => {
                    setExistingId(e.target.value);
                    setErrors((errs) => ({ ...errs, existingShopkeeperId: undefined }));
                  }}
                  error={errors.existingShopkeeperId}
                  required
                >
                  <option value="">Select a shopkeeper without a shop</option>
                  {available.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.fullName} ({k.email})
                    </option>
                  ))}
                </SelectInput>
              )}
              {errors.exactlyOneShopkeeper && <p className="mt-3 text-xs font-medium text-rose-600">{errors.exactlyOneShopkeeper}</p>}
            </SectionCard>
          )}
        </div>

        <aside className="space-y-5">
          <section className="card overflow-hidden">
            <SmartImage src={shop.imageUrl} alt="Shop preview" className="h-44 w-full" iconClassName="h-8 w-8" />
            <div className="p-5">
              <TextInput
                label="Cover image URL"
                name="imageUrl"
                type="url"
                placeholder="https://..."
                value={shop.imageUrl}
                onChange={updateShop}
                error={err('imageUrl')}
                hint="A wide photo of the storefront or aisles."
              />
            </div>
          </section>
          <div className="card sticky top-24 p-5">
            <Button type="submit" size="lg" icon={Save} className="w-full" loading={saving}>
              {isEdit ? 'Save changes' : 'Create shop'}
            </Button>
            <Link to="/admin/shops" className="mt-2 block">
              <Button variant="ghost" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </form>
  );
}

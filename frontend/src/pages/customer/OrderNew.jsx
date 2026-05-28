import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DurationSelector from '../../components/shared/DurationSelector';

const OrderNew = () => {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  // Wizard step state
  const [step, setStep] = useState(1); // 1: Pilih Layanan, 2: Pilih Alamat, 3: Konfirmasi
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Core selection states
  const [selectedItems, setSelectedItems] = useState({}); // { [serviceId]: { service_id, name, pricing_type, rate, qty, subtotal } }
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [notes, setNotes] = useState('');

  // Redesign state variables for single selection and duration
  // Global duration and multiple selection states
  const [globalDuration, setGlobalDuration] = useState('1 Hari');
  const [isSelectedKiloan, setIsSelectedKiloan] = useState(false);
  const [isSelectedShoePutih, setIsSelectedShoePutih] = useState(false);
  const [isSelectedShoeWarna, setIsSelectedShoeWarna] = useState(false);

  // Quantities
  const [kiloanWeight, setKiloanWeight] = useState(1);
  const [shoePutihQty, setShoePutihQty] = useState(1);
  const [shoeWarnaQty, setShoeWarnaQty] = useState(1);

  // Email update states
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Fetch initial services & address data from backend
  useEffect(() => {
    const fetchWizardData = async () => {
      try {
        const [servicesRes, addressRes] = await Promise.all([
          api.get('/services'),
          api.get('/profile/addresses'),
        ]);

        if (servicesRes.data && servicesRes.data.success) {
          setServices(servicesRes.data.data);
        }
        if (addressRes.data && addressRes.data.success) {
          const addrList = addressRes.data.data;
          setAddresses(addrList);
          // Auto select default address
          const defaultAddr = addrList.find((a) => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else if (addrList.length > 0) {
            setSelectedAddressId(addrList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load order wizard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWizardData();
  }, []);

  // Sync profile email
  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
    }
  }, [user]);

  // Pricing & Mapping Logic for Kiloan
  const getKiloanServiceForDuration = (duration) => {
    if (!services.length) return null;
    const kiloanServices = services.filter(s => s.category_id === 1 || s.category?.slug === 'cuci-kiloan');
    
    switch (duration) {
      case '4 Jam':
        return kiloanServices.find(s => s.duration_hours === '4' || s.duration_hours === 4);
      case '8 Jam':
        return kiloanServices.find(s => s.duration_hours === '8' || s.duration_hours === 8);
      case '1 Hari':
        return kiloanServices.find(s => s.duration_hours === '24' || s.duration_hours === 24);
      default:
        return null; // 12 Jam, 2 Hari, 3 Hari are not in the seeded DB
    }
  };

  const getKiloanPrice = (duration) => {
    const service = getKiloanServiceForDuration(duration);
    return service ? parseFloat(service.price_per_kg) : null;
  };

  // Pricing & Mapping Logic for Shoe variants
  // Database has Cuci Sepatu Canvas (ID: 4) at 30,000 for 3 Hari (72h)
  const getBaseShoeService = () => {
    return services.find(s => s.id === 4 || s.slug?.includes('sepatu') || s.name?.toLowerCase().includes('sepatu'));
  };

  const getShoePrice = (variant, duration) => {
    const baseShoe = getBaseShoeService();
    if (!baseShoe) return null;
    const basePrice = parseFloat(baseShoe.price_per_unit) || 30000;

    if (variant === 'putih') {
      switch (duration) {
        case '1 Hari': return basePrice + 20000; // 50000
        case '2 Hari': return basePrice + 10000; // 40000
        case '3 Hari': return basePrice;         // 30000
        default: return null;
      }
    } else if (variant === 'warna') {
      switch (duration) {
        case '1 Hari': return basePrice + 25000; // 55000
        case '2 Hari': return basePrice + 15000; // 45000
        case '3 Hari': return basePrice + 5000;  // 35000
        default: return null;
      }
    }
    return null;
  };

  // Toggle selection for Cuci Kiloan
  const handleSelectKiloan = () => setIsSelectedKiloan(!isSelectedKiloan);
  const handleSelectShoePutih = () => setIsSelectedShoePutih(!isSelectedShoePutih);
  const handleSelectShoeWarna = () => setIsSelectedShoeWarna(!isSelectedShoeWarna);

  // Update Kiloan Weight
  const handleKiloanWeightChange = (val) => {
    const weight = Math.max(0.1, parseFloat(val) || 0.1);
    setKiloanWeight(weight);
  };
  const handleShoePutihQtyChange = (val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    setShoePutihQty(qty);
  };
  const handleShoeWarnaQtyChange = (val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    setShoeWarnaQty(qty);
  };

  // Deselect items if they are not available in the newly selected global duration
  useEffect(() => {
    if (isSelectedKiloan && getKiloanServiceForDuration(globalDuration) === null) {
      setIsSelectedKiloan(false);
    }
    if (isSelectedShoePutih && getShoePrice('putih', globalDuration) === null) {
      setIsSelectedShoePutih(false);
    }
    if (isSelectedShoeWarna && getShoePrice('warna', globalDuration) === null) {
      setIsSelectedShoeWarna(false);
    }
  }, [globalDuration]);

  // Sync all selections into selectedItems
  useEffect(() => {
    const newItems = {};

    if (isSelectedKiloan) {
      const s = getKiloanServiceForDuration(globalDuration);
      const p = getKiloanPrice(globalDuration);
      if (s && p !== null) {
        newItems[s.id] = {
          service_id: s.id,
          name: `Cuci Kiloan - ${globalDuration}`,
          pricing_type: 'by_weight',
          rate: p,
          qty: kiloanWeight,
          subtotal: p * kiloanWeight,
        };
      }
    }

    if (isSelectedShoePutih) {
      const s = getBaseShoeService();
      const p = getShoePrice('putih', globalDuration);
      if (s && p !== null) {
        newItems[`${s.id}-putih`] = {
          service_id: s.id,
          name: `Cuci Sepatu Putih - ${globalDuration}`,
          pricing_type: 'by_unit',
          rate: p,
          qty: shoePutihQty,
          subtotal: p * shoePutihQty,
        };
      }
    }

    if (isSelectedShoeWarna) {
      const s = getBaseShoeService();
      const p = getShoePrice('warna', globalDuration);
      if (s && p !== null) {
        newItems[`${s.id}-warna`] = {
          service_id: s.id,
          name: `Cuci Sepatu Warna - ${globalDuration}`,
          pricing_type: 'by_unit',
          rate: p,
          qty: shoeWarnaQty,
          subtotal: p * shoeWarnaQty,
        };
      }
    }

    setSelectedItems(newItems);
  }, [globalDuration, isSelectedKiloan, kiloanWeight, isSelectedShoePutih, shoePutihQty, isSelectedShoeWarna, shoeWarnaQty, services]);

  const calculateTotal = () => {
    return Object.values(selectedItems).reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Submit email update prior to checkout if empty
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setIsUpdatingEmail(true);
    setEmailError('');

    try {
      const response = await api.patch('/profile', { email: emailInput });
      if (response.data && response.data.success) {
        updateProfile({ email: emailInput });
      } else {
        setEmailError(response.data.message || 'Gagal menyimpan email.');
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Email tidak valid.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle checkout submission to POST /orders
  const handleSubmitOrder = async () => {
    setIsLoading(true);

    const itemsPayload = Object.values(selectedItems).map((item) => {
      const isWeight = item.pricing_type === 'by_weight';
      return {
        service_id: item.service_id,
        weight_kg: isWeight ? item.qty : null,
        quantity: !isWeight ? item.qty : null,
        notes: '',
      };
    });

    // Enforce variant detail in notes to preserve database integrity
    let finalNotes = notes;
    if (isSelectedShoePutih) {
      finalNotes = finalNotes ? `${finalNotes}\n[Varian: Cuci Sepatu Putih (${globalDuration})]` : `Varian: Cuci Sepatu Putih (${globalDuration})`;
    }
    if (isSelectedShoeWarna) {
      finalNotes = finalNotes ? `${finalNotes}\n[Varian: Cuci Sepatu Warna (${globalDuration})]` : `Varian: Cuci Sepatu Warna (${globalDuration})`;
    }

    try {
      const response = await api.post('/orders', {
        address_id: selectedAddressId,
        items: itemsPayload,
        notes: finalNotes,
      });

      if (response.data && response.data.success) {
        navigate(`/orders/${response.data.data.order_number}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat pesanan laundry. Pastikan data lengkap.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan Formulir Pemesanan..." />;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const totalPrice = calculateTotal();
  const activeItemsCount = Object.keys(selectedItems).length;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans animate-fade-in">
      
      {/* Wizard Stepper Indicator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-around items-center gap-4 sm:gap-2">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
            }`}>
              1
            </div>
            <span className={`text-xs font-extrabold ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>
              Pilih Layanan
            </span>
          </div>

          <div className="hidden sm:block h-[2px] flex-1 bg-slate-100 max-w-[80px]"></div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
            }`}>
              2
            </div>
            <span className={`text-xs font-extrabold ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>
              Pilih Alamat
            </span>
          </div>

          <div className="hidden sm:block h-[2px] flex-1 bg-slate-100 max-w-[80px]"></div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 3 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'
            }`}>
              3
            </div>
            <span className={`text-xs font-extrabold ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
              Konfirmasi Order
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHOOSE SERVICES */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-800">Formulir Pemesanan Laundry</h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih durasi pengerjaan, lalu pilih satu atau beberapa layanan sekaligus (cuci kiloan, cuci sepatu, dll).
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                Durasi Pengerjaan:
              </span>
              <DurationSelector
                durations={['4 Jam', '8 Jam', '12 Jam', '1 Hari', '2 Hari', '3 Hari']}
                selectedDuration={globalDuration}
                onSelect={(d) => setGlobalDuration(d)}
                disabled={false}
              />
            </div>
          </div>

          {/* Cards Grid Grid-cols-1 or 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* CARD 1: CUCI KILOAN */}
            <div
              className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-sm ${
                isSelectedKiloan
                  ? 'border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
                  : getKiloanServiceForDuration(globalDuration) === null ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed select-none'
                  : 'border-slate-200/60 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                      isSelectedKiloan ? 'bg-blue-50' : 'bg-slate-50'
                    }`}>
                      🧺
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 tracking-tight leading-snug">
                        Cuci Kiloan
                      </h3>
                      <span className="inline-block mt-1 text-[9px] bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                        Populer
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                  Cuci lipat setrika baju harian praktis ditimbang kiloan. </p>
              </div>

              {/* Dynamic Qty input if selected */}
              {isSelectedKiloan && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Masukkan Berat
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={kiloanWeight}
                      onChange={(e) => handleKiloanWeightChange(e.target.value)}
                      className="w-20 text-right px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs font-semibold"
                    />
                    <span className="text-xs font-bold text-slate-500">kg</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Harga Estimasi</span>
                  <div className="flex items-baseline gap-1">
                    {getKiloanPrice(globalDuration) !== null ? (
                      <>
                        <span className="text-lg font-black text-slate-800">
                          {formatRupiah(getKiloanPrice(globalDuration))}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">/kg</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">Pilih durasi dahulu</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={getKiloanServiceForDuration(globalDuration) === null}
                  onClick={handleSelectKiloan}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all duration-200 ${
                    isSelectedKiloan
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-red-500/5'
                      : 'bg-primary hover:bg-[#1D4ED8] text-white shadow-primary/10'
                  }`}
                >
                  {isSelectedKiloan ? 'Batalkan' : 'Pilih'}
                </button>
              </div>
            </div>

            {/* CARD 2: CUCI SEPATU PUTIH */}
            <div
              className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-sm ${
                isSelectedShoePutih
                  ? 'border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
                  : getKiloanServiceForDuration(globalDuration) === null ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed select-none'
                  : 'border-slate-200/60 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                      isSelectedShoePutih ? 'bg-blue-50' : 'bg-slate-50'
                    }`}>
                      👟
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 tracking-tight leading-snug">
                        Cuci Sepatu Putih
                      </h3>
                      <span className="inline-block mt-1 text-[9px] bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                        Premium Care
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                  Pembersihan mendalam khusus untuk sepatu berwarna putih/terang dengan formula pemutih aman.
                </p>
              </div>

              {/* Qty Input */}
              {isSelectedShoePutih && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Jumlah Sepatu
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={shoePutihQty}
                      onChange={(e) => handleShoePutihQtyChange(e.target.value)}
                      className="w-20 text-right px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs font-semibold"
                    />
                    <span className="text-xs font-bold text-slate-500">pasang</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Harga Estimasi</span>
                  <div className="flex items-baseline gap-1">
                    {getShoePrice('putih', globalDuration) !== null ? (
                      <>
                        <span className="text-lg font-black text-slate-800">
                          {formatRupiah(getShoePrice('putih', globalDuration))}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">/pasang</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">Pilih durasi dahulu</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={getShoePrice('putih', globalDuration) === null}
                  onClick={handleSelectShoePutih}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all duration-200 ${
                    isSelectedShoePutih
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-red-500/5'
                      : 'bg-primary hover:bg-[#1D4ED8] text-white shadow-primary/10'
                  }`}
                >
                  {isSelectedShoePutih ? 'Batalkan' : 'Pilih'}
                </button>
              </div>
            </div>

            {/* CARD 3: CUCI SEPATU WARNA */}
            <div
              className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-sm ${
                isSelectedShoeWarna
                  ? 'border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
                  : getKiloanServiceForDuration(globalDuration) === null ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed select-none'
                  : 'border-slate-200/60 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                      isSelectedShoeWarna ? 'bg-blue-50' : 'bg-slate-50'
                    }`}>
                      🎨
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 tracking-tight leading-snug">
                        Cuci Sepatu Warna
                      </h3>
                      <span className="inline-block mt-1 text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                        Color Protect
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                  Pembersihan khusus sepatu berwarna/multi-color dengan perlindungan agar warna tetap cemerlang.
                </p>
              </div>

              {/* Qty Input */}
              {isSelectedShoeWarna && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Jumlah Sepatu
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={shoeWarnaQty}
                      onChange={(e) => handleShoeWarnaQtyChange(e.target.value)}
                      className="w-20 text-right px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs font-semibold"
                    />
                    <span className="text-xs font-bold text-slate-500">pasang</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Harga Estimasi</span>
                  <div className="flex items-baseline gap-1">
                    {getShoePrice('warna', globalDuration) !== null ? (
                      <>
                        <span className="text-lg font-black text-slate-800">
                          {formatRupiah(getShoePrice('warna', globalDuration))}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">/pasang</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">Pilih durasi dahulu</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={getShoePrice('warna', globalDuration) === null}
                  onClick={handleSelectShoeWarna}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all duration-200 ${
                    isSelectedShoeWarna
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-red-500/5'
                      : 'bg-primary hover:bg-[#1D4ED8] text-white shadow-primary/10'
                  }`}
                >
                  {isSelectedShoeWarna ? 'Batalkan' : 'Pilih'}
                </button>
              </div>
            </div>

          </div>

          {/* Floating Checkout bar at bottom of wizard */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Estimasi Sementara
              </span>
              <span className="text-xl font-black text-slate-800 mt-1 block">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={activeItemsCount === 0}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-white text-xs font-extrabold shadow-sm transition-all duration-200 ${
                activeItemsCount === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-[#1D4ED8] shadow-blue-500/10 hover:scale-102'
              }`}
            >
              Lanjut Pilih Alamat &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE ADDRESS */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">Pilih Alamat Penjemputan</h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih salah satu alamat terdaftar Anda untuk penjemputan pakaian laundry.
              </p>
            </div>
            <Link
              to="/profile"
              className="text-xs font-bold text-primary hover:underline"
            >
              + Tambah Alamat Baru
            </Link>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/60 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xl mx-auto font-bold">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Alamat Belum Terdaftar</h3>
                <p className="text-xs text-slate-500">Anda wajib mendaftarkan minimal 1 alamat penjemputan sebelum membuat order.</p>
              </div>
              <Link
                to="/profile"
                className="inline-block px-4 py-2.5 bg-primary hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Atur Alamat Sekarang
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;

                return (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${
                      isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">[{address.label}]</span>
                        {address.is_default && (
                          <span className="px-2.5 py-0.5 rounded bg-blue-50 text-primary border border-blue-100 text-[9px] font-extrabold">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {address.address}, {address.city}, {address.postal_code}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stepper Navigation Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              &larr; Kembali
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedAddressId}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-colors ${
                !selectedAddressId 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-[#1D4ED8] shadow-blue-500/10'
              }`}
            >
              Lanjut Konfirmasi &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRM ORDER */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-800">Konfirmasi Akhir Pesanan</h2>
            <p className="text-xs text-slate-500 mt-1">
              Periksa rincian cucian dan alamat penjemputan Anda sebelum mengirimkan pesanan.
            </p>
          </div>

          {/* Dynamic Email Check Guard */}
          {!user?.email && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-800">Email Diperlukan</h3>
                  <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                    Sistem mendeteksi alamat email Anda masih kosong. Backend mengharuskan pengisian email untuk kebutuhan notifikasi invoice sebelum pesanan dapat diproses.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row items-center gap-2 max-w-md">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Masukkan alamat email Anda"
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-xs font-semibold text-slate-800"
                />
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                >
                  {isUpdatingEmail ? 'Menyimpan...' : 'Simpan Email'}
                </button>
              </form>
              {emailError && <p className="text-xs text-red-600 font-semibold mt-1">{emailError}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Items Summary list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm md:col-span-2 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-2">
                Item Cucian Anda
              </span>
              <div className="divide-y divide-slate-100">
                {Object.values(selectedItems).map((item) => (
                  <div key={item.service_id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {item.qty} {item.pricing_type === 'by_weight' ? 'kg' : 'pasang'}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-950">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Additional notes area */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pisahkan baju putih, tolong dilipat rapi, jemput sore hari, dll."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Address & Checkout pricing Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Alamat Penjemputan
                  </span>
                  {selectedAddress ? (
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">[{selectedAddress.label}]</p>
                      <p className="text-slate-500 mt-1 leading-relaxed">{selectedAddress.address}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600 font-bold block">Alamat belum dipilih</span>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Total Estimasi Akhir
                  </span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {formatRupiah(totalPrice)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 leading-relaxed font-medium">
                    *Harga final akan dikoreksi dan ditimbang ulang oleh kurir setelah pakaian diambil.
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={!selectedAddressId || !user?.email}
                className={`w-full py-3.5 rounded-xl text-white text-xs font-bold shadow-md transition-all duration-200 text-center ${
                  !selectedAddressId || !user?.email
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-[#1D4ED8] shadow-blue-500/10 hover:scale-[1.02]'
                }`}
              >
                Kirim Pesanan Sekarang
              </button>
            </div>
          </div>

          {/* Stepper Navigation Actions */}
          <div className="flex justify-start">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              &larr; Kembali
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderNew;

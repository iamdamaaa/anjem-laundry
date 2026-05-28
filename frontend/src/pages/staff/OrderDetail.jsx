import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import useAuthStore from '../../stores/authStore';

const STATUS_FLOW = ['received', 'picked_up', 'in_process', 'waiting_delivery', 'completed'];
const STATUS_LABELS = {
  received: 'Pesanan Masuk (Received)',
  picked_up: 'Di-pickup (Picked Up)',
  in_process: 'Sedang Diproses (In Process)',
  waiting_delivery: 'Siap Antar (Waiting Delivery)',
  completed: 'Selesai (Completed)'
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Status transitions
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusError, setStatusError] = useState('');

  // Actual weights form states
  const [actualInputs, setActualInputs] = useState({}); 
  const [isSavingActual, setIsSavingActual] = useState(false);
  const [newItemServiceId, setNewItemServiceId] = useState('');

  // Cash payment upload states
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Dates
  const [completionDate, setCompletionDate] = useState('');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      if (response.data && response.data.success) {
        const orderData = response.data.data;
        setOrder(orderData);
        setPaymentAmount(orderData.total_price_actual ? orderData.total_price_actual : orderData.total_price);
        
        const inputs = {};
        orderData.items?.forEach((item) => {
          inputs[item.id] = {
            id: item.id,
            service_id: item.service_id,
            service_name: item.service_name_snapshot,
            pricing_type: item.pricing_type_snapshot,
            duration_hours: item.duration_hours_snapshot,
            rate: item.pricing_type_snapshot === 'by_weight' ? item.price_per_kg_snapshot : item.price_per_unit_snapshot,
            notes: item.notes || '',
            weight_kg: item.weight_kg,
            quantity: item.quantity,
            weight_actual_kg: item.weight_actual_kg || '',
            quantity_actual: item.quantity_actual || '',
            _isNew: false
          };
        });
        setActualInputs(inputs);
        setCompletionDate(orderData.completion_date || '');
      } else {
        setErrorMsg('Pesanan tidak ditemukan.');
      }
    } catch (err) {
      setErrorMsg('Gagal memuat rincian tugas pesanan.');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      if (response.data?.success) {
        setServices(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch services');
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrderDetail(), fetchServices()]);
      setIsLoading(false);
    };
    initData();
  }, [id]);

  // -- Item Management Logic --
  const handleInputChange = (itemId, field, value) => {
    setActualInputs((prev) => {
      const current = prev[itemId];
      let newRate = current.rate;
      let newName = current.service_name;
      let newPricing = current.pricing_type;
      let newDuration = current.duration_hours;
      
      if (field === 'service_id') {
        const srv = services.find(s => s.id === parseInt(value));
        if (srv) {
          newRate = srv.pricing_type === 'by_weight' ? srv.price_per_kg : srv.price_per_unit;
          newName = srv.name;
          newPricing = srv.pricing_type;
          newDuration = srv.duration_hours;
        }
      }

      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: value,
          rate: newRate,
          service_name: newName,
          pricing_type: newPricing,
          duration_hours: newDuration
        },
      };
    });
  };

  const handleAddNewItem = () => {
    if (!newItemServiceId) return;
    const srv = services.find(s => s.id === parseInt(newItemServiceId));
    if (!srv) return;

    const mockId = 'new_' + Date.now();
    setActualInputs(prev => ({
      ...prev,
      [mockId]: {
        id: mockId,
        service_id: srv.id,
        service_name: srv.name,
        pricing_type: srv.pricing_type,
        duration_hours: srv.duration_hours,
        rate: srv.pricing_type === 'by_weight' ? srv.price_per_kg : srv.price_per_unit,
        notes: '',
        weight_kg: 0,
        quantity: 0,
        weight_actual_kg: '',
        quantity_actual: '',
        _isNew: true
      }
    }));
    setNewItemServiceId('');
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Yakin ingin menghapus item ini dari pesanan?')) return;
    
    const item = actualInputs[itemId];
    if (item._isNew) {
      const newInputs = { ...actualInputs };
      delete newInputs[itemId];
      setActualInputs(newInputs);
    } else {
      // TODO: connect to API -> api.delete(`/admin/orders/${id}/items/${itemId}`)
      const newInputs = { ...actualInputs };
      delete newInputs[itemId];
      setActualInputs(newInputs);
      setStatusSuccess(`[MOCK] Item ID ${itemId} dihapus. Note: Belum ada API backend untuk menghapus item individual.`);
    }
  };

  const handleSaveActual = async (e) => {
    e.preventDefault();
    setIsSavingActual(true);
    setStatusError('');
    setStatusSuccess('');

    const newItems = [];
    const existingItems = [];

    Object.values(actualInputs).forEach(input => {
      if (input._isNew) {
        newItems.push(input);
      } else {
        existingItems.push({
          item_id: parseInt(input.id),
          service_id: parseInt(input.service_id),
          notes: input.notes,
          weight_actual_kg: input.weight_actual_kg ? parseFloat(input.weight_actual_kg) : null,
          quantity_actual: input.quantity_actual ? parseInt(input.quantity_actual) : null,
        });
      }
    });

    try {
      if (newItems.length > 0) {
        console.log('[MOCK] Sending new items to API:', newItems);
        // TODO: connect to API -> api.post(`/admin/orders/${id}/items`, { items: newItems })
      }

      if (existingItems.length > 0) {
        const response = await api.patch(`/admin/orders/${id}/actual`, {
          items: existingItems,
        });
        if (response.data && response.data.success) {
          setStatusSuccess('Timbangan & jumlah aktual berhasil disimpan! (Penambahan/penghapusan item bersifat Mock)');
        }
      }
      
      fetchOrderDetail();
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal menyimpan data aktual.');
    } finally {
      setIsSavingActual(false);
    }
  };

  // Real-time calculations
  const calcSubtotal = (item) => {
    const isWeight = item.pricing_type === 'by_weight';
    const val = isWeight ? item.weight_actual_kg : item.quantity_actual;
    if (!val) return 0;
    return parseFloat(val) * parseFloat(item.rate);
  };

  const estimatedTotal = order?.total_price ? parseFloat(order.total_price) : 0;
  const actualTotal = Object.values(actualInputs).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const diff = actualTotal - estimatedTotal;

  // Filter duration logic
  const actualItemsArray = Object.values(actualInputs);
  const currentDuration = actualItemsArray.length > 0 ? actualItemsArray[0].duration_hours : null;
  const filteredServices = currentDuration 
    ? services.filter(s => s.duration_hours == currentDuration) 
    : services;

  const handleUpdateCompletionDate = async (e) => {
    e.preventDefault();
    if (!completionDate) return;
    setIsUpdatingDate(true);
    try {
      const response = await api.patch(`/admin/orders/${id}/completion-date`, {
        completion_date: completionDate
      });
      if (response.data?.success) {
        setStatusSuccess('Tanggal selesai berhasil diperbarui manual!');
        fetchOrderDetail();
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal memperbarui tanggal selesai.');
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // -- Status Transitions Logic --
  const currentStatusIndex = STATUS_FLOW.indexOf(order?.order_status);
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1];

  const handleStatusAdvance = async () => {
    if (!nextStatus) return;

    if (nextStatus === 'in_process') {
      const missingActual = Object.values(actualInputs).some((item) => {
        return item.pricing_type === 'by_weight' ? !item.weight_actual_kg : !item.quantity_actual;
      });
      if (missingActual) {
        setStatusError('WAJIB menginput & menyimpan data berat/quantity aktual untuk seluruh item terlebih dahulu sebelum memproses status ke IN PROCESS!');
        return;
      }
    }

    if (!window.confirm(`Majukan status pesanan ke: ${STATUS_LABELS[nextStatus]}?`)) return;

    setIsUpdatingStatus(true);
    setStatusError('');
    setStatusSuccess('');

    try {
      const response = await api.patch(`/admin/orders/${id}/status`, {
        status: nextStatus,
        notes: `Diperbarui oleh staf ${user?.name || 'Operasional'}`,
      });
      if (response.data?.success) {
        setStatusSuccess(`Status pesanan ditingkatkan menjadi ${STATUS_LABELS[nextStatus]}!`);
        fetchOrderDetail();
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal mengubah status pesanan.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Payment Logic
  const handleStaffPaymentUpload = async (e) => {
    e.preventDefault();
    setIsUploadingPayment(true);
    setPaymentError('');
    setPaymentSuccess('');

    const formData = new FormData();
    formData.append('method', paymentMethod);
    formData.append('amount', paymentAmount);
    if (proofFile) formData.append('proof_image', proofFile);

    try {
      const response = await api.post(`/admin/orders/${id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.success) {
        setPaymentSuccess('Pembayaran cash berhasil dicatat! Status lunas terverifikasi.');
        setProofFile(null);
        fetchOrderDetail();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Gagal mencatat bukti pembayaran.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin membatalkan pesanan ini? Data pesanan akan disembunyikan (Soft Delete).')) return;
    setIsDeleting(true);
    try {
      const response = await api.delete(`/admin/orders/${id}`);
      if (response.data?.success) {
        alert('Pesanan berhasil dihapus.');
        navigate('/staff/orders');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pesanan.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Membuka Berkas Tugas Pesanan..." />;
  }

  if (errorMsg || !order) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200/60 shadow-sm text-center max-w-md mx-auto space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Terjadi Kendala</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Data gagal dimuat.'}</p>
        <Link to="/staff/orders" className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
          Kembali
        </Link>
      </div>
    );
  }

  const pickupAddr = order.pickup_address_snapshot || {};
  const deliveryAddr = order.delivery_address_snapshot || {};

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="hidden sm:block p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <QRCode value={order.order_number} size={60} level="L" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link to="/staff/orders" className="text-slate-400 hover:text-primary text-sm font-bold">
                &larr; Kembali
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">Tugas #{order.order_number}</h1>
              <span className="px-2.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                {order.order_status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pelanggan: <span className="font-bold text-slate-900">{order.user?.name}</span> ({order.user?.phone})
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleDeleteOrder}
            disabled={isDeleting}
            className={`flex-1 sm:flex-none px-4 py-3 text-xs font-bold text-white rounded-md shadow-md transition-all duration-150 ${
              isDeleting ? 'bg-slate-400' : 'bg-red-600 hover:brightness-110 active:scale-95'
            }`}
          >
            {isDeleting ? 'Membatalkan...' : '🗑️ Batalkan Pesanan'}
          </button>
        </div>
      </div>

      {statusSuccess && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold">✅ {statusSuccess}</div>}
      {statusError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold">⚠️ {statusError}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN (2/3) - Info & Items */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Dates & Scheduling Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Tanggal Penjemputan (Pickup)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                <span className="text-[10px] font-extrabold uppercase text-primary block mb-0.5">
                  Estimasi Selesai (Disimpan di DB)
                </span>
                <p className="text-sm font-black text-blue-900 flex items-center gap-2">
                  <span>📅</span>
                  {order.completion_date ? new Date(order.completion_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateCompletionDate} className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Ubah Tanggal Selesai (Manual Override)
              </label>
              <div className="flex gap-2">
                <input 
                  type="date"
                  required
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary bg-white font-bold"
                />
                <button
                  type="submit"
                  disabled={isUpdatingDate}
                  className="px-4 py-2 bg-primary hover:brightness-110 active:scale-95 text-white text-xs font-bold rounded shadow-sm disabled:bg-slate-300 transition-colors shrink-0"
                >
                  {isUpdatingDate ? '...' : 'Ubah'}
                </button>
              </div>
            </form>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 pb-1.5 block">
                Pickup (Jemput)
              </span>
              <p className="text-xs font-bold text-slate-900">[{pickupAddr.label || 'Rumah'}]</p>
              <p className="text-xs text-slate-500">{pickupAddr.address}, {pickupAddr.city}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 pb-1.5 block">
                Delivery (Antar)
              </span>
              <p className="text-xs font-bold text-slate-900">[{deliveryAddr.label || 'Rumah'}]</p>
              <p className="text-xs text-slate-500">{deliveryAddr.address}, {deliveryAddr.city}</p>
            </div>
          </div>

          {/* ITEM MANAGEMENT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Manajemen Item Pesanan</h2>
              <p className="text-xs text-slate-500">Timbang aktual, ubah/tambah layanan, dan hapus item tidak valid.</p>
            </div>

            <form onSubmit={handleSaveActual}>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 font-bold">Layanan & Catatan</th>
                      <th className="py-2.5 font-bold text-center">Tarif Satuan</th>
                      <th className="py-2.5 font-bold text-center">Estimasi</th>
                      <th className="py-2.5 font-bold text-center w-32">Kuantitas Aktual</th>
                      <th className="py-2.5 font-bold text-right">Subtotal</th>
                      <th className="py-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(actualInputs).map((item) => {
                      const isWeight = item.pricing_type === 'by_weight';
                      const pricingUnit = isWeight ? 'kg' : 'pcs';
                      const estQty = isWeight ? `${item.weight_kg} kg` : `${item.quantity} unit`;
                      const subtotal = calcSubtotal(item);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3 pr-2">
                            <select
                              value={item.service_id}
                              onChange={(e) => handleInputChange(item.id, 'service_id', e.target.value)}
                              className="font-bold text-slate-900 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary w-full mb-1"
                            >
                              <option value={item.service_id}>{item.service_name}</option>
                              {filteredServices.map(s => (
                                s.id !== parseInt(item.service_id) && (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                )
                              ))}
                            </select>
                            <input 
                              type="text"
                              placeholder="Ketik catatan (opsional)..."
                              value={item.notes}
                              onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-[10px] text-slate-600 focus:outline-none focus:border-primary"
                            />
                            {item._isNew && <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Item Baru</span>}
                          </td>
                          <td className="py-3 text-center text-slate-500">
                            Rp {parseFloat(item.rate).toLocaleString('id-ID')} /{pricingUnit}
                          </td>
                          <td className="py-3 text-center text-slate-400 line-through">
                            {item._isNew ? '-' : estQty}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step={isWeight ? '0.1' : '1'}
                                min="0"
                                required
                                value={isWeight ? item.weight_actual_kg : item.quantity_actual}
                                onChange={(e) => handleInputChange(item.id, isWeight ? 'weight_actual_kg' : 'quantity_actual', e.target.value)}
                                className="w-16 text-right px-2 py-1 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{pricingUnit}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-extrabold text-slate-900">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-300 hover:text-red-600 transition-colors p-1"
                              title="Hapus Item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add new item row */}
              <div className="flex items-center gap-2 mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg border-dashed">
                <select
                  value={newItemServiceId}
                  onChange={(e) => setNewItemServiceId(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Pilih Layanan Baru --</option>
                  {filteredServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Rp {s.pricing_type === 'by_weight' ? s.price_per_kg + '/kg' : s.price_per_unit + '/pcs'})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  disabled={!newItemServiceId}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded shadow-sm disabled:bg-slate-300 transition-colors"
                >
                  + Tambah Item
                </button>
              </div>

              {/* Totals Comparison */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-end gap-4">
                <button
                  type="submit"
                  disabled={isSavingActual}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-md shadow-sm transition-colors ${
                    isSavingActual ? 'bg-slate-400' : 'bg-primary hover:brightness-110 active:scale-95'
                  }`}
                >
                  {isSavingActual ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>

                <div className="text-right">
                  <div className="flex justify-end gap-4 text-xs text-slate-500 mb-1">
                    <span>Estimasi Awal:</span>
                    <span className="line-through">Rp {estimatedTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-end gap-4 text-sm font-extrabold text-slate-900 items-center">
                    <span>Total Aktual Baru:</span>
                    <span className="text-lg">Rp {actualTotal.toLocaleString('id-ID')}</span>
                  </div>
                  {diff !== 0 && (
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${diff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {diff > 0 ? '▲ Harga Naik ' : '▼ Harga Turun '} 
                      Rp {Math.abs(diff).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) - Stepper & Payment */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* STEPPER STATUS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">Status Pesanan</h2>
            
            <div className="relative pl-4 space-y-6 my-6">
              <div className="absolute left-6 top-2 bottom-2 w-[2px] bg-slate-100"></div>
              
              {STATUS_FLOW.map((statusKey, idx) => {
                const isPassed = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                
                // Cari data log dari array status_logs jika ada (backend relation order.status_logs)
                const logEntry = order?.status_logs?.find(log => log.status_to === statusKey);
                // Karena kita belum yakin field name-nya (bisa status_logs atau statusLogs)
                // Kita gunakan array map fallback
                const fallbackLogs = order?.status_logs || order?.statusLogs || [];
                const actualLog = fallbackLogs.find(l => l.status_to === statusKey || l.status === statusKey);

                return (
                  <div key={statusKey} className="relative flex gap-4 items-start">
                    <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center z-10 ${
                      isCurrent 
                        ? 'border-primary bg-white ring-4 ring-blue-50' 
                        : isPassed 
                          ? 'border-primary bg-primary' 
                          : 'border-slate-200 bg-white'
                    }`}>
                      {isPassed && !isCurrent && <span className="text-[8px] font-bold text-white">✓</span>}
                    </div>

                    <div className="pl-4">
                      <span className={`text-xs font-bold block ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {STATUS_LABELS[statusKey]}
                      </span>
                      {isPassed && actualLog && (
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-[9px] text-slate-400">
                            {new Date(actualLog.created_at).toLocaleString('id-ID')}
                          </p>
                          {actualLog.actor && (
                            <p className="text-[9px] text-slate-500 font-medium">Oleh: {actualLog.actor.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {nextStatus && (
              <button
                onClick={handleStatusAdvance}
                disabled={isUpdatingStatus}
                className={`w-full py-3 text-xs font-bold text-white rounded-md shadow-md transition-all duration-150 flex justify-center items-center gap-2 ${
                  isUpdatingStatus 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-primary hover:brightness-110 active:scale-95 shadow-primary/10'
                }`}
              >
                {isUpdatingStatus ? 'Memproses...' : `Maju ke: ${STATUS_LABELS[nextStatus]}`}
                {!isUpdatingStatus && <span className="text-[10px]">▶</span>}
              </button>
            )}
            {!nextStatus && (
              <div className="w-full py-3 text-xs font-bold text-primary bg-blue-50 rounded-md text-center border border-blue-100">
                Pesanan Telah Selesai
              </div>
            )}
          </div>

          {/* PAYMENT CARD (Unchanged logic, restyled) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">Status Pembayaran</h2>
            
            <div className="flex justify-between items-center text-xs mb-4">
              <span className="text-slate-500 font-medium">Status Tagihan:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                order.is_paid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-error border-red-100'
              }`}>
                {order.is_paid ? 'LUNAS (VERIFIED)' : 'BELUM BAYAR'}
              </span>
            </div>

            {order.is_paid ? (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center space-y-1">
                <span className="text-xl">💰</span>
                <p className="text-xs font-bold text-emerald-800">Pembayaran Terverifikasi</p>
                <p className="text-[9px] text-emerald-600">Seluruh tagihan telah lunas.</p>
              </div>
            ) : (
              <form onSubmit={handleStaffPaymentUpload} className="space-y-3">
                {paymentSuccess && <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 text-[10px] font-bold">{paymentSuccess}</div>}
                {paymentError && <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700 text-[10px] font-bold">{paymentError}</div>}
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Metode</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary bg-white">
                    <option value="cash">Cash (Tunai)</option>
                    <option value="transfer">Transfer Bank / QRIS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nominal (Rp)</label>
                  <input type="number" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Foto Bukti (Opsional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-100" />
                </div>
                <button type="submit" disabled={isUploadingPayment} className="w-full py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors mt-2">
                  {isUploadingPayment ? 'Menyimpan...' : 'Konfirmasi Cash Lunas'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Status transitions
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusError, setStatusError] = useState('');

  // Actual weights form states
  const [actualInputs, setActualInputs] = useState({}); // { [itemId]: { weight_actual_kg, quantity_actual } }
  const [isSavingActual, setIsSavingActual] = useState(false);

  // Cash payment upload states
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      if (response.data && response.data.success) {
        const orderData = response.data.data;
        setOrder(orderData);
        setPaymentAmount(orderData.total_price_actual ? orderData.total_price_actual : orderData.total_price);
        
        // Populate actual inputs from existing data if available
        const inputs = {};
        orderData.order_items?.forEach((item) => {
          inputs[item.id] = {
            weight_actual_kg: item.weight_actual_kg || '',
            quantity_actual: item.quantity_actual || '',
          };
        });
        setActualInputs(inputs);
      } else {
        setErrorMsg('Pesanan tidak ditemukan.');
      }
    } catch (err) {
      setErrorMsg('Gagal memuat rincian tugas pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Handle saving actual parameters (weight/quantity)
  const handleSaveActual = async (e) => {
    e.preventDefault();
    setIsSavingActual(true);
    setStatusError('');
    setStatusSuccess('');

    const payloadItems = Object.keys(actualInputs).map((itemId) => {
      const input = actualInputs[itemId];
      return {
        id: parseInt(itemId),
        weight_actual_kg: input.weight_actual_kg ? parseFloat(input.weight_actual_kg) : null,
        quantity_actual: input.quantity_actual ? parseInt(input.quantity_actual) : null,
      };
    });

    try {
      const response = await api.patch(`/admin/orders/${id}/actual`, {
        items: payloadItems,
      });

      if (response.data && response.data.success) {
        setStatusSuccess('Timbangan & jumlah aktual berhasil disimpan dan dikoreksi di backend!');
        fetchOrderDetail();
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal menyimpan data timbangan aktual.');
    } finally {
      setIsSavingActual(false);
    }
  };

  // Handle actual input changes locally
  const handleInputChange = (itemId, field, value) => {
    setActualInputs({
      ...actualInputs,
      [itemId]: {
        ...actualInputs[itemId],
        [field]: value,
      },
    });
  };

  // Determine next linear status transition
  const getNextStatusInfo = (currentStatus) => {
    switch (currentStatus) {
      case 'received':
        return { next: 'picked_up', label: 'Tandai Selesai Pick Up (Jemput)' };
      case 'picked_up':
        return { next: 'in_process', label: 'Tandai Mulai Proses Cuci (In Process)' };
      case 'in_process':
        return { next: 'waiting_delivery', label: 'Tandai Siap Antar (Waiting Delivery)' };
      case 'waiting_delivery':
        return { next: 'completed', label: 'Tandai Pesanan Selesai (Completed)' };
      default:
        return null;
    }
  };

  // Perform linear transition update
  const handleStatusTransition = async (nextStatus) => {
    // Backend business constraint: in_process requires actual weights filled!
    if (nextStatus === 'in_process') {
      // Validate that all items have weights/quantities filled out!
      const missingActual = order.order_items?.some((item) => {
        const input = actualInputs[item.id] || {};
        return item.pricing_type_snapshot === 'by_weight' 
          ? !input.weight_actual_kg 
          : !input.quantity_actual;
      });

      if (missingActual) {
        setStatusError('WAJIB menginput & menyimpan data berat/quantity aktual untuk seluruh item terlebih dahulu sebelum memproses status ke IN PROCESS!');
        return;
      }
    }

    if (!window.confirm(`Apakah Anda yakin ingin memajukan status pesanan ke: ${nextStatus.toUpperCase()}?`)) return;

    setIsUpdatingStatus(true);
    setStatusError('');
    setStatusSuccess('');

    try {
      const response = await api.patch(`/admin/orders/${id}/status`, {
        order_status: nextStatus,
        notes: `Diperbarui oleh staf ${user?.name}`,
      });

      if (response.data && response.data.success) {
        setStatusSuccess(`Status pesanan berhasil ditingkatkan menjadi ${nextStatus.toUpperCase()}!`);
        fetchOrderDetail();
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal mengubah status pesanan. Pastikan urutannya benar.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle uploading payment from staff (automatic verification)
  const handleStaffPaymentUpload = async (e) => {
    e.preventDefault();
    setIsUploadingPayment(true);
    setPaymentError('');
    setPaymentSuccess('');

    const formData = new FormData();
    formData.append('method', paymentMethod);
    formData.append('amount', paymentAmount);
    if (proofFile) {
      formData.append('proof_image', proofFile);
    }

    try {
      // Using admin payment endpoint to mark verified automatically
      const response = await api.post(`/admin/orders/${id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        setPaymentSuccess('Pembayaran cash berhasil dicatat! Status lunas terverifikasi otomatis.');
        setProofFile(null);
        fetchOrderDetail();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Gagal mencatat bukti pembayaran kurir.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Membuka Berkas Tugas Pesanan..." />;
  }

  if (errorMsg || !order) {
    return (
      <div className="bg-white p-12 rounded-card border border-slate-200/60 shadow-sm text-center max-w-md mx-auto space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-red-50 text-error flex items-center justify-center text-xl mx-auto font-bold">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-brandText">Terjadi Kendala</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Data tugas gagal dimuat.'}</p>
        <Link
          to="/staff/orders"
          className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-btn transition-colors"
        >
          Kembali ke Tugas
        </Link>
      </div>
    );
  }

  const nextTransition = getNextStatusInfo(order.order_status);
  const pickupAddr = order.pickup_address_snapshot || {};
  const deliveryAddr = order.delivery_address_snapshot || {};

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link to="/staff/orders" className="text-slate-400 hover:text-brandText text-sm font-bold">
              &larr; Kembali
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-brandText">Tugas #{order.order_number}</h1>
            <span className="px-2.5 py-0.5 rounded bg-teal-900 text-white border border-teal-800 text-[10px] font-bold uppercase tracking-wider">
              {order.order_status}
            </span>
          </div>
          <p className="text-xs text-slate-500">Pelanggan: <span className="font-bold text-slate-900">{order.user?.name}</span> ({order.user?.phone})</p>
        </div>

        {/* Dynamic Action Button for Status Transition */}
        {nextTransition && (
          <button
            onClick={() => handleStatusTransition(nextTransition.next)}
            disabled={isUpdatingStatus}
            className={`w-full sm:w-auto px-5 py-3 text-xs font-bold text-white rounded-btn shadow-md transition-smooth ${
              isUpdatingStatus 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-teal-700 hover:bg-teal-600 shadow-teal-700/10'
            }`}
          >
            {isUpdatingStatus ? 'Memproses...' : nextTransition.label}
          </button>
        )}
      </div>

      {/* Error & Success Alerts */}
      {statusSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-card text-success text-xs font-semibold">
          ✅ {statusSuccess}
        </div>
      )}
      {statusError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-card text-error text-xs font-semibold">
          ⚠️ {statusError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Address snap and Weight entry form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Logistics Snapshots cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-50 pb-1.5">
                Alamat Pickup (Jemput)
              </span>
              <p className="text-xs font-bold text-slate-900">[{pickupAddr.label || 'Rumah'}]</p>
              <p className="text-xs text-slate-500 leading-relaxed">{pickupAddr.address}, {pickupAddr.city}</p>
            </div>

            <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-50 pb-1.5">
                Alamat Delivery (Antar)
              </span>
              <p className="text-xs font-bold text-slate-900">[{deliveryAddr.label || 'Rumah'}]</p>
              <p className="text-xs text-slate-500 leading-relaxed">{deliveryAddr.address}, {deliveryAddr.city}</p>
            </div>
          </div>

          {/* Actual Weights entry form */}
          <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-brandText">Timbang & Input Cucian Aktual</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kurir/Staf diwajibkan menimbang aktual cucian di workshop untuk mengoreksi harga estimasi awal.
              </p>
            </div>

            <form onSubmit={handleSaveActual} className="space-y-4">
              <div className="divide-y divide-slate-100">
                {order.order_items?.map((item) => {
                  const pricingUnit = item.pricing_type_snapshot === 'by_weight' ? 'kg' : 'pcs';
                  const isWeight = item.pricing_type_snapshot === 'by_weight';
                  const rate = isWeight ? item.price_per_kg_snapshot : item.price_per_unit_snapshot;

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.service_name_snapshot}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tarif: Rp {parseFloat(rate).toLocaleString('id-ID')} / {pricingUnit} | Estimasi Awal: {isWeight ? `${item.weight_kg} kg` : `${item.quantity} unit`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Aktual Timbang:
                        </span>
                        <input
                          type="number"
                          step={isWeight ? '0.1' : '1'}
                          min="0"
                          required
                          value={actualInputs[item.id]?.[isWeight ? 'weight_actual_kg' : 'quantity_actual'] || ''}
                          onChange={(e) => handleInputChange(
                            item.id,
                            isWeight ? 'weight_actual_kg' : 'quantity_actual',
                            e.target.value
                          )}
                          placeholder={`0 ${pricingUnit}`}
                          className="w-28 text-right px-3 py-1.5 border border-slate-200 rounded-input focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs font-semibold text-brandText"
                        />
                        <span className="font-bold text-slate-500">{pricingUnit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingActual}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-btn shadow-sm transition-colors ${
                    isSavingActual 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-teal-800 hover:bg-teal-700'
                  }`}
                >
                  {isSavingActual ? 'Menyimpan...' : 'Simpan & Hitung Ulang Harga'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column - Cash Payment entry */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-card border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-brandText">Pembayaran Kurir</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Jika pelanggan membayar cash/transfer ke kurir saat jemput/antar, rekam langsung di sini.
              </p>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Status Lunas:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                order.is_paid 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-red-50 text-error border-red-100'
              }`}>
                {order.is_paid ? 'LUNAS (VERIFIED)' : 'BELUM BAYAR'}
              </span>
            </div>

            {order.is_paid ? (
              <div className="p-4 bg-emerald-50 rounded-card border border-emerald-100 text-center space-y-1.5">
                <span className="text-2xl">💰</span>
                <p className="text-xs font-bold text-emerald-800">Pembayaran Terverifikasi</p>
                <p className="text-[9px] text-emerald-600">Seluruh tagihan telah lunas tercatat di sistem.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {paymentSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-input text-success text-[10px] font-bold">
                    {paymentSuccess}
                  </div>
                )}
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-input text-error text-[10px] font-bold">
                    {paymentError}
                  </div>
                )}

                <form onSubmit={handleStaffPaymentUpload} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-brandText bg-white"
                    >
                      <option value="cash">Cash (Tunai Ke Kurir)</option>
                      <option value="transfer">Bank Transfer / QRIS Kurir</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Jumlah Uang (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-input text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-brandText"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Foto Bukti Bayar / Nota Cash (Opsional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-btn file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingPayment}
                    className={`w-full py-2.5 text-xs font-bold text-white rounded-btn shadow-sm transition-colors ${
                      isUploadingPayment 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-teal-900 hover:bg-teal-800'
                    }`}
                  >
                    {isUploadingPayment ? 'Mengirim...' : 'Konfirmasi Cash Lunas'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetail;

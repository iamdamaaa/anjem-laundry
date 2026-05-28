<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesanan Diterima</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 32px; line-height: 1.6; }
        .intro { font-size: 16px; font-weight: 500; color: #334155; margin-bottom: 24px; }
        .order-details { width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f1f5f9; border-radius: 8px; overflow: hidden; }
        .order-details th { text-align: left; padding: 12px 16px; background-color: #e2e8f0; font-weight: 600; color: #475569; font-size: 13px; text-transform: uppercase; }
        .order-details td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px; }
        .order-details tr:last-child td { border-bottom: none; }
        .total-row td { font-weight: 700; color: #1e293b; font-size: 15px; background-color: #e2e8f0; }
        .button-container { text-align: center; margin: 32px 0 16px 0; }
        .button { display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
        .footer a { color: #4f46e5; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Pesanan Diterima</h1>
            </div>
            <div class="content">
                <p class="intro">Halo {{ $order->user->name }},</p>
                <p>Terima kasih telah memesan layanan di <strong>Anjem Laundry</strong>! Pesanan Anda telah kami terima dan akan segera diproses untuk penjemputan oleh kurir kami.</p>
                
                <p>Berikut adalah rincian pesanan Anda:</p>
                <table class="order-details">
                    <thead>
                        <tr>
                            <th>Layanan</th>
                            <th>Jumlah / Berat</th>
                            <th>Estimasi Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr>
                                <td>{{ $item->service_name_snapshot }}</td>
                                <td>
                                    @if($item->pricing_type_snapshot === 'by_weight')
                                        {{ number_format($item->weight_kg, 1) }} kg
                                    @else
                                        {{ $item->quantity }} pcs
                                    @endif
                                </td>
                                <td>Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                        <tr class="total-row">
                            <td colspan="2">Total Estimasi Harga</td>
                            <td>Rp {{ number_format($order->total_price, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>

                <p>Anda dapat memantau status pengerjaan secara langsung atau mengunduh invoice digital Anda kapan saja melalui tautan di bawah ini:</p>
                
                <div class="button-container">
                    <a href="{{ config('app.url') }}/invoice/{{ $order->invoice_token }}" class="button" target="_blank">Lihat Invoice Digital</a>
                </div>
            </div>
            <div class="footer">
                <p>Ini adalah email otomatis, mohon tidak membalas email ini.<br>&copy; {{ date('Y') }} Anjem Laundry. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>

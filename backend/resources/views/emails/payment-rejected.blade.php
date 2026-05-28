<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pembayaran Ditolak</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 32px; line-height: 1.6; }
        .intro { font-size: 16px; font-weight: 500; color: #334155; margin-bottom: 24px; }
        .rejection-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 24px 0; color: #991b1b; font-size: 14px; font-weight: 500; }
        .button-container { text-align: center; margin: 32px 0 16px 0; }
        .button { display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2); }
        .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Pembayaran Ditolak</h1>
            </div>
            <div class="content">
                <p class="intro">Halo {{ $order->user->name }},</p>
                <p>Kami mohon maaf, unggahan bukti pembayaran Anda untuk pesanan nomor <strong>#{{ $order->order_number }}</strong> **tidak dapat kami konfirmasi**.</p>
                
                <p>Berikut adalah alasan penolakan dari tim administrasi kami:</p>
                <div class="rejection-box">
                    <strong>Alasan Penolakan:</strong> {{ $rejection_reason }}
                </div>

                <p>Harap periksa kembali bukti transfer Anda atau lakukan transfer ulang jika jumlah dana tidak sesuai. Silakan klik tombol di bawah untuk mengunggah ulang bukti bayar yang valid:</p>

                <div class="button-container">
                    <a href="{{ config('app.url') }}/invoice/{{ $order->invoice_token }}" class="button" target="_blank">Unggah Ulang Bukti Bayar</a>
                </div>
            </div>
            <div class="footer">
                <p>Ini adalah email otomatis, mohon tidak membalas email ini.<br>&copy; {{ date('Y') }} Anjem Laundry. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>

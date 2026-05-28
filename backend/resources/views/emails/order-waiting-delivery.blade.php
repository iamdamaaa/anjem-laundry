<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesanan Menunggu Pengiriman</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 32px; line-height: 1.6; }
        .intro { font-size: 16px; font-weight: 500; color: #334155; margin-bottom: 24px; }
        .button-container { text-align: center; margin: 32px 0 16px 0; }
        .button { display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2); }
        .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Pesanan Selesai Diproses</h1>
            </div>
            <div class="content">
                <p class="intro">Halo {{ $order->user->name }},</p>
                <p>Proses pembersihan pakaian Anda untuk pesanan nomor <strong>#{{ $order->order_number }}</strong> saat ini **telah selesai dilakukan dengan bersih dan rapi**!</p>
                
                <p>Layanan kami telah melipat dan menyetrika pakaian Anda dengan higienis. Pakaian Anda saat ini sedang menunggu antrean pengiriman untuk segera diantarkan kembali menuju ke alamat Anda.</p>

                <p>Anda dapat melihat rincian alamat tujuan atau mengunduh invoice digital melalui tautan di bawah:</p>
                
                <div class="button-container">
                    <a href="{{ config('app.url') }}/invoice/{{ $order->invoice_token }}" class="button" target="_blank">Lihat Detail Pesanan</a>
                </div>
            </div>
            <div class="footer">
                <p>Ini adalah email otomatis, mohon tidak membalas email ini.<br>&copy; {{ date('Y') }} Anjem Laundry. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
